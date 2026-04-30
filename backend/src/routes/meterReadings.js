const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { recordMeterReading, getUnitReadings, getLandlordReadings } = require('../services/waterBillService');
const logger = require('../utils/logger');

router.use(authenticate);

// ─── Upload meter reading ────────────────────────────────────────────────────

router.post('/', requireRole('CARETAKER', 'LANDLORD'), async (req, res, next) => {
  const { unitId, currentReading, periodMonth, periodYear, notes } = req.body;
  if (!unitId || currentReading === undefined) {
    return res.status(400).json({ error: 'unitId and currentReading required' });
  }

  const now = new Date();
  try {
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
    const result = await getUnitReadings(req.params.unitId, { page: Number(page), limit: Number(limit) });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── Get all readings (landlord/caretaker view) ──────────────────────────────

router.get('/', requireRole('LANDLORD', 'CARETAKER', 'ADMIN'), async (req, res, next) => {
  const { periodMonth, periodYear, page, limit } = req.query;
  const landlordId = req.user.role === 'LANDLORD' ? req.user.id : req.user.landlordId;
  try {
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
