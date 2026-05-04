const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { stkPush, querySTKStatus, b2cTransfer } = require('../services/mpesa');
const { recalculate, checkAirtimeEligibility } = require('../services/trustScore');
const { sendSMS } = require('../services/africastalking');
const { sendAirtime } = require('../services/africastalking');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ─── STK Push ────────────────────────────────────────────────────────────────

router.post('/stkpush', authenticate, requireRole('LANDLORD', 'CARETAKER'), async (req, res, next) => {
  const { tenantId, amount } = req.body;
  if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

  try {
    const landlordId = await getLandlordIdFromUser(req.user);
    if (!landlordId) return res.status(403).json({ error: 'You do not have access to that tenant.' });
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        unit: { property: { landlordId } },
      },
      include: { unit: true },
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const pushAmount = amount || parseFloat(tenant.unit.rentAmount);
    const result = await stkPush({
      phone: tenant.phone,
      amount: pushAmount,
      accountRef: `KODI-${tenant.unit.unitNumber}`,
      description: `Rent ${new Date().toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}`,
    });

    res.json({ message: 'STK Push sent', result });
  } catch (err) {
    next(err);
  }
});

// ─── M-Pesa C2B Callback ─────────────────────────────────────────────────────

router.post('/callback', async (req, res) => {
  // Acknowledge immediately — Safaricom requires fast 200
  res.json({ ResultCode: 0, ResultDesc: 'Success' });

  if (!isValidMpesaCallback(req)) {
    logger.warn('Rejected M-Pesa callback without valid token', { path: req.path });
    return;
  }

  try {
    const body = req.body?.Body?.stkCallback || req.body;
    if (!body?.CheckoutRequestID || !body?.ResultCode) {
      logger.warn('Invalid M-Pesa callback shape', { hasBody: Boolean(req.body) });
      return;
    }
    const resultCode = body?.ResultCode;

    if (resultCode !== 0) {
      logger.warn('M-Pesa STK failed', { resultCode, desc: body?.ResultDesc });
      return;
    }

    const items = body?.CallbackMetadata?.Item || [];
    const get = (name) => items.find((i) => i.Name === name)?.Value;

    const amount = get('Amount');
    const mpesaRef = get('MpesaReceiptNumber');
    const phone = String(get('PhoneNumber') || '');
    if (!mpesaRef || !phone || !amount) {
      logger.warn('Incomplete M-Pesa callback data', { hasMetadata: Boolean(items.length) });
      return;
    }

    // Prevent duplicate processing
    const existing = await prisma.payment.findUnique({ where: { mpesaTransactionId: mpesaRef } });
    if (existing) {
      logger.info('Duplicate M-Pesa callback', { mpesaRef });
      return;
    }

    // Match tenant by phone
    const normalizedPhone = normalizeForSearch(phone);
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { phone: `0${phone.slice(-9)}` },
          { phone: `+254${phone.slice(-9)}` },
          { phone: `254${phone.slice(-9)}` },
        ],
      },
      include: { unit: true },
    });

    if (!tenant) {
      logger.warn('M-Pesa payment from unregistered phone', { phone, mpesaRef });
      return;
    }

    const rentAmount = parseFloat(tenant.unit.rentAmount);
    const paidAmount = parseFloat(amount);
    const now = new Date();

    // Calculate days late (rent due on 1st of month)
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysLate = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        unitId: tenant.unitId,
        amount: paidAmount,
        mpesaTransactionId: mpesaRef,
        channel: 'MPESA',
        paymentDate: now,
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        isPartial: paidAmount < rentAmount,
        daysLate,
      },
    });

    logger.info('Payment recorded', { paymentId: payment.id, tenantId: tenant.id, amount: paidAmount, mpesaRef });

    // Recalculate trust score
    const { score, tier } = await recalculate(tenant.id);

    // Send SMS receipt
    const receipt = `KODI Payment Received\nTenant: ${tenant.name}\nUnit: ${tenant.unit.unitNumber}\nAmount: KSh ${paidAmount.toLocaleString('en-KE')}\nRef: ${mpesaRef}\nDate: ${now.toLocaleDateString('en-KE')}\nTrust Score: ${score} (${tier})\nThank you!`;
    await sendSMS(tenant.phone, receipt).catch((e) => logger.error('Receipt SMS failed', { error: e.message }));

    // Check airtime reward
    const airtimeAmount = await checkAirtimeEligibility(tenant.id);
    if (airtimeAmount) {
      await issueAirtimeReward(tenant, airtimeAmount);
    }

  } catch (err) {
    logger.error('M-Pesa callback processing error', { error: err.message });
  }
});

