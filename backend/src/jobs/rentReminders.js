const cron = require('node-cron');
const prisma = require('../utils/prismaClient');
const { sendSMS } = require('../services/africastalking');
const logger = require('../utils/logger');

async function sendRentReminders() {
  logger.info('Running rent reminder job');
  const now = new Date();

  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: { unit: true },
    });

    const batchSize = 50;
    for (let i = 0; i < tenants.length; i += batchSize) {
      const batch = tenants.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map((t) =>
          sendSMS(
            t.phone,
            t.unit
              ? `KODI Reminder: Your rent of KSh ${parseFloat(t.unit.rentAmount).toLocaleString('en-KE')} is due on 1st ${now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}. Dial *${process.env.AT_USSD_CODE} or reply PAY via WhatsApp.`
              : `KODI: Your rent is due. Contact your landlord for details.`
          )
        )
      );
    }

    logger.info('Rent reminders sent', { count: tenants.length });
  } catch (err) {
    logger.error('Rent reminder job failed', { error: err.message });
  }
}

async function sendLateWarnings() {
  logger.info('Running late payment warning job');
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        unit: true,
        payments: { where: { periodMonth: month, periodYear: year }, select: { amount: true } },
      },
    });

    const overdue = tenants.filter((t) => {
      if (!t.unit) return false;
      const paid = t.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
      return paid < parseFloat(t.unit.rentAmount);
    });

    await Promise.allSettled(
      overdue.map((t) => {
        const paid = t.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
        const balance = parseFloat(t.unit.rentAmount) - paid;
        return sendSMS(
          t.phone,
          `KODI Late Notice: KSh ${balance.toLocaleString('en-KE')} is OVERDUE for ${now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}. Please pay immediately to avoid penalties. Dial *${process.env.AT_USSD_CODE}.`
        );
      })
    );

    logger.info('Late warnings sent', { count: overdue.length });
  } catch (err) {
    logger.error('Late warning job failed', { error: err.message });
  }
}

function scheduleRentReminders() {
  // 1st of every month at 8:00 AM
  cron.schedule('0 8 1 * *', sendRentReminders, { timezone: 'Africa/Nairobi' });
  // 6th of every month at 9:00 AM — late warnings
  cron.schedule('0 9 6 * *', sendLateWarnings, { timezone: 'Africa/Nairobi' });
  // Process scheduled broadcasts every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    const { processScheduledBroadcasts } = require('../routes/broadcast');
    await processScheduledBroadcasts().catch((e) => logger.error('Broadcast cron error', { error: e.message }));
  });
}

module.exports = { scheduleRentReminders, sendRentReminders, sendLateWarnings };
