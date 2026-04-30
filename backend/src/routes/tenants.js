const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { getScore } = require('../services/trustScore');
const { sendSMS } = require('../services/africastalking');
const { notifyIssueCreated } = require('../services/issueMessaging');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
router.use(authenticate);

async function getScopedLandlordId(req) {
  if (req.user.role === 'LANDLORD' || req.user.role === 'ADMIN') return req.user.id;
  if (req.user.role === 'CARETAKER') {
    const caretaker = await prisma.caretaker.findUnique({
      where: { id: req.user.id },
      select: { landlordId: true, isActive: true },
    });
    if (!caretaker?.isActive) return null;
    return caretaker.landlordId;
  }
  return null;
}

// ─── List tenants ─────────────────────────────────────────────────────────────

router.get('/', requireRole('LANDLORD', 'CARETAKER', 'ADMIN'), async (req, res, next) => {
  const { propertyId, search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const landlordId = await getScopedLandlordId(req);
    if (!landlordId) return res.status(403).json({ error: 'You do not have access to these tenants.' });

    const where = {
      unit: { property: { landlordId, ...(propertyId && { id: propertyId }) } },
      isActive: true,
      ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] }),
    };

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          unit: { include: { property: { select: { name: true } } } },
          trustScore: { select: { score: true } },
          _count: { select: { payments: true, tickets: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ]);

    const safe = tenants.map(({ passwordHash, idNumber, ...t }) => ({
      ...t,
      trustScore: t.trustScore
        ? { ...t.trustScore, tier: require('../services/trustScore').getTier(t.trustScore.score) }
        : null,
    }));
    res.json({ tenants: safe, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// ─── Get single tenant ────────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        unit: { include: { property: true } },
        payments: { orderBy: { paymentDate: 'desc' }, take: 24 },
        tickets: { orderBy: { createdAt: 'desc' }, take: 10, include: { unit: { select: { unitNumber: true } } } },
        trustScore: true,
        creditPassport: true,
        leases: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    if (req.user.role === 'TENANT' && req.user.id !== tenant.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { passwordHash, idNumber, ...safe } = tenant;
    res.json(safe);
  } catch (err) { next(err); }
});

// ─── Add tenant ───────────────────────────────────────────────────────────────

router.post('/', requireRole('LANDLORD', 'CARETAKER'), async (req, res, next) => {
  const { name, phone, email, idNumber, unitId, leaseStart, leaseEnd, depositAmount, password } = req.body;
  if (!name || !phone || !idNumber || !unitId || !leaseStart || !depositAmount) {
    return res.status(400).json({ error: 'Please provide the tenant name, phone, ID number, unit, lease start date, and deposit amount.' });
  }

  try {
    const landlordId = await getScopedLandlordId(req);
    if (!landlordId) return res.status(403).json({ error: 'You do not have access to add tenants.' });

    const unit = await prisma.unit.findFirst({
      where: { id: unitId, property: { landlordId } },
      include: { property: { select: { name: true, landlordId: true } } },
    });
    if (!unit) return res.status(403).json({ error: 'We could not find that unit under your assigned properties.' });
    if (unit.status === 'OCCUPIED') return res.status(409).json({ error: 'That unit already has an active tenant.' });

    const defaultPassword = password || `KODI${phone.slice(-4)}`;
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const tenant = await prisma.tenant.create({
      data: { name, phone, email, idNumber, unitId, leaseStart: new Date(leaseStart), leaseEnd: leaseEnd ? new Date(leaseEnd) : null, depositAmount, passwordHash },
      select: { id: true, name: true, phone: true, email: true, unitId: true, leaseStart: true, depositAmount: true, createdAt: true },
    });

    await prisma.trustScore.create({ data: { tenantId: tenant.id } });
    await prisma.creditPassport.create({ data: { tenantId: tenant.id } });
    await prisma.unit.update({ where: { id: unitId }, data: { status: 'OCCUPIED' } });

    // Welcome SMS
    await sendSMS(phone,
      `Welcome to KODI! You have been registered as a tenant. Your login: Phone ${phone}, Password: ${defaultPassword}. Change your password at ${process.env.FRONTEND_URL}/tenant`
    ).catch(() => {});

    logger.info('Tenant added', { tenantId: tenant.id, createdBy: req.user.role });
    res.status(201).json({ tenant, defaultPassword: password ? undefined : defaultPassword });
  } catch (err) { next(err); }
});

