const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// All landlord routes require auth
router.use(authenticate);

// ─── Dashboard Overview ───────────────────────────────────────────────────────

router.get('/dashboard', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const landlordId = req.user.id;
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      unitStats,
      collectedThisMonth,
      openTickets,
      sixMonthTrend,
      arrearsDetail,
    ] = await Promise.all([
      // Unit counts
      prisma.unit.groupBy({
        by: ['status'],
        where: { property: { landlordId } },
        _count: { status: true },
      }),

      // This month collection
      prisma.payment.aggregate({
        where: {
          paymentDate: { gte: monthStart },
          unit: { property: { landlordId } },
        },
        _sum: { amount: true },
      }),

      // Open tickets
      prisma.maintenanceTicket.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          unit: { property: { landlordId } },
        },
      }),

      // 6-month collection trend
      prisma.payment.groupBy({
        by: ['periodYear', 'periodMonth'],
        where: {
          paymentDate: { gte: sixMonthsAgo },
          unit: { property: { landlordId } },
        },
        _sum: { amount: true },
        orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
      }),

      // Arrears per tenant
      getArrearsDetail(landlordId, now),
    ]);

    const unitMap = Object.fromEntries(unitStats.map((s) => [s.status, s._count.status]));

    res.json({
      overview: {
        collectedThisMonth: parseFloat(collectedThisMonth._sum.amount || 0),
        occupiedUnits: unitMap.OCCUPIED || 0,
        vacantUnits: unitMap.VACANT || 0,
        maintenanceUnits: unitMap.MAINTENANCE || 0,
        openTickets,
        totalArrears: arrearsDetail.reduce((s, t) => s + t.arrears, 0),
      },
      monthlyTrend: sixMonthTrend.map((r) => ({
        month: `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}`,
        collected: parseFloat(r._sum.amount || 0),
      })),
      arrears: arrearsDetail,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Properties list ──────────────────────────────────────────────────────────

router.get('/properties', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const landlordId = req.user.id;
  try {
    const properties = await prisma.property.findMany({
      where: { landlordId },
      include: {
        units: {
          include: {
            tenants: { where: { isActive: true }, select: { id: true, name: true } },
            _count: { select: { tickets: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } } } },
          },
        },
      },
    });
    res.json(properties);
  } catch (err) { next(err); }
});

// ─── Add property ─────────────────────────────────────────────────────────────

router.post('/properties', requireRole('LANDLORD'), async (req, res, next) => {
  const { name, address, county, type } = req.body;
  if (!name || !address || !county) return res.status(400).json({ error: 'name, address, county required' });
  try {
    const property = await prisma.property.create({
      data: { landlordId: req.user.id, name, address, county, type: type || 'APARTMENT' },
    });
    res.status(201).json(property);
  } catch (err) { next(err); }
});

// ─── Add unit ─────────────────────────────────────────────────────────────────

router.post('/properties/:propertyId/units', requireRole('LANDLORD'), async (req, res, next) => {
  const { unitNumber, rentAmount, floor, bedrooms } = req.body;
  if (!unitNumber || !rentAmount) return res.status(400).json({ error: 'unitNumber and rentAmount required' });

  const parsedFloor = parseOptionalInt(floor);
  const parsedBedrooms = parseOptionalInt(bedrooms);
  if (parsedFloor === undefined || parsedBedrooms === undefined) {
    return res.status(400).json({ error: 'floor and bedrooms must be valid whole numbers when provided' });
  }

  try {
    // Verify ownership
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.user.id },
    });
    if (!property) return res.status(403).json({ error: 'Not your property' });

    const unit = await prisma.unit.create({
      data: {
        propertyId: req.params.propertyId,
        unitNumber,
        rentAmount,
        floor: parsedFloor,
        bedrooms: parsedBedrooms,
      },
    });
    res.status(201).json(unit);
  } catch (err) { next(err); }
});

// ─── Add caretaker ────────────────────────────────────────────────────────────

router.post('/caretakers', requireRole('LANDLORD'), async (req, res, next) => {
  const { name, phone, password, permissions } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'name, phone, password required' });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const caretaker = await prisma.caretaker.create({
      data: { landlordId: req.user.id, name, phone, passwordHash, permissions: permissions || [] },
      select: { id: true, name: true, phone: true, permissions: true, createdAt: true },
    });
    res.status(201).json(caretaker);
  } catch (err) { next(err); }
});

// ─── Get my profile ───────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const landlord = await prisma.landlord.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, phone: true, email: true, plan: true, language: true, currencyPref: true, monthlyAirtimeCap: true, createdAt: true },
    });
    if (!landlord) return res.status(404).json({ error: 'Not found' });
    res.json(landlord);
  } catch (err) { next(err); }
});

// ─── Update settings ──────────────────────────────────────────────────────────

router.patch('/me', requireRole('LANDLORD'), async (req, res, next) => {
  const allowed = ['name', 'language', 'currencyPref', 'monthlyAirtimeCap'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  try {
    const updated = await prisma.landlord.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, phone: true, email: true, plan: true, language: true, currencyPref: true, monthlyAirtimeCap: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// ─── Rent Advance ─────────────────────────────────────────────────────────────

router.post('/advance/request', requireRole('LANDLORD'), async (req, res, next) => {
  const { requestedAmount } = req.body;
  if (!requestedAmount) return res.status(400).json({ error: 'requestedAmount required' });
  try {
    const feePercent = parseFloat(process.env.ADVANCE_FEE_PERCENT) || 3;
    const feeAmount = (requestedAmount * feePercent) / 100;
    const netAmount = requestedAmount - feeAmount;

    const advance = await prisma.rentAdvance.create({
      data: { landlordId: req.user.id, requestedAmount, feeAmount, netAmount },
    });
    res.status(201).json({ advance, message: `Advance of KSh ${netAmount.toFixed(2)} will be disbursed after approval (${feePercent}% fee applied).` });
  } catch (err) { next(err); }
});

router.get('/advance/status', requireRole('LANDLORD'), async (req, res, next) => {
  try {
    const advances = await prisma.rentAdvance.findMany({
      where: { landlordId: req.user.id },
      orderBy: { requestedAt: 'desc' },
    });
    res.json(advances);
  } catch (err) { next(err); }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getArrearsDetail(landlordId, now) {
  const tenants = await prisma.tenant.findMany({
    where: { unit: { property: { landlordId } }, isActive: true },
    include: {
      unit: { select: { rentAmount: true, unitNumber: true } },
      payments: {
        where: { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() },
        select: { amount: true },
      },
    },
  });

  return tenants
    .map((t) => {
      const paid = t.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
      const arrears = Math.max(0, parseFloat(t.unit.rentAmount) - paid);
      const daysOverdue = now.getDate() > 1 ? now.getDate() - 1 : 0;
      return { tenantId: t.id, name: t.name, unit: t.unit.unitNumber, phone: t.phone, arrears, daysOverdue };
    })
    .filter((t) => t.arrears > 0)
    .sort((a, b) => b.arrears - a.arrears);
}

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

module.exports = router;
