const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');

const BASE_SCORE = 500;

// Delta rules (in days late)
const DELTAS = {
  ON_TIME: +20,
  THREE_CONSECUTIVE: +50,
  LATE_1_5: -30,
  LATE_6_14: -60,
  LATE_15_PLUS: -100,
};

function scoreDeltaForDaysLate(daysLate) {
  if (daysLate === 0) return DELTAS.ON_TIME;
  if (daysLate <= 5) return DELTAS.LATE_1_5;
  if (daysLate <= 14) return DELTAS.LATE_6_14;
  return DELTAS.LATE_15_PLUS;
}

function getTier(score) {
  if (score >= 750) return 'Excellent';
  if (score >= 600) return 'Good';
  if (score >= 400) return 'Fair';
  return 'Poor';
}

async function recalculate(tenantId) {
  const payments = await prisma.payment.findMany({
    where: { tenantId },
    orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
  });

  let score = BASE_SCORE;
  let consecutiveOnTime = 0;
  let totalMonths = 0;
  let onTimeMonths = 0;
  let lateMonths = 0;
  let partialMonths = 0;
  let totalDaysLate = 0;

  for (const p of payments) {
    totalMonths++;
    const delta = scoreDeltaForDaysLate(p.daysLate);
    score += delta;

    if (p.daysLate === 0 && !p.isPartial) {
      onTimeMonths++;
      consecutiveOnTime++;

      // Bonus for streaks
      if (consecutiveOnTime === 3) score += DELTAS.THREE_CONSECUTIVE;
      if (consecutiveOnTime === 6) score += DELTAS.THREE_CONSECUTIVE;
      if (consecutiveOnTime === 12) score += DELTAS.THREE_CONSECUTIVE;
    } else {
      consecutiveOnTime = 0;
      if (p.isPartial) partialMonths++;
      if (p.daysLate > 0) {
        lateMonths++;
        totalDaysLate += p.daysLate;
      }
    }

    // Clamp between 100 and 900
    score = Math.min(900, Math.max(100, score));
  }

  const averageDaysLate = lateMonths > 0 ? (totalDaysLate / lateMonths).toFixed(2) : 0;
  const missedMonths = 0; // Extend later with lease period logic

  // Upsert TrustScore
  await prisma.trustScore.upsert({
    where: { tenantId },
    create: { tenantId, score, lastUpdated: new Date() },
    update: { score, lastUpdated: new Date() },
  });

  // Upsert CreditPassport
  await prisma.creditPassport.upsert({
    where: { tenantId },
    create: {
      tenantId,
      totalMonths,
      onTimeMonths,
      lateMonths,
      partialMonths,
      missedMonths,
      averageDaysLate,
      lastUpdated: new Date(),
    },
    update: {
      totalMonths,
      onTimeMonths,
      lateMonths,
      partialMonths,
      missedMonths,
      averageDaysLate,
      lastUpdated: new Date(),
    },
  });

  logger.info('TrustScore recalculated', { tenantId, score, tier: getTier(score) });

  return {
    score,
    tier: getTier(score),
    consecutiveOnTime,
    totalMonths,
    onTimeMonths,
    lateMonths,
  };
}

async function getScore(tenantId) {
  const ts = await prisma.trustScore.findUnique({ where: { tenantId } });
  if (!ts) return { score: BASE_SCORE, tier: getTier(BASE_SCORE) };
  return { score: ts.score, tier: getTier(ts.score) };
}

// Check if airtime reward should be sent after a payment
async function checkAirtimeEligibility(tenantId) {
  const payments = await prisma.payment.findMany({
    where: { tenantId },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    take: 12,
  });

  let consecutive = 0;
  for (const p of payments) {
    if (p.daysLate === 0 && !p.isPartial) consecutive++;
    else break;
  }

  const rewardMap = {
    3: parseInt(process.env.REWARD_3_MONTHS_KES) || 30,
    6: parseInt(process.env.REWARD_6_MONTHS_KES) || 75,
    12: parseInt(process.env.REWARD_12_MONTHS_KES) || 150,
  };

  return rewardMap[consecutive] || null;
}

module.exports = { recalculate, getScore, getTier, checkAirtimeEligibility };