// ─── B2C (disbursements) ─────────────────────────────────────────────────────

router.post('/b2c', authenticate, requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  const { phone, amount, remarks } = req.body;
  if (!phone || !amount) return res.status(400).json({ error: 'phone and amount required' });

  try {
    const result = await b2cTransfer({ phone, amount, remarks });
    res.json({ message: 'B2C initiated', result });
  } catch (err) {
    next(err);
  }
});

// B2C Result callback
router.post('/b2c/result', async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
  if (!isValidMpesaCallback(req)) return;
  logger.info('B2C result received');
});

router.post('/b2c/timeout', async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
  if (!isValidMpesaCallback(req)) return;
  logger.warn('B2C timeout');
});

// ─── Transaction Status ───────────────────────────────────────────────────────

router.get('/status/:checkoutRequestId', authenticate, async (req, res, next) => {
  try {
    const result = await querySTKStatus(req.params.checkoutRequestId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeForSearch(phone) {
  const clean = String(phone).replace(/\D/g, '');
  return clean.slice(-9); // last 9 digits
}

function isValidMpesaCallback(req) {
  const expected = process.env.MPESA_CALLBACK_TOKEN;
  if (!expected) return process.env.NODE_ENV === 'development';
  const token = req.query?.token || req.headers['x-callback-token'];
  return token === expected;
}

async function getLandlordIdFromUser(user) {
  if (user.role === 'LANDLORD' || user.role === 'ADMIN') return user.id;
  if (user.role === 'CARETAKER') {
    const caretaker = await prisma.caretaker.findUnique({ where: { id: user.id }, select: { landlordId: true, isActive: true } });
    return caretaker?.isActive ? caretaker.landlordId : null;
  }
  return null;
}

async function issueAirtimeReward(tenant, amount) {
  try {
    // Check landlord monthly cap
    const landlordId = await getLandlordIdFromUnit(tenant.unitId);
    const landlord = await prisma.landlord.findUnique({ where: { id: landlordId } });
    const cap = landlord?.monthlyAirtimeCap || parseInt(process.env.DEFAULT_MONTHLY_AIRTIME_CAP_KES) || 5000;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const alreadySent = await prisma.airtimeReward.aggregate({
      where: {
        tenant: { unit: { property: { landlordId } } },
        createdAt: { gte: startOfMonth },
        status: 'SENT',
      },
      _sum: { amount: true },
    });

    const totalSent = parseFloat(alreadySent._sum.amount || 0);
    if (totalSent + amount > cap) {
      logger.info('Airtime cap reached', { landlordId, cap, totalSent });
      return;
    }

    await sendAirtime([{
      phoneNumber: `+254${tenant.phone.replace(/\D/g, '').slice(-9)}`,
      currencyCode: 'KES',
      amount,
    }]);

    await prisma.airtimeReward.create({
      data: {
        tenantId: tenant.id,
        amount,
        reason: `On-time payment reward`,
        phone: tenant.phone,
        status: 'SENT',
      },
    });

    await sendSMS(tenant.phone, `KODI Reward: You have earned KSh ${amount} airtime for paying rent on time! Keep it up!`);
    logger.info('Airtime reward sent', { tenantId: tenant.id, amount });
  } catch (err) {
    logger.error('Airtime reward failed', { error: err.message, tenantId: tenant.id });
  }
}

async function getLandlordIdFromUnit(unitId) {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { property: { select: { landlordId: true } } },
  });
  return unit?.property?.landlordId;
}

module.exports = router;
