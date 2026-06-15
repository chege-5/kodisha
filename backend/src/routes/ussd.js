const router = require('express').Router();
const prisma = require('../utils/prismaClient');
const Redis = require('ioredis');
const { validateATRequest } = require('../middleware/atValidate');
const { sendSMS, ussdCON, ussdEND } = require('../services/africastalking');
const { stkPush } = require('../services/mpesa');
const logger = require('../utils/logger');
const redis = new Redis(process.env.REDIS_URL);

const SESSION_TTL = 120; // seconds

// Input sanitization — strip SQL injection chars, limit length
function sanitize(input) {
  if (!input) return '';
  return String(input).replace(/['";<>\\]/g, '').trim().slice(0, 200);
}

// Language-aware text
const T = {
  en: {
    welcome: (name) => `Welcome to KODI${name ? `, ${name}` : ''}.\n1. Pay Rent\n2. My Balance\n3. Report Issue\n4. My Receipt\n5. Language\n0. Exit`,
    payRent: 'Sending M-Pesa request to your phone. Please check and enter your PIN.',
    balance: (amt) => amt > 0 ? `Your outstanding balance is KSh ${amt.toLocaleString('en-KE')}.` : 'You are fully paid up. Thank you!',
    reportMenu: 'Select issue type:\n1. Plumbing\n2. Electrical\n3. Security\n4. Other',
    reportConfirm: (id) => `Ticket #${id} logged. Our caretaker has been notified. Thank you.`,
    receipt: 'Your last payment receipt has been sent to your phone via SMS.',
    langChanged: 'Language set to English.',
    landlordMenu: '1. View Arrears\n2. Vacant Units\n3. Broadcast Message\n4. Add Tenant\n5. Dashboard Link\n0. Exit',
    caretakerMenu: '1. Log Cash Payment\n2. Open Tickets\n3. Close Ticket\n4. Unit Status\n0. Exit',
    notFound: 'Number not registered. Contact your landlord.',
    goodbye: 'Thank you for using KODI. Goodbye!',
    invalid: 'Invalid selection. Please try again.',
    partialAmount: 'Enter amount to pay (KSh):',
    arrears: (list) => list.length ? `Overdue tenants:\n${list.slice(0, 5).map(t => `${t.name}: KSh ${t.arrears}`).join('\n')}` : 'No arrears. All tenants are paid up.',
    vacant: (count, list) => `${count} vacant unit(s):\n${list.slice(0, 5).join(', ')}`,
    cashLogPrompt: 'Enter: PHONE AMOUNT (e.g. 0712345678 5000)',
    cashLogged: (name, amt) => `Cash payment of KSh ${amt} logged for ${name}.`,
    openTickets: (list) => list.length ? `Open tickets:\n${list.slice(0, 5).map(t => `#${t.id.slice(0, 6)} - ${t.category} (${t.unit})`).join('\n')}` : 'No open tickets.',
    closeTicketPrompt: 'Enter ticket ID to close:',
    ticketClosed: (id) => `Ticket #${id} marked as closed. Rating SMS sent to tenant.`,
    unitStatusPrompt: 'Enter unit number:',
    unitStatus: (u) => `Unit ${u.unitNumber}: ${u.status}`,
  },
  sw: {
    welcome: (name) => `Karibu KODI${name ? `, ${name}` : ''}.\n1. Lipa Kodi\n2. Bakaa Yangu\n3. Ripoti Tatizo\n4. Risiti Yangu\n5. Lugha\n0. Toka`,
    payRent: 'Ombi la M-Pesa linatumwa. Tafadhali angalia simu yako na weka PIN.',
    balance: (amt) => amt > 0 ? `Bakaa yako ni KSh ${amt.toLocaleString('en-KE')}.` : 'Umelipa kikamilifu. Asante!',
    reportMenu: 'Chagua aina ya tatizo:\n1. Mabomba\n2. Umeme\n3. Usalama\n4. Nyingine',
    reportConfirm: (id) => `Tiketi #${id} imefunguliwa. Mchezo wa nyumba amearifiwa.`,
    receipt: 'Risiti ya malipo yako ya mwisho imetumwa kwa SMS.',
    langChanged: 'Lugha imewekwa Kiswahili.',
    notFound: 'Nambari haikupatikana. Wasiliana na mmiliki wako.',
    goodbye: 'Asante kwa kutumia KODI. Kwa heri!',
    invalid: 'Chaguo si sahihi. Jaribu tena.',
    partialAmount: 'Ingiza kiasi cha kulipa (KSh):',
    arrears: (list) => list.length ? `Wapangaji wenye madeni:\n${list.slice(0, 5).map(t => `${t.name}: KSh ${t.arrears}`).join('\n')}` : 'Hakuna madeni.',
    vacant: (count, list) => `Vyumba ${count} vilivyo tupu:\n${list.slice(0, 5).join(', ')}`,
    cashLogPrompt: 'Ingiza: SIMU KIASI (mfano 0712345678 5000)',
    cashLogged: (name, amt) => `Malipo ya pesa taslimu ya KSh ${amt} yamerekodiwa kwa ${name}.`,
    openTickets: (list) => list.length ? `Tiketi wazi:\n${list.slice(0, 5).map(t => `#${t.id.slice(0, 6)} - ${t.category} (${t.unit})`).join('\n')}` : 'Hakuna tiketi wazi.',
    closeTicketPrompt: 'Ingiza ID ya tiketi ya kufunga:',
    ticketClosed: (id) => `Tiketi #${id} imefungwa. SMS ya ukadiriaji imetumwa kwa mpangaji.`,
    unitStatusPrompt: 'Ingiza nambari ya chumba:',
    unitStatus: (u) => `Chumba ${u.unitNumber}: ${u.status}`,
  },
};

function t(lang, key, ...args) {
  const fn = (T[lang] || T.en)[key];
  return typeof fn === 'function' ? fn(...args) : fn;
}

async function getSession(sessionId) {
  const raw = await redis.get(`ussd:${sessionId}`);
  return raw ? JSON.parse(raw) : {};
}

async function saveSession(sessionId, data) {
  await redis.setex(`ussd:${sessionId}`, SESSION_TTL, JSON.stringify(data));
}

async function clearSession(sessionId) {
  await redis.del(`ussd:${sessionId}`);
}

// Persist session to DB for analytics
async function logSession(sessionId, phone, step, role) {
  await prisma.ussdSession.upsert({
    where: { sessionId },
    create: { sessionId, phoneNumber: phone, step, role: role || 'UNKNOWN' },
    update: { step, updatedAt: new Date() },
  }).catch(() => {});
}

// ─── USSD Callback ───────────────────────────────────────────────────────────

router.post('/', validateATRequest, async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text = '' } = req.body;

  const rawInputs = text.split('*');
  const input = sanitize(rawInputs[rawInputs.length - 1]);
  const level = rawInputs.filter(Boolean).length;

  let session = await getSession(sessionId);
  const lang = session.lang || 'en';

  res.set('Content-Type', 'text/plain');

  try {
    // ── Step 0: Identify caller ─────────────────────────────────────────────
    if (level === 0 || text === '') {
      // Detect role
      const tenant = await prisma.tenant.findUnique({ where: { phone: phoneNumber } });
      const landlord = await prisma.landlord.findUnique({ where: { phone: phoneNumber } });
      const caretaker = await prisma.caretaker.findUnique({ where: { phone: phoneNumber } });

      if (tenant) {
        session = { role: 'TENANT', tenantId: tenant.id, lang: tenant.language || 'en' };
        await saveSession(sessionId, session);
        await logSession(sessionId, phoneNumber, 'main_menu', 'TENANT');
        return res.send(ussdCON(t(session.lang, 'welcome', tenant.name)));
      }
      if (landlord) {
        session = { role: 'LANDLORD', landlordId: landlord.id, lang: landlord.language || 'en' };
        await saveSession(sessionId, session);
        await logSession(sessionId, phoneNumber, 'main_menu', 'LANDLORD');
        return res.send(ussdCON(`Welcome, ${landlord.name}.\n${t(session.lang, 'landlordMenu')}`));
      }
      if (caretaker) {
        session = { role: 'CARETAKER', caretakerId: caretaker.id, landlordId: caretaker.landlordId, lang: caretaker.language || 'en' };
        await saveSession(sessionId, session);
        await logSession(sessionId, phoneNumber, 'main_menu', 'CARETAKER');
        return res.send(ussdCON(`Welcome, ${caretaker.name}.\n${t(session.lang, 'caretakerMenu')}`));
      }

      // Unknown number — ask them to register
      await clearSession(sessionId);
      return res.send(ussdEND(t('en', 'notFound')));
    }

    // ── TENANT FLOWS ────────────────────────────────────────────────────────
    if (session.role === 'TENANT') {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        include: { unit: true, payments: { orderBy: { paymentDate: 'desc' }, take: 1 } },
      });

      // Main menu selections
      if (level === 1) {
        if (input === '0') {
          await clearSession(sessionId);
          return res.send(ussdEND(t(lang, 'goodbye')));
        }
        if (input === '1') {
          // Pay Rent
          session.step = 'PAY_CONFIRM';
          await saveSession(sessionId, session);
          const rentDue = parseFloat(tenant.unit.rentAmount);
          return res.send(ussdCON(`Pay KSh ${rentDue.toLocaleString('en-KE')} in full or enter custom amount.\n1. Full Amount (KSh ${rentDue.toLocaleString('en-KE')})\n2. Partial Amount`));
        }
        if (input === '2') {
          // Balance
          const totalPaidThisMonth = await getMonthlyPaymentSum(session.tenantId);
          const arrears = Math.max(0, parseFloat(tenant.unit.rentAmount) - totalPaidThisMonth);
          await clearSession(sessionId);
          return res.send(ussdEND(t(lang, 'balance', arrears)));
        }
        if (input === '3') {
          // Report Issue
          session.step = 'REPORT_CATEGORY';
          await saveSession(sessionId, session);
          return res.send(ussdCON(t(lang, 'reportMenu')));
        }
        if (input === '4') {
          // Receipt
          const lastPayment = tenant.payments[0];
          if (!lastPayment) {
            await clearSession(sessionId);
            return res.send(ussdEND('No payment records found.'));
          }
          const msg = `KODI Receipt\nTenant: ${tenant.name}\nUnit: ${tenant.unit.unitNumber}\nAmount: KSh ${parseFloat(lastPayment.amount).toLocaleString('en-KE')}\nDate: ${lastPayment.paymentDate.toLocaleDateString('en-KE')}\nRef: ${lastPayment.mpesaTransactionId || 'CASH'}\nThank you!`;
          await sendSMS(phoneNumber, msg).catch(() => {});
          await clearSession(sessionId);
          return res.send(ussdEND(t(lang, 'receipt')));
        }
        if (input === '5') {
          // Toggle language
          const newLang = lang === 'en' ? 'sw' : 'en';
          session.lang = newLang;
          await saveSession(sessionId, session);
          await prisma.tenant.update({ where: { id: session.tenantId }, data: { language: newLang } });
          return res.send(ussdCON(`${t(newLang, 'langChanged')}\n${t(newLang, 'welcome', tenant.name)}`));
        }
        return res.send(ussdCON(t(lang, 'invalid') + '\n' + t(lang, 'welcome', tenant.name)));
      }

      // Pay rent flow
      if (session.step === 'PAY_CONFIRM' && level === 2) {
        const rentDue = parseFloat(tenant.unit.rentAmount);
        let amount = rentDue;
        let isPartial = false;

        if (input === '1') {
          amount = rentDue;
        } else if (input === '2') {
          session.step = 'PAY_AMOUNT';
          await saveSession(sessionId, session);
          return res.send(ussdCON(t(lang, 'partialAmount')));
        } else {
          return res.send(ussdCON(t(lang, 'invalid')));
        }

        // Trigger STK push
        try {
          await stkPush({
            phone: phoneNumber,
            amount,
            accountRef: `KODI-${tenant.unit.unitNumber}`,
            description: `Rent ${new Date().toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}`,
          });
        } catch (e) {
          logger.error('STK push failed from USSD', { error: e.message });
        }

        await clearSession(sessionId);
        return res.send(ussdEND(t(lang, 'payRent')));
      }

      if (session.step === 'PAY_AMOUNT' && level === 3) {
        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0) {
          return res.send(ussdEND(t(lang, 'invalid')));
        }
        try {
          await stkPush({
            phone: phoneNumber,
            amount,
            accountRef: `KODI-${tenant.unit.unitNumber}`,
            description: 'Partial Rent',
          });
        } catch (e) {
          logger.error('STK push failed', { error: e.message });
        }
        await clearSession(sessionId);
        return res.send(ussdEND(t(lang, 'payRent')));
      }

      // Report issue flow
      if (session.step === 'REPORT_CATEGORY' && level === 2) {
        const categories = { '1': 'PLUMBING', '2': 'ELECTRICAL', '3': 'SECURITY', '4': 'OTHER' };
        const category = categories[input];
        if (!category) return res.send(ussdCON(t(lang, 'invalid') + '\n' + t(lang, 'reportMenu')));

        // Create ticket
        const ticket = await prisma.maintenanceTicket.create({
          data: {
            unitId: tenant.unitId,
            tenantId: session.tenantId,
            category,
            description: `Reported via USSD by ${tenant.name}`,
          },
        });

        // Notify caretaker
        const property = await prisma.property.findFirst({
          where: { units: { some: { id: tenant.unitId } } },
          include: { landlord: { include: { caretakers: { where: { isActive: true }, take: 1 } } } },
        });

        const caretakerPhone = property?.landlord?.caretakers?.[0]?.phone;
        if (caretakerPhone) {
          await sendSMS(caretakerPhone, `KODI Alert: ${category} issue in Unit ${tenant.unit.unitNumber} (Ticket #${ticket.id.slice(0, 8)}). Reported by ${tenant.name}.`).catch(() => {});
        }

        await clearSession(sessionId);
        return res.send(ussdEND(t(lang, 'reportConfirm', ticket.id.slice(0, 8))));
      }
    }

    // ── LANDLORD FLOWS ──────────────────────────────────────────────────────
    if (session.role === 'LANDLORD') {
      if (level === 1) {
        if (input === '0') {
          await clearSession(sessionId);
          return res.send(ussdEND(t(lang, 'goodbye')));
        }
        if (input === '1') {
          // Arrears
          const arrears = await getLandlordArrears(session.landlordId);
          await clearSession(sessionId);
          return res.send(ussdEND(t(lang, 'arrears', arrears)));
        }
        if (input === '2') {
          // Vacant units
          const vacants = await prisma.unit.findMany({
            where: { property: { landlordId: session.landlordId }, status: 'VACANT' },
            select: { unitNumber: true },
          });
          await clearSession(sessionId);
          return res.send(ussdEND(t(lang, 'vacant', vacants.length, vacants.map(u => u.unitNumber))));
        }
        if (input === '3') {
          session.step = 'BROADCAST_MSG';
          await saveSession(sessionId, session);
          return res.send(ussdCON('Enter broadcast message (max 160 chars):'));
        }
        if (input === '4') {
          await clearSession(sessionId);
          return res.send(ussdEND(`To add a tenant, visit ${process.env.FRONTEND_URL}/tenants/new`));
        }
        if (input === '5') {
          await clearSession(sessionId);
          return res.send(ussdEND(`Your dashboard: ${process.env.FRONTEND_URL}`));
        }
        return res.send(ussdCON(t(lang, 'invalid') + '\n' + t(lang, 'landlordMenu')));
      }

      if (session.step === 'BROADCAST_MSG' && level === 2) {
        const message = sanitize(input).slice(0, 160);
        session.broadcastMsg = message;
        session.step = 'BROADCAST_CONFIRM';
        await saveSession(sessionId, session);
        return res.send(ussdCON(`Send to all tenants: "${message}"\n1. Confirm\n2. Cancel`));
      }

      if (session.step === 'BROADCAST_CONFIRM' && level === 3) {
        if (input === '1') {
          // Fire and forget broadcast
          sendBroadcast(session.landlordId, session.broadcastMsg).catch(() => {});
          await clearSession(sessionId);
          return res.send(ussdEND('Broadcast sent to all tenants.'));
        }
        await clearSession(sessionId);
        return res.send(ussdEND('Broadcast cancelled.'));
      }
    }

    // ── CARETAKER FLOWS ─────────────────────────────────────────────────────
    if (session.role === 'CARETAKER') {
      if (level === 1) {
        if (input === '0') {
          await clearSession(sessionId);
          return res.send(ussdEND(t(lang, 'goodbye')));
        }
        if (input === '1') {
          session.step = 'LOG_CASH';
          await saveSession(sessionId, session);
          return res.send(ussdCON(t(lang, 'cashLogPrompt')));
        }
        if (input === '2') {
          const tickets = await prisma.maintenanceTicket.findMany({
            where: {
              status: { in: ['OPEN', 'IN_PROGRESS'] },
              unit: { property: { landlordId: session.landlordId } },
            },
            include: { unit: { select: { unitNumber: true } } },
            take: 5,
          });
          const list = tickets.map(tk => ({ id: tk.id, category: tk.category, unit: tk.unit.unitNumber }));
          await clearSession(sessionId);
          return res.send(ussdEND(t(lang, 'openTickets', list)));
        }
        if (input === '3') {
          session.step = 'CLOSE_TICKET';
          await saveSession(sessionId, session);
          return res.send(ussdCON(t(lang, 'closeTicketPrompt')));
        }
        if (input === '4') {
          session.step = 'UNIT_STATUS';
          await saveSession(sessionId, session);
          return res.send(ussdCON(t(lang, 'unitStatusPrompt')));
        }
        return res.send(ussdCON(t(lang, 'invalid') + '\n' + t(lang, 'caretakerMenu')));
      }

      if (session.step === 'LOG_CASH' && level === 2) {
        const parts = input.split(/\s+/);
        if (parts.length !== 2) return res.send(ussdCON('Format: PHONE AMOUNT\n' + t(lang, 'cashLogPrompt')));
        const [phone, rawAmt] = parts;
        const amount = parseFloat(rawAmt);
        if (isNaN(amount) || amount <= 0) return res.send(ussdEND(t(lang, 'invalid')));

        const tenant = await prisma.tenant.findUnique({
          where: { phone },
          include: { unit: true },
        });
        if (!tenant) return res.send(ussdEND(t(lang, 'notFound')));

        const now = new Date();
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
            notes: `Logged via USSD by caretaker`,
          },
        });

        await clearSession(sessionId);
        return res.send(ussdEND(t(lang, 'cashLogged', tenant.name, amount)));
      }

      if (session.step === 'CLOSE_TICKET' && level === 2) {
        const ticketId = input;
        const ticket = await prisma.maintenanceTicket.findFirst({
          where: { id: { startsWith: ticketId } },
          include: { tenant: true },
        });
        if (!ticket) return res.send(ussdEND('Ticket not found.'));

        await prisma.maintenanceTicket.update({
          where: { id: ticket.id },
          data: { status: 'CLOSED', closedAt: new Date() },
        });

        // Ask tenant to rate
        await sendSMS(ticket.tenant.phone, `Your ${ticket.category} issue (Ticket #${ticket.id.slice(0, 8)}) has been resolved. Reply RATE ${ticket.id.slice(0, 8)} [1-5] to rate the service.`).catch(() => {});

        await clearSession(sessionId);
        return res.send(ussdEND(t(lang, 'ticketClosed', ticketId)));
      }

      if (session.step === 'UNIT_STATUS' && level === 2) {
        const unit = await prisma.unit.findFirst({
          where: {
            unitNumber: input,
            property: { landlordId: session.landlordId },
          },
        });
        if (!unit) return res.send(ussdEND('Unit not found.'));
        await clearSession(sessionId);
        return res.send(ussdEND(t(lang, 'unitStatus', unit)));
      }
    }

    // Fallback
    await clearSession(sessionId);
    return res.send(ussdEND(t(lang, 'goodbye')));

  } catch (err) {
    logger.error('USSD handler error', { error: err.message, sessionId });
    await clearSession(sessionId);
    return res.send(ussdEND('An error occurred. Please try again.'));
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getMonthlyPaymentSum(tenantId) {
  const now = new Date();
  const agg = await prisma.payment.aggregate({
    where: { tenantId, periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() },
    _sum: { amount: true },
  });
  return parseFloat(agg._sum.amount || 0);
}

async function getLandlordArrears(landlordId) {
  const now = new Date();
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
  return tenants
    .map((t) => {
      const paid = t.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
      const arrears = Math.max(0, parseFloat(t.unit.rentAmount) - paid);
      return { name: t.name, arrears };
    })
    .filter((t) => t.arrears > 0);
}

async function sendBroadcast(landlordId, message) {
  const tenants = await prisma.tenant.findMany({
    where: { unit: { property: { landlordId } }, isActive: true },
    select: { phone: true },
  });
  const phones = tenants.map((t) => t.phone);
  if (phones.length === 0) return;

  await sendSMS(phones, message);
  await prisma.broadcastMessage.create({
    data: { landlordId, message, channel: 'SMS', sentAt: new Date(), recipientCount: phones.length },
  });
}

module.exports = router;
