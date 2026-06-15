const router = require('express').Router();
const prisma = require('../utils/prismaClient');
const twilio = require('twilio');
const { sendWhatsApp } = require('../services/whatsapp');
const { stkPush } = require('../services/mpesa');
const logger = require('../utils/logger');

// ─── Twilio WhatsApp Webhook ──────────────────────────────────────────────────

router.post('/webhook', async (req, res) => {
  if (!isValidTwilioRequest(req)) {
    logger.warn('Rejected WhatsApp webhook with invalid signature', { ip: req.ip });
    return res.status(403).send('Invalid signature');
  }

  res.sendStatus(200); // Acknowledge immediately

  const from = req.body.From?.replace('whatsapp:', '') || '';
  const body = (req.body.Body || '').trim();
  const keyword = body.split(' ')[0].toUpperCase();

  logger.info('Inbound WhatsApp received', { from: from ? `***${String(from).slice(-4)}` : undefined, keyword });

  try {
    // ─── Tenant commands ──────────────────────────────────────────────────

    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { phone: from },
          { phone: `0${from.slice(-9)}` },
          { phone: `+254${from.slice(-9)}` },
        ],
      },
      include: { unit: true, payments: { orderBy: { paymentDate: 'desc' }, take: 1 } },
    });

    if (tenant) {
      if (keyword === 'BALANCE') {
        const now = new Date();
        const agg = await prisma.payment.aggregate({
          where: { tenantId: tenant.id, periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() },
          _sum: { amount: true },
        });
        const paid = parseFloat(agg._sum.amount || 0);
        const arrears = Math.max(0, parseFloat(tenant.unit.rentAmount) - paid);
        const msg = arrears > 0
          ? `💰 *KODI Balance*\n\nHi ${tenant.name},\nUnit ${tenant.unit.unitNumber}\n\nAmount Due: *KSh ${arrears.toLocaleString('en-KE')}*\nFor: ${now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}\n\nReply *PAY* to receive an M-Pesa prompt.`
          : `✅ *KODI Balance*\n\nHi ${tenant.name}, you are fully paid for ${now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}. Thank you!`;
        await sendWhatsApp(from, msg);
      }

      else if (keyword === 'PAY') {
        const rentDue = parseFloat(tenant.unit.rentAmount);
        await sendWhatsApp(from,
          `💳 *Rent Payment*\n\nSending M-Pesa prompt for *KSh ${rentDue.toLocaleString('en-KE')}* to your phone...\n\nCheck your phone and enter your M-Pesa PIN.`
        );
        await stkPush({
          phone: from,
          amount: rentDue,
          accountRef: `KODI-${tenant.unit.unitNumber}`,
          description: 'Rent via WhatsApp',
        }).catch(() => {});
      }

      else if (keyword === 'RECEIPT') {
        const last = tenant.payments[0];
        if (!last) {
          await sendWhatsApp(from, 'No payment records found yet.');
        } else {
          await sendWhatsApp(from,
            `🧾 *KODI Receipt*\n\nTenant: ${tenant.name}\nUnit: ${tenant.unit.unitNumber}\nAmount: KSh ${parseFloat(last.amount).toLocaleString('en-KE')}\nDate: ${last.paymentDate.toLocaleDateString('en-KE')}\nRef: ${last.mpesaTransactionId || 'CASH'}\n\nThank you for paying rent!`
          );
        }
      }

      else if (keyword === 'ISSUE') {
        const description = body.slice(6).trim() || 'Issue reported via WhatsApp';
        const ticket = await prisma.maintenanceTicket.create({
          data: {
            unitId: tenant.unitId,
            tenantId: tenant.id,
            category: 'OTHER',
            description,
          },
        });

        // Notify caretaker
        const property = await prisma.property.findFirst({
          where: { units: { some: { id: tenant.unitId } } },
          include: { landlord: { include: { caretakers: { where: { isActive: true }, take: 1 } } } },
        });
        const caretakerPhone = property?.landlord?.caretakers?.[0]?.phone;
        if (caretakerPhone) {
          const { sendSMS } = require('../services/africastalking');
          await sendSMS(caretakerPhone,
            `KODI: Issue in Unit ${tenant.unit.unitNumber}: "${description}". Ticket #${ticket.id.slice(0, 8)}. Reply "DONE ${ticket.id.slice(0, 8)}" when resolved.`
          ).catch(() => {});
        }

        await sendWhatsApp(from,
          `🔧 *Issue Logged*\n\nTicket #${ticket.id.slice(0, 8)}\nDescription: ${description}\n\nOur caretaker has been notified and will attend to it shortly.`
        );
      }

      else {
        await sendWhatsApp(from,
          `👋 *KODI Help*\n\nHi ${tenant.name}! Here's what you can do:\n\n*BALANCE* — Check your rent balance\n*PAY* — Get M-Pesa payment prompt\n*RECEIPT* — Get your last payment receipt\n*ISSUE [description]* — Report a maintenance issue\n\nNeed more help? Dial *${process.env.AT_USSD_CODE}*`
        );
      }
      return;
    }

    // ─── Landlord commands ────────────────────────────────────────────────

    const landlord = await prisma.landlord.findUnique({ where: { phone: from } });
    if (landlord) {
      if (keyword === 'ARREARS') {
        const now = new Date();
        const tenants = await prisma.tenant.findMany({
          where: { unit: { property: { landlordId: landlord.id } }, isActive: true },
          include: {
            unit: { select: { rentAmount: true, unitNumber: true } },
            payments: {
              where: { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() },
              select: { amount: true },
            },
          },
        });
        const arrearsList = tenants
          .map((t) => {
            const paid = t.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
            const arrears = Math.max(0, parseFloat(t.unit.rentAmount) - paid);
            return { name: t.name, unit: t.unit.unitNumber, arrears };
          })
          .filter((t) => t.arrears > 0)
          .slice(0, 10);

        const msg = arrearsList.length
          ? `📊 *Arrears Summary*\n\n${arrearsList.map((t) => `• Unit ${t.unit} — ${t.name}: KSh ${t.arrears.toLocaleString('en-KE')}`).join('\n')}`
          : '✅ All tenants are paid up this month!';
        await sendWhatsApp(from, msg);
      }

      else if (keyword === 'VACANT') {
        const vacants = await prisma.unit.findMany({
          where: { property: { landlordId: landlord.id }, status: 'VACANT' },
          select: { unitNumber: true, rentAmount: true },
        });
        const msg = vacants.length
          ? `🏠 *Vacant Units (${vacants.length})*\n\n${vacants.map((u) => `• Unit ${u.unitNumber} — KSh ${parseFloat(u.rentAmount).toLocaleString('en-KE')}/mo`).join('\n')}`
          : '✅ All units are occupied!';
        await sendWhatsApp(from, msg);
      }

      else {
        await sendWhatsApp(from,
          `👋 *KODI Landlord Commands*\n\n*ARREARS* — View overdue tenants\n*VACANT* — List vacant units\n\nFor full dashboard: ${process.env.FRONTEND_URL}`
        );
      }
      return;
    }

    // Unknown number
    await sendWhatsApp(from,
      `👋 Thanks for contacting KODI.\n\nIf your number is registered, you'll receive a response shortly. For support, visit: ${process.env.FRONTEND_URL}`
    );

  } catch (err) {
    logger.error('WhatsApp webhook error', { error: err.message, from: from ? `***${String(from).slice(-4)}` : undefined });
  }
});

function isValidTwilioRequest(req) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return process.env.NODE_ENV !== 'production';

  const signature = req.headers['x-twilio-signature'];
  if (!signature) return false;

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const url = `${protocol}://${host}${req.originalUrl}`;

  return twilio.validateRequest(authToken, signature, url, req.body || {});
}

module.exports = router;
