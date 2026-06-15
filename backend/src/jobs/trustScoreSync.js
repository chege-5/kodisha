const cron = require('node-cron');
const prisma = require('../utils/prismaClient');
const { recalculate } = require('../services/trustScore');
const logger = require('../utils/logger');

async function syncAllTrustScores() {
  logger.info('Running trust score sync job');
  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const t of tenants) {
      await recalculate(t.id).catch((e) =>
        logger.error('TrustScore recalc failed', { tenantId: t.id, error: e.message })
      );
    }

    logger.info('Trust scores synced', { count: tenants.length });
  } catch (err) {
    logger.error('Trust score sync job failed', { error: err.message });
  }
}

function scheduleTrustScoreSync() {
  // Daily at midnight
  cron.schedule('0 0 * * *', syncAllTrustScores, { timezone: 'Africa/Nairobi' });
}

module.exports = { scheduleTrustScoreSync, syncAllTrustScores };
