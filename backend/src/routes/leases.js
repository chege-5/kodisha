const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { generateLease } = require('../services/leaseGenerator');

router.use(authenticate);

router.post('/generate', requireRole('LANDLORD'), async (req, res, next) => {
  const { tenantId, unitId, customTerms } = req.body;
  if (!tenantId || !unitId) return res.status(400).json({ error: 'tenantId and unitId required' });

  try {
    const result = await generateLease({ tenantId, unitId, landlordId: req.user.id, customTerms });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

module.exports = router;
