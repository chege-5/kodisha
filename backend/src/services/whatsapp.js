const twilio = require('twilio');
const logger = require('../utils/logger');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsApp(to, message) {
  try {
    const normalizedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: normalizedTo,
      body: message,
    });
    logger.info('WhatsApp message sent', { to, sid: result.sid });
    return result;
  } catch (err) {
    logger.error('WhatsApp send failed', { error: err.message, to });
    throw err;
  }
}

module.exports = { sendWhatsApp };
