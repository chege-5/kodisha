const router = require('express').Router();
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
router.use(authenticate);

// ─── Airtime Rewards History ──────────────────────────────────────────────────

router.get('/', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const landlordId = req.user.id;
  try {
    const rewards = await prisma.airtimeReward.findMany({
      where: { tenant: { unit: { property: { landlordId } } } },
      include: { tenant: { select: { name: true, phone: true, unit: { select: { unitNumber: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTotal = await prisma.airtimeReward.aggregate({
      where: {
        tenant: { unit: { property: { landlordId } } },
        createdAt: { gte: monthStart },
        status: 'SENT',
      },
      _sum: { amount: true },
    });

    res.json({
      rewards,
      monthlyTotal: parseFloat(monthlyTotal._sum.amount || 0),
      cap: (await prisma.landlord.findUnique({ where: { id: landlordId }, select: { monthlyAirtimeCap: true } }))?.monthlyAirtimeCap,
    });
  } catch (err) { next(err); }
});

// ─── Update airtime cap ───────────────────────────────────────────────────────

router.patch('/cap', requireRole('LANDLORD'), async (req, res, next) => {
  const { cap } = req.body;
  if (!cap || isNaN(cap)) return res.status(400).json({ error: 'cap (number) required' });
  try {
    await prisma.landlord.update({
      where: { id: req.user.id },
      data: { monthlyAirtimeCap: parseInt(cap) },
    });
    res.json({ message: `Monthly airtime cap updated to KSh ${cap}` });
  } catch (err) { next(err); }
});

module.exports = router;
