const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { validateATRequest } = require('../middleware/atValidate');
const { sendSMS } = require('../services/africastalking');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const CATEGORY_MAP = { '1': 'PLUMBING', '2': 'ELECTRICAL', '3': 'SECURITY', '4': 'OTHER' };
const CATEGORY_NAMES = { PLUMBING: 'Plumbing', ELECTRICAL: 'Electrical', SECURITY: 'Security', OTHER: 'Other' };

// Africa's Talking Voice XML helpers
function xml(...lines) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${lines.join('')}</Response>`;
}
function say(text, voice = 'woman') {
  return `<Say voice="${voice}">${text}</Say>`;
}
function getDigits(prompt, numDigits, timeout = 30) {
  return `<GetDigits timeout="${timeout}" numDigits="${numDigits}" finishOnKey="#">${say(prompt)}</GetDigits>`;
}
function record(maxLength = 10, trimSilence = 2) {
  return `<Record maxLength="${maxLength}" trimSilence="${trimSilence}" playBeep="true" />`;
}
function hangup() { return '<Hangup/>'; }
function dial(number) { return `<Dial phoneNumbers="${number}" />`; }

// ─── Inbound Call Handler ────────────────────────────────────────────────────

router.post('/', validateATRequest, async (req, res) => {
  const { callerNumber, sessionId, dtmfDigits, recordingUrl } = req.body;

  res.set('Content-Type', 'application/xml');

  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { phone: callerNumber },
          { phone: `0${callerNumber?.slice(-9)}` },
          { phone: `+${callerNumber}` },
        ],
      },
      include: { unit: true },
    });

    if (!tenant) {
      logger.warn('Unregistered caller', { callerNumber });
      return res.send(xml(
        say('Sorry, your number is not registered with KODI. Please contact your landlord. Goodbye.'),
        hangup()
      ));
    }

    // Handle voice recording callback
    if (recordingUrl && req.body.category) {
      await handleRecording(req.body, tenant, recordingUrl);
      return res.send(xml(
        say(`Thank you ${tenant.name}. Your issue has been logged and our caretaker will be in touch. Goodbye.`),
        hangup()
      ));
    }

    // First contact — prompt for category
    if (!dtmfDigits) {
      return res.send(xml(
        say(`Welcome to KODI Maintenance Line. Hello ${tenant.name}.`),
        getDigits(
          'Press 1 for Plumbing, Press 2 for Electrical, Press 3 for Security, Press 4 for Other issue. Press hash when done.',
          1
        )
      ));
    }

    const category = CATEGORY_MAP[dtmfDigits];
    if (!category) {
      return res.send(xml(
        say('Invalid selection.'),
        getDigits('Press 1 for Plumbing, 2 for Electrical, 3 for Security, 4 for Other.', 1)
      ));
    }

    // Create ticket immediately with category
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        unitId: tenant.unitId,
        tenantId: tenant.id,
        category,
        description: `Reported via Voice IVR. Unit ${tenant.unit.unitNumber}`,
      },
    });

    // Notify caretaker
    const property = await prisma.property.findFirst({
      where: { units: { some: { id: tenant.unitId } } },
      include: {
        landlord: true,
        units: { where: { id: tenant.unitId } },
      },
    });

    const caretaker = await prisma.caretaker.findFirst({
      where: { landlordId: property.landlordId, isActive: true },
    });

    const notifyMsg = `KODI Alert: ${CATEGORY_NAMES[category]} issue in Unit ${tenant.unit.unitNumber} (Ticket #${ticket.id.slice(0, 8)}). Tenant: ${tenant.name} ${tenant.phone}. Reply "DONE ${ticket.id.slice(0, 8)}" when resolved.`;

    let caretakerReachable = false;
    if (caretaker) {
      await sendSMS(caretaker.phone, notifyMsg).catch(() => {});
      caretakerReachable = true;
    }

    // Offer voice description recording
    return res.send(xml(
      say(`${CATEGORY_NAMES[category]} issue logged. Ticket number ${ticket.id.slice(0, 8)}.`),
      say('After the beep, record a 10-second description of the problem. Press hash when done.'),
      `<Record maxLength="10" trimSilence="2" playBeep="true" callbackUrl="${process.env.MPESA_CALLBACK_URL?.replace('/mpesa/callback', '')}/voice?ticketId=${ticket.id}&amp;category=${category}" />`,
      say('Thank you. Our caretaker has been notified and will attend to your issue. Goodbye.'),
      hangup()
    ));

  } catch (err) {
    logger.error('Voice IVR error', { error: err.message, callerNumber });
    return res.send(xml(
      say('An error occurred. Please call back or report via USSD. Goodbye.'),
      hangup()
    ));
  }
});

// ─── Recording Callback ───────────────────────────────────────────────────────

router.post('/recording', validateATRequest, async (req, res) => {
  res.json({ status: 'ok' });

  const { ticketId, recordingUrl } = req.body;
  if (!ticketId || !recordingUrl) return;

  try {
    await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: { voiceRecordingUrl: recordingUrl },
    });
    logger.info('Voice recording saved', { ticketId, recordingUrl });
  } catch (err) {
    logger.error('Failed to save recording', { error: err.message });
  }
});

async function handleRecording(body, tenant, recordingUrl) {
  const { ticketId } = body;
  if (ticketId) {
    await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: { voiceRecordingUrl: recordingUrl },
    }).catch(() => {});
  }
}

module.exports = router;
