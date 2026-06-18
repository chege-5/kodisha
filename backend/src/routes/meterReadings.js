const router = require('express').Router();
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { recordMeterReading, getUnitReadings, getLandlordReadings } = require('../services/waterBillService');

router.use(authenticate);

async function getScopedLandlordId(req) {
  if (req.user.role === 'LANDLORD' || req.user.role === 'ADMIN') return req.user.id;
  if (req.user.role === 'CARETAKER') {
    const caretaker = await prisma.caretaker.findUnique({
      where: { id: req.user.id },
      select: { landlordId: true, isActive: true, permissions: true },
    });
    if (!caretaker?.isActive || !caretaker.permissions.includes('METER_READINGS')) return null;
    return caretaker.landlordId;
  }
  return null;
}

// ─── Upload meter reading ────────────────────────────────────────────────────

router.post('/', requireRole('CARETAKER', 'LANDLORD'), async (req, res, next) => {
  const { unitId, currentReading, periodMonth, periodYear, notes } = req.body;
  if (!unitId || currentReading === undefined) {
    return res.status(400).json({ error: 'unitId and currentReading required' });
  }

  const now = new Date();
  try {
    const landlordId = await getScopedLandlordId(req);
    if (!landlordId) return res.status(403).json({ error: 'You do not have access to record meter readings.' });

    const unit = await prisma.unit.findFirst({ where: { id: unitId, property: { landlordId } }, select: { id: true } });
    if (!unit) return res.status(403).json({ error: 'That unit is outside your assigned portfolio.' });

    const result = await recordMeterReading({
      unitId,
      currentReading: Number(currentReading),
      periodMonth: periodMonth || now.getMonth() + 1,
      periodYear: periodYear || now.getFullYear(),
      readBy: req.user.id,
      notes,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// ─── Get readings for a unit ─────────────────────────────────────────────────

router.get('/unit/:unitId', async (req, res, next) => {
  const { page, limit } = req.query;
  try {
    const landlordId = await getScopedLandlordId(req);
    if (!landlordId) return res.status(403).json({ error: 'You do not have access to these readings.' });

    const unit = await prisma.unit.findFirst({ where: { id: req.params.unitId, property: { landlordId } }, select: { id: true } });
    if (!unit) return res.status(403).json({ error: 'That unit is outside your assigned portfolio.' });

    const result = await getUnitReadings(req.params.unitId, { page: Number(page), limit: Number(limit) });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── Get all readings (landlord/caretaker view) ──────────────────────────────

router.get('/', requireRole('LANDLORD', 'CARETAKER', 'ADMIN'), async (req, res, next) => {
  const { periodMonth, periodYear, page, limit } = req.query;
  try {
    const landlordId = await getScopedLandlordId(req);
    if (!landlordId) return res.status(403).json({ error: 'You do not have access to these readings.' });

    const result = await getLandlordReadings(landlordId, {
      periodMonth: periodMonth ? Number(periodMonth) : undefined,
      periodYear: periodYear ? Number(periodYear) : undefined,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
