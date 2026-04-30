const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { sendSMS } = require('../services/africastalking');
const { sendWhatsApp } = require('../services/whatsapp');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
router.use(authenticate, requireRole('LANDLORD', 'ADMIN'));

// ─── Send / Schedule Broadcast ────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  const { propertyId, message, channel = 'SMS', futureAt } = req.body;
  const landlordId = req.user.id;

  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    // Collect recipients
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        unit: {
          property: {
            landlordId,
            ...(propertyId && { id: propertyId }),
          },
        },
      },
      select: { phone: true, name: true },
    });

    if (tenants.length === 0) return res.status(400).json({ error: 'No active tenants found' });

    const record = await prisma.broadcastMessage.create({
      data: {
        landlordId,
        propertyId: propertyId || null,
        message,
        channel,
        scheduledAt: futureAt ? new Date(futureAt) : null,
        recipientCount: tenants.length,
        status: futureAt ? 'PENDING' : 'SENT',
        sentAt: futureAt ? null : new Date(),
      },
    });

    // If scheduled for future, don't send now
    if (futureAt && new Date(futureAt) > new Date()) {
      return res.json({
        message: `Broadcast scheduled for ${new Date(futureAt).toISOString()}`,
        broadcastId: record.id,
        recipientCount: tenants.length,
      });
    }

    // Send immediately
    const phones = tenants.map((t) => t.phone);

    if (channel === 'SMS' || channel === 'BOTH') {
      await sendSMS(phones, message);
    }

    if (channel === 'WHATSAPP' || channel === 'BOTH') {
      await Promise.allSettled(
        phones.map((p) => sendWhatsApp(p, message))
      );
    }

    logger.info('Broadcast sent', { landlordId, channel, count: tenants.length });
    res.json({ message: 'Broadcast sent', broadcastId: record.id, recipientCount: tenants.length });
  } catch (err) { next(err); }
});

// ─── Broadcast History ────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const broadcasts = await prisma.broadcastMessage.findMany({
      where: { landlordId: req.user.id },
      include: { property: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(broadcasts);
  } catch (err) { next(err); }
});

// ─── Process scheduled broadcasts (called by cron) ───────────────────────────

async function processScheduledBroadcasts() {
  const pending = await prisma.broadcastMessage.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: new Date() },
    },
  });

  for (const broadcast of pending) {
    try {
      const tenants = await prisma.tenant.findMany({
        where: {
          isActive: true,
          unit: {
            property: {
              landlordId: broadcast.landlordId,
              ...(broadcast.propertyId && { id: broadcast.propertyId }),
            },
          },
        },
        select: { phone: true },
      });

      const phones = tenants.map((t) => t.phone);
      if (broadcast.channel === 'SMS' || broadcast.channel === 'BOTH') {
        await sendSMS(phones, broadcast.message);
      }
      if (broadcast.channel === 'WHATSAPP' || broadcast.channel === 'BOTH') {
        await Promise.allSettled(phones.map((p) => sendWhatsApp(p, broadcast.message)));
      }

      await prisma.broadcastMessage.update({
        where: { id: broadcast.id },
        data: { status: 'SENT', sentAt: new Date(), recipientCount: phones.length },
      });

      logger.info('Scheduled broadcast sent', { broadcastId: broadcast.id });
    } catch (err) {
      logger.error('Scheduled broadcast failed', { broadcastId: broadcast.id, error: err.message });
      await prisma.broadcastMessage.update({ where: { id: broadcast.id }, data: { status: 'FAILED' } });
    }
  }
}

module.exports = router;
module.exports.processScheduledBroadcasts = processScheduledBroadcasts;
