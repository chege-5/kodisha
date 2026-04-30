const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { convertFromKES, fetchRates, formatCurrency } = require('../services/currencyConverter');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
router.use(authenticate, requireRole('LANDLORD', 'ADMIN'));

// ─── Diaspora Dashboard ───────────────────────────────────────────────────────

router.get('/dashboard/:landlordId', async (req, res, next) => {
  const { landlordId } = req.params;
  if (req.user.role === 'LANDLORD' && req.user.id !== landlordId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const currency = req.query.currency || 'USD';

  try {
    const landlord = await prisma.landlord.findUnique({ where: { id: landlordId } });
    const rates = await fetchRates();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [collected, arrears, units] = await Promise.all([
      prisma.payment.aggregate({
        where: { paymentDate: { gte: monthStart }, unit: { property: { landlordId } } },
        _sum: { amount: true },
      }),
      getArrearsSum(landlordId, now),
      prisma.unit.groupBy({
        by: ['status'],
        where: { property: { landlordId } },
        _count: true,
      }),
    ]);

    const collectedKES = parseFloat(collected._sum.amount || 0);
    const collectedFx = await convertFromKES(collectedKES, currency);
    const arrearsFx = await convertFromKES(arrears, currency);

    const rate = rates[currency] || 1;

    res.json({
      currency,
      exchangeRate: { KES: 1, [currency]: rate },
      collectedThisMonth: {
        KES: collectedKES,
        [currency]: collectedFx,
        formatted: formatCurrency(collectedFx, currency),
      },
      totalArrears: {
        KES: arrears,
        [currency]: arrearsFx,
        formatted: formatCurrency(arrearsFx, currency),
      },
      units: Object.fromEntries(units.map((u) => [u.status, u._count])),
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

// ─── Request Settlement ───────────────────────────────────────────────────────

router.post('/settle/:landlordId', async (req, res, next) => {
  const { landlordId } = req.params;
  const { amount, currency, bankDetails } = req.body;

  if (req.user.role === 'LANDLORD' && req.user.id !== landlordId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const rates = await fetchRates();
    const fxRate = rates[currency] || 1;
    const amountKES = amount / fxRate;

    logger.info('Diaspora settlement requested', { landlordId, amount, currency, fxRate });

    res.json({
      message: 'Settlement request logged. Processing within 2-3 business days.',
      amount,
      currency,
      fxRateUsed: fxRate,
      equivalentKES: amountKES.toFixed(2),
      requestedAt: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

// ─── Property Report PDF ──────────────────────────────────────────────────────

router.post('/report/:propertyId', async (req, res, next) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.user.id },
      include: {
        units: {
          include: {
            tenants: { where: { isActive: true }, select: { name: true, phone: true } },
            tickets: { where: { status: { not: 'CLOSED' } }, select: { category: true, status: true } },
          },
        },
      },
    });

    if (!property) return res.status(404).json({ error: 'Property not found' });

    const summary = {
      property: property.name,
      address: property.address,
      county: property.county,
      totalUnits: property.units.length,
      occupied: property.units.filter((u) => u.status === 'OCCUPIED').length,
      vacant: property.units.filter((u) => u.status === 'VACANT').length,
      openTickets: property.units.reduce((s, u) => s + u.tickets.length, 0),
      generatedAt: new Date().toISOString(),
      units: property.units.map((u) => ({
        unit: u.unitNumber,
        status: u.status,
        tenant: u.tenants[0]?.name || 'Vacant',
        openIssues: u.tickets.length,
      })),
    };

    res.json(summary);
  } catch (err) { next(err); }
});

async function getArrearsSum(landlordId, now) {
  const tenants = await prisma.tenant.findMany({
    where: { unit: { property: { landlordId } }, isActive: true },
    include: {
      unit: { select: { rentAmount: true } },
      payments: {
        where: { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() },
        select: { amount: true },
      },
    },
  });
  return tenants.reduce((sum, t) => {
    const paid = t.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    return sum + Math.max(0, parseFloat(t.unit.rentAmount) - paid);
  }, 0);
}

module.exports = router;
