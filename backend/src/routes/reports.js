const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { generateITax } = require('../services/itaxExport');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
router.use(authenticate, requireRole('LANDLORD', 'ADMIN'));

// ─── iTax Export ─────────────────────────────────────────────────────────────

router.get('/itax/:landlordId', async (req, res, next) => {
  const { year, quarter = 'ANNUAL' } = req.query;
  const { landlordId } = req.params;

  if (!year) return res.status(400).json({ error: 'year query param required' });

  // Landlords can only export their own reports
  if (req.user.role === 'LANDLORD' && req.user.id !== landlordId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await generateITax(landlordId, parseInt(year), quarter);
    res.json({ message: 'Report generated', ...result });
  } catch (err) { next(err); }
});

// ─── API Usage Summary ────────────────────────────────────────────────────────

router.get('/api-usage', async (req, res, next) => {
  const landlordId = req.user.id;
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [smsSent, ussdSessions, broadcasts] = await Promise.all([
      // Approximate: count broadcast messages + individual SMS (not directly tracked yet)
      prisma.broadcastMessage.aggregate({
        where: { landlordId, sentAt: { gte: monthStart } },
        _sum: { recipientCount: true },
        _count: true,
      }),
      prisma.ussdSession.count({
        where: {
          OR: [{ landlordId }, { tenantId: { not: null } }],
          createdAt: { gte: monthStart },
        },
      }),
      prisma.broadcastMessage.count({ where: { landlordId, sentAt: { gte: monthStart } } }),
    ]);

    res.json({
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      smsSent: (smsSent._sum.recipientCount || 0) + (smsSent._count || 0),
      ussdSessions,
      broadcastsSent: broadcasts,
    });
  } catch (err) { next(err); }
});

// ─── Trust Score Leaderboard ─────────────────────────────────────────────────

router.get('/trust-leaderboard', async (req, res, next) => {
  const landlordId = req.user.id;
  try {
    const scores = await prisma.trustScore.findMany({
      where: { tenant: { unit: { property: { landlordId } } } },
      orderBy: { score: 'desc' },
      take: 10,
      include: {
        tenant: {
          select: { id: true, name: true, phone: true, unit: { select: { unitNumber: true } } },
        },
      },
    });

    const { getTier } = require('../services/trustScore');
    const leaderboard = scores.map((s, idx) => ({
      rank: idx + 1,
      tenantId: s.tenant.id,
      name: s.tenant.name,
      unit: s.tenant.unit?.unitNumber,
      score: s.score,
      tier: getTier(s.score),
    }));

    res.json(leaderboard);
  } catch (err) { next(err); }
});

// ─── Yield Calculator ─────────────────────────────────────────────────────────

router.get('/yield/:propertyId', async (req, res, next) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.user.id },
      include: {
        units: {
          include: {
            payments: {
              where: { periodYear: new Date().getFullYear() },
              select: { amount: true },
            },
          },
        },
      },
    });
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const totalAnnualRent = property.units.reduce((sum, u) => {
      const unitTotal = u.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
      return sum + unitTotal;
    }, 0);

    const grossYield = req.query.propertyValue
      ? ((totalAnnualRent / parseFloat(req.query.propertyValue)) * 100).toFixed(2)
      : null;

    res.json({
      propertyId: property.id,
      name: property.name,
      totalUnits: property.units.length,
      occupiedUnits: property.units.filter((u) => u.status === 'OCCUPIED').length,
      annualRentCollected: totalAnnualRent,
      grossYieldPercent: grossYield,
      note: 'Pass ?propertyValue=XXXXX to calculate gross yield percentage.',
    });
  } catch (err) { next(err); }
});

// ─── Previous iTax Reports ────────────────────────────────────────────────────

router.get('/itax-history', async (req, res, next) => {
  try {
    const reports = await prisma.iTaxReport.findMany({
      where: { landlordId: req.user.id },
      orderBy: { generatedAt: 'desc' },
    });
    res.json(reports);
  } catch (err) { next(err); }
});

module.exports = router;
