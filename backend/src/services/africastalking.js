const AfricasTalking = require('africastalking');
const logger = require('../utils/logger');

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});

const sms = at.SMS;
const voice = at.VOICE;
const airtime = at.AIRTIME;

async function sendSMS(to, message, from) {
  try {
    const recipients = Array.isArray(to) ? to : [to];
    const result = await sms.send({
      to: recipients,
      message,
      from: from || process.env.AT_SENDER_ID,
    });
    logger.info('SMS sent', { to: recipients, messageId: result?.SMSMessageData?.Recipients?.[0]?.messageId });
    return result;
  } catch (err) {
    logger.error('SMS send failed', { error: err.message, to });
    throw err;
  }
}

async function sendAirtime(recipients) {
  // recipients: [{ phoneNumber: '+2547...', currencyCode: 'KES', amount: 30 }]
  try {
    const result = await airtime.send({ recipients });
    logger.info('Airtime sent', { recipients });
    return result;
  } catch (err) {
    logger.error('Airtime send failed', { error: err.message });
    throw err;
  }
}

// Build USSD CON (continue) response
function ussdCON(message) {
  return `CON ${message}`;
}

// Build USSD END response
function ussdEND(message) {
  return `END ${message}`;
}

module.exports = { sendSMS, sendAirtime, ussdCON, ussdEND, voice };
