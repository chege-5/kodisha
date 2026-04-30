const router = require('express').Router();
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { getTenantBills, getLandlordBills, generateMonthlyRentBills, linkPaymentToBill } = require('../services/billService');
const logger = require('../utils/logger');

router.use(authenticate);

// ─── Get bills (role-aware) ──────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  const { type, status, page, limit } = req.query;
  try {
    if (req.user.role === 'TENANT') {
      const result = await getTenantBills(req.user.id, { type, status, page: Number(page), limit: Number(limit) });
      return res.json(result);
    }
    const landlordId = req.user.role === 'LANDLORD' ? req.user.id : req.user.landlordId;
    const result = await getLandlordBills(landlordId, { type, status, page: Number(page), limit: Number(limit) });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── Get single bill ─────────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
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
    const landlordId = req.user.role === 'LANDLORD' ? req.user.id : req.body.landlordId;
    const bills = await generateMonthlyRentBills(landlordId);
    res.json({ message: `${bills.length} rent bill(s) generated`, bills });
  } catch (err) { next(err); }
});

// ─── Link payment to bill ────────────────────────────────────────────────────

router.post('/:id/link-payment', requireRole('LANDLORD', 'CARETAKER', 'ADMIN'), async (req, res, next) => {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
  try {
    const result = await linkPaymentToBill(paymentId, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

// ─── Update bill status ──────────────────────────────────────────────────────

router.patch('/:id', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const { status } = req.body;
  try {
    const bill = await prisma.bill.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(bill);
  } catch (err) { next(err); }
});

module.exports = router;
