const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { predictOverdueTenants, getRevenueSummary, getOccupancyStats, processNaturalLanguageQuery } = require('../services/aiService');

router.use(authenticate);

// ─── Overdue prediction ──────────────────────────────────────────────────────

router.get('/overdue-prediction', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const landlordId = req.user.role === 'LANDLORD' ? req.user.id : req.query.landlordId;
  try {
    const predictions = await predictOverdueTenants(landlordId);
    res.json({
      high: predictions.filter((p) => p.riskLevel === 'HIGH'),
      medium: predictions.filter((p) => p.riskLevel === 'MEDIUM'),
      low: predictions.filter((p) => p.riskLevel === 'LOW'),
      totalAtRisk: predictions.filter((p) => p.riskLevel !== 'LOW').length,
    });
  } catch (err) { next(err); }
});

// ─── Revenue summary ─────────────────────────────────────────────────────────

router.get('/revenue', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const landlordId = req.user.role === 'LANDLORD' ? req.user.id : req.query.landlordId;
  const months = Number(req.query.months) || 6;
  try {
    const summary = await getRevenueSummary(landlordId, months);
    res.json(summary);
  } catch (err) { next(err); }
});

// ─── Occupancy stats ─────────────────────────────────────────────────────────

router.get('/occupancy', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const landlordId = req.user.role === 'LANDLORD' ? req.user.id : req.query.landlordId;
  try {
    const stats = await getOccupancyStats(landlordId);
    res.json(stats);
  } catch (err) { next(err); }
});

// ─── Natural language query ──────────────────────────────────────────────────

router.post('/query', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  const landlordId = req.user.role === 'LANDLORD' ? req.user.id : req.body.landlordId;
  try {
    const result = await processNaturalLanguageQuery(query, landlordId);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
