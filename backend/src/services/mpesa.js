const axios = require('axios');
const logger = require('../utils/logger');

const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PROD_URL = 'https://api.safaricom.co.ke';

function baseUrl() {
  return process.env.MPESA_ENV === 'production' ? PROD_URL : SANDBOX_URL;
}

// Cache token in memory with expiry
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const res = await axios.get(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000; // refresh 60s early
  return cachedToken;
}

function generatePassword() {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = getTimestamp();
  const raw = `${shortcode}${passkey}${timestamp}`;
  return {
    password: Buffer.from(raw).toString('base64'),
    timestamp,
  };
}

function getTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14);
}

async function stkPush({ phone, amount, accountRef, description }) {
  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();

  // Normalize phone: 07XX → 2547XX
  const normalizedPhone = normalizePhone(phone);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: normalizedPhone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: normalizedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountRef || 'KODI',
    TransactionDesc: description || 'Rent Payment',
  };

  logger.info('Initiating STK push', { phone: normalizedPhone, amount });

  const res = await axios.post(
    `${baseUrl()}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
}

async function querySTKStatus(checkoutRequestId) {
  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();

  const res = await axios.post(
    `${baseUrl()}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
}

async function b2cTransfer({ phone, amount, remarks, occasion }) {
  const token = await getAccessToken();

  const res = await axios.post(
    `${baseUrl()}/mpesa/b2c/v1/paymentrequest`,
    {
      InitiatorName: process.env.MPESA_B2C_INITIATOR,
      SecurityCredential: process.env.MPESA_B2C_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: Math.ceil(amount),
      PartyA: process.env.MPESA_SHORTCODE,
      PartyB: normalizePhone(phone),
      Remarks: remarks || 'KODI Disbursement',
      QueueTimeOutURL: process.env.MPESA_B2C_QUEUE_TIMEOUT_URL,
      ResultURL: process.env.MPESA_B2C_RESULT_URL,
      Occasion: occasion || '',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
}

function normalizePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith('254')) return cleaned;
  if (cleaned.startsWith('+254')) return cleaned.slice(1);
  return cleaned;
}

module.exports = { stkPush, querySTKStatus, b2cTransfer, normalizePhone };