// ─── Update tenant ────────────────────────────────────────────────────────────

router.patch('/:id', requireRole('LANDLORD'), async (req, res, next) => {
  const allowed = ['name', 'phone', 'email', 'leaseEnd', 'depositStatus', 'language'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  try {
    const updated = await prisma.tenant.update({ where: { id: req.params.id }, data, select: { id: true, name: true, phone: true, email: true, leaseEnd: true, depositStatus: true } });
    res.json(updated);
  } catch (err) { next(err); }
});

// ─── Deactivate tenant ────────────────────────────────────────────────────────

router.delete('/:id', requireRole('LANDLORD'), async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    await prisma.tenant.update({ where: { id: req.params.id }, data: { isActive: false, unitId: null } });
    if (tenant.unitId) await prisma.unit.update({ where: { id: tenant.unitId }, data: { status: 'VACANT' } });
    res.json({ message: 'Tenant deactivated and unit marked vacant' });
  } catch (err) { next(err); }
});

// ─── Trust score ──────────────────────────────────────────────────────────────

router.get('/:id/trustscore', async (req, res, next) => {
  try {
    const result = await getScore(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

// ─── Payment history ──────────────────────────────────────────────────────────

router.get('/:id/payments', async (req, res, next) => {
  if (req.user.role === 'TENANT' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const payments = await prisma.payment.findMany({
      where: { tenantId: req.params.id },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
    res.json(payments);
  } catch (err) { next(err); }
});

// ─── Log manual payment ───────────────────────────────────────────────────────

router.post('/:id/payments', requireRole('LANDLORD', 'CARETAKER'), async (req, res, next) => {
  const { amount, channel, notes, paymentDate } = req.body;
  if (!amount || !channel) return res.status(400).json({ error: 'amount and channel required' });

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id }, include: { unit: true } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const date = paymentDate ? new Date(paymentDate) : new Date();
    const dueDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const daysLate = Math.max(0, Math.floor((date - dueDate) / (1000 * 60 * 60 * 24)));

    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        unitId: tenant.unitId,
        amount,
        channel,
        paymentDate: date,
        periodMonth: date.getMonth() + 1,
        periodYear: date.getFullYear(),
        isPartial: parseFloat(amount) < parseFloat(tenant.unit.rentAmount),
        daysLate,
        notes,
      },
    });

    const { recalculate } = require('../services/trustScore');
    await recalculate(tenant.id);

    res.status(201).json(payment);
  } catch (err) { next(err); }
});

// ─── Maintenance ticket (tenant submits from portal) ──────────────────────────

router.post('/:id/tickets', requireRole('TENANT'), async (req, res, next) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });

  const { category, description, unitId } = req.body;
  if (!description) return res.status(400).json({ error: 'description required' });

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id }, include: { unit: true } });
    if (!tenant || !tenant.unitId) return res.status(400).json({ error: 'Tenant has no active unit' });

    const ticket = await prisma.maintenanceTicket.create({
      data: { unitId: tenant.unitId, tenantId: tenant.id, category: category || 'OTHER', description },
    });

    // Notify caretaker
    const property = await prisma.property.findFirst({
      where: { units: { some: { id: tenant.unitId } } },
      include: { landlord: { include: { caretakers: { where: { isActive: true }, take: 1 } } } },
    });
    await notifyIssueCreated({
      ticket,
      tenant,
      unit: tenant.unit,
      landlord: property?.landlord,
      caretaker: property?.landlord?.caretakers?.[0],
    });

    res.status(201).json(ticket);
  } catch (err) { next(err); }
});

module.exports = router;
