const cron = require('node-cron');
const prisma = require('../utils/prismaClient');
const nodemailer = require('nodemailer');
const { generateITax } = require('../services/itaxExport');
const logger = require('../utils/logger');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendWeeklyDigest() {
  logger.info('Running weekly digest job');
  const now = new Date();
  const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);

  try {
    const landlords = await prisma.landlord.findMany({
      where: { email: { not: null } },
      select: { id: true, name: true, email: true },
    });

    const transporter = getTransporter();

    for (const landlord of landlords) {
      try {
        const [collected, newTickets, newPayments] = await Promise.all([
          prisma.payment.aggregate({
            where: { paymentDate: { gte: weekStart }, unit: { property: { landlordId: landlord.id } } },
            _sum: { amount: true },
            _count: true,
          }),
          prisma.maintenanceTicket.count({
            where: { createdAt: { gte: weekStart }, unit: { property: { landlordId: landlord.id } } },
          }),
          prisma.payment.count({
            where: { paymentDate: { gte: weekStart }, unit: { property: { landlordId: landlord.id } } },
          }),
        ]);

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <div style="background:#1a365d;color:white;padding:20px;text-align:center">
              <h1 style="margin:0">KODI Weekly Digest</h1>
              <p style="margin:5px 0;opacity:0.8">Week ending ${now.toLocaleDateString('en-KE')}</p>
            </div>
            <div style="padding:24px">
              <p>Hi ${landlord.name},</p>
              <p>Here's your property summary for the past week:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr style="background:#f7fafc">
                  <td style="padding:12px;border:1px solid #e2e8f0">💰 Rent Collected</td>
                  <td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold">
                    KSh ${parseFloat(collected._sum.amount || 0).toLocaleString('en-KE')}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px;border:1px solid #e2e8f0">📝 Payments Received</td>
                  <td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold">${newPayments}</td>
                </tr>
                <tr style="background:#f7fafc">
                  <td style="padding:12px;border:1px solid #e2e8f0">🔧 New Maintenance Tickets</td>
                  <td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold">${newTickets}</td>
                </tr>
              </table>
              <div style="text-align:center;margin-top:24px">
                <a href="${process.env.FRONTEND_URL}"
                   style="background:#1a365d;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">
                  View Full Dashboard
                </a>
              </div>
            </div>
            <div style="background:#f7fafc;padding:12px;text-align:center;font-size:12px;color:#718096">
              KODI Rental Management Platform | Unsubscribe via dashboard settings
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `${process.env.FROM_NAME || 'KODI'} <${process.env.FROM_EMAIL}>`,
          to: landlord.email,
          subject: `KODI Weekly Digest — ${now.toLocaleDateString('en-KE')}`,
          html,
        });
      } catch (e) {
        logger.error('Digest email failed for landlord', { landlordId: landlord.id, error: e.message });
      }
    }

    logger.info('Weekly digests sent', { count: landlords.length });
  } catch (err) {
    logger.error('Weekly digest job failed', { error: err.message });
  }
}

async function generateMonthlyITaxPrefill() {
  logger.info('Running monthly iTax pre-fill job');
  const now = new Date();
  // Run on 1st of month for previous month
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const quarter = `Q${Math.ceil(now.getMonth() / 3)}` || 'Q4';

  try {
    const landlords = await prisma.landlord.findMany({ select: { id: true } });
    for (const l of landlords) {
      await generateITax(l.id, year, quarter).catch((e) =>
        logger.error('iTax prefill failed', { landlordId: l.id, error: e.message })
      );
    }
    logger.info('Monthly iTax prefills generated', { count: landlords.length });
  } catch (err) {
    logger.error('iTax prefill job failed', { error: err.message });
  }
}

function scheduleMonthlyDigest() {
  // Weekly Sunday at 7:00 AM
  cron.schedule('0 7 * * 0', sendWeeklyDigest, { timezone: 'Africa/Nairobi' });
  // Monthly on 2nd at 6:00 AM — generate iTax prefill for previous month
  cron.schedule('0 6 2 * *', generateMonthlyITaxPrefill, { timezone: 'Africa/Nairobi' });
}

module.exports = { scheduleMonthlyDigest, sendWeeklyDigest };
