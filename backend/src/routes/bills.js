const router = require('express').Router();
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { getTenantBills, getLandlordBills, generateMonthlyRentBills, linkPaymentToBill } = require('../services/billService');
const logger = require('../utils/logger');

router.use(authenticate);

async function getScopedLandlordId(req) {
  if (req.user.role === 'LANDLORD' || req.user.role === 'ADMIN') return req.user.id;
  if (req.user.role === 'CARETAKER') {
    const caretaker = await prisma.caretaker.findUnique({ where: { id: req.user.id }, select: { landlordId: true, isActive: true } });
    if (!caretaker?.isActive) return null;
    return caretaker.landlordId;
  }
  return null;
}

// ─── Get bills (role-aware) ──────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  const { type, status, page, limit } = req.query;
  try {
    if (req.user.role === 'TENANT') {
      const result = await getTenantBills(req.user.id, { type, status, page: Number(page), limit: Number(limit) });
      return res.json(result);
    }
    const landlordId = await getScopedLandlordId(req);
    if (!landlordId) return res.status(403).json({ error: 'You do not have access to these bills.' });
    const result = await getLandlordBills(landlordId, { type, status, page: Number(page), limit: Number(limit) });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── Get single bill ─────────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const where = req.user.role === 'TENANT'
      ? { id: req.params.id, tenantId: req.user.id }
      : { id: req.params.id, unit: { property: { landlordId: await getScopedLandlordId(req) } } };

    if (!where.unit?.property?.landlordId && req.user.role !== 'TENANT') {
      return res.status(403).json({ error: 'You do not have access to this bill.' });
    }

    const bill = await prisma.bill.findFirst({
      where,
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        unit: { select: { unitNumber: true, property: { select: { name: true } } } },
        payments: true,
      },
    });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (err) { next(err); }
});

// ─── Create bill manually ────────────────────────────────────────────────────

router.post('/', requireRole('LANDLORD', 'CARETAKER'), async (req, res, next) => {
  const { tenantId, unitId, type, amount, dueDate, description, periodMonth, periodYear } = req.body;
  if (!tenantId || !unitId || !type || !amount) {
    return res.status(400).json({ error: 'tenantId, unitId, type, amount required' });
  }
  try {
    const landlordId = await getScopedLandlordId(req);
    if (!landlordId) return res.status(403).json({ error: 'You do not have access to this property.' });

    const unit = await prisma.unit.findFirst({
      where: { id: unitId, property: { landlordId } },
      include: { property: { select: { landlordId: true } } },
    });
    if (!unit) return res.status(403).json({ error: 'That unit does not belong to your property portfolio.' });

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, unitId, unit: { property: { landlordId } } },
    });
    if (!tenant) return res.status(403).json({ error: 'That tenant is not assigned to the selected unit.' });

    const now = new Date();
    const bill = await prisma.bill.create({
      data: {
        tenantId, unitId, type, amount,
        dueDate: dueDate ? new Date(dueDate) : new Date(now.getFullYear(), now.getMonth(), 5),
        description,
        periodMonth: periodMonth || now.getMonth() + 1,
        periodYear: periodYear || now.getFullYear(),
      },
    });
    res.status(201).json(bill);
  } catch (err) { next(err); }
});

// ─── Generate monthly rent bills ──────────────────────────────────────────────

router.post('/generate-rent', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  try {
    const landlordId = await getScopedLandlordId(req);
    if (!landlordId) return res.status(403).json({ error: 'You do not have access to this landlord account.' });

    const result = await generateMonthlyRentBills(landlordId);
    res.json({
      message: `${result.bills.length} rent bill(s) generated and SMS notifications sent immediately`,
      generatedCount: result.bills.length,
      skippedCount: result.skipped.length,
      smsSentCount: result.notified.length,
      smsFailedCount: result.notificationFailures.length,
      periodMonth: result.periodMonth,
      periodYear: result.periodYear,
      bills: result.bills,
      skipped: result.skipped,
      notificationFailures: result.notificationFailures,
    });
  } catch (err) { next(err); }
});

// ─── Link payment to bill ────────────────────────────────────────────────────

router.post('/:id/link-payment', requireRole('LANDLORD', 'CARETAKER', 'ADMIN'), async (req, res, next) => {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
  try {
    const landlordId = await getScopedLandlordId(req);
    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id, unit: { property: { landlordId } } },
    });
    if (!bill) return res.status(403).json({ error: 'You do not have access to this bill.' });

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenant: { unit: { property: { landlordId } } } },
    });
    if (!payment) return res.status(403).json({ error: 'You do not have access to that payment.' });

    const result = await linkPaymentToBill(paymentId, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

// ─── Update bill status ──────────────────────────────────────────────────────

router.patch('/:id', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const { status } = req.body;
  try {
    const landlordId = await getScopedLandlordId(req);
    const existing = await prisma.bill.findFirst({ where: { id: req.params.id, unit: { property: { landlordId } } } });
    if (!existing) return res.status(403).json({ error: 'You do not have access to this bill.' });

    const bill = await prisma.bill.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(bill);
  } catch (err) { next(err); }
});

module.exports = router;
