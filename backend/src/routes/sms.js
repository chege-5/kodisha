const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { validateATRequest } = require('../middleware/atValidate');
const { sendSMS } = require('../services/africastalking');
const { recalculate } = require('../services/trustScore');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

router.post('/', validateATRequest, async (req, res) => {
  res.json({ status: 'received' }); // Acknowledge immediately

  const { from, text, date } = req.body;
  const message = (text || '').trim().toUpperCase();

  logger.info('Inbound SMS', { from, message });

  try {
    // ─── "Done [TicketID]" — close maintenance ticket ─────────────────────
    if (/^DONE\s+\S+/.test(message)) {
      const ticketPrefix = message.split(/\s+/)[1];
      const ticket = await prisma.maintenanceTicket.findFirst({
        where: { id: { startsWith: ticketPrefix.toLowerCase() } },
        include: { tenant: true, unit: true },
      });

      if (!ticket) return;
      if (ticket.status === 'CLOSED') return;

      await prisma.maintenanceTicket.update({
        where: { id: ticket.id },
        data: { status: 'CLOSED', closedAt: new Date() },
      });

      await sendSMS(
        ticket.tenant.phone,
        `Hi ${ticket.tenant.name}, your ${ticket.category} issue in Unit ${ticket.unit.unitNumber} has been resolved! Reply RATE ${ticket.id.slice(0, 8)} [1-5] to rate the service. Example: RATE ${ticket.id.slice(0, 8)} 4`
      );

      logger.info('Ticket closed via SMS', { ticketId: ticket.id });
    }

    // ─── "PAID [TenantPhone] [Amount]" — log cash payment ─────────────────
    else if (/^PAID\s+\S+\s+\d+/.test(message)) {
      const parts = message.split(/\s+/);
      const tenantPhone = normalizePhone(parts[1]);
      const amount = parseFloat(parts[2]);

      if (isNaN(amount) || amount <= 0) return;

      const tenant = await prisma.tenant.findUnique({
        where: { phone: tenantPhone },
        include: { unit: true },
      });

      if (!tenant) {
        await sendSMS(from, `Tenant with phone ${parts[1]} not found in KODI.`);
        return;
      }

      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysLate = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          unitId: tenant.unitId,
          amount,
          channel: 'CASH',
          paymentDate: now,
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
          isPartial: amount < parseFloat(tenant.unit.rentAmount),
          daysLate,
          notes: `Logged via SMS by ${from}`,
        },
      });

      await recalculate(tenant.id);

      await sendSMS(from, `✓ Cash payment of KSh ${amount.toLocaleString('en-KE')} logged for ${tenant.name} (Unit ${tenant.unit.unitNumber}).`);
      await sendSMS(tenant.phone, `KODI: Cash payment of KSh ${amount.toLocaleString('en-KE')} recorded for ${now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}. Thank you!`);

      logger.info('Cash payment logged via SMS', { tenantId: tenant.id, amount, from });
    }

    // ─── "VACANT [UnitNumber]" — mark unit vacant ─────────────────────────
    else if (/^VACANT\s+\S+/.test(message)) {
      const unitNumber = message.split(/\s+/)[1];
      const caretaker = await prisma.caretaker.findUnique({ where: { phone: from } });
      if (!caretaker) return;

      const unit = await prisma.unit.findFirst({
        where: { unitNumber, property: { landlordId: caretaker.landlordId } },
      });
      if (!unit) {
        await sendSMS(from, `Unit ${unitNumber} not found.`);
        return;
      }

      await prisma.unit.update({ where: { id: unit.id }, data: { status: 'VACANT' } });
      await sendSMS(from, `Unit ${unitNumber} marked as VACANT in KODI.`);
      logger.info('Unit marked vacant via SMS', { unitId: unit.id, by: from });
    }

    // ─── "RATE [TicketID] [1-5]" — tenant rates resolved ticket ──────────
    else if (/^RATE\s+\S+\s+[1-5]$/.test(message)) {
      const parts = message.split(/\s+/);
      const ticketPrefix = parts[1];
      const rating = parseInt(parts[2]);

      const ticket = await prisma.maintenanceTicket.findFirst({
        where: { id: { startsWith: ticketPrefix.toLowerCase() }, status: 'CLOSED' },
      });
      if (!ticket) return;

      await prisma.maintenanceTicket.update({
        where: { id: ticket.id },
        data: { rating },
      });

      await sendSMS(from, `Thank you for rating! You gave ${rating}/5 for the ${ticket.category} fix. We appreciate your feedback.`);
      logger.info('Ticket rated', { ticketId: ticket.id, rating });
    }

    // ─── "BALANCE" — tenant checks balance ────────────────────────────────
    else if (message === 'BALANCE') {
      const tenant = await prisma.tenant.findUnique({
        where: { phone: from },
        include: { unit: true },
      });
      if (!tenant) return;

      const now = new Date();
      const agg = await prisma.payment.aggregate({
        where: { tenantId: tenant.id, periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() },
        _sum: { amount: true },
      });
      const paid = parseFloat(agg._sum.amount || 0);
      const arrears = Math.max(0, parseFloat(tenant.unit.rentAmount) - paid);

      await sendSMS(from, arrears > 0
        ? `KODI Balance: KSh ${arrears.toLocaleString('en-KE')} outstanding for ${now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}.`
        : `KODI: You are fully paid for ${now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}. Thank you!`
      );
    }

  } catch (err) {
    logger.error('SMS handler error', { error: err.message, from, message: text });
  }
});

function normalizePhone(phone) {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) return `+254${clean.slice(1)}`;
  if (clean.startsWith('254')) return `+${clean}`;
  return phone;
}

module.exports = router;
