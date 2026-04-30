const { notify, notifyLandlord } = require('./notificationService');
const { sendSMS } = require('./africastalking');
const { generateIssueSmsDraft } = require('./aiService');
const logger = require('../utils/logger');

function generateIssueSms({ audience, ticket, tenant, unit }) {
  return generateIssueSmsDraft({ audience, ticket, tenant, unit });
}

async function notifyIssueCreated({ ticket, tenant, unit, landlord, caretaker }) {
  const metadata = { ticketId: ticket.id, tenantId: tenant.id, unitId: unit?.id };
  const tenantMessage = generateIssueSms({ audience: 'tenant_created', ticket, tenant, unit });
  const landlordMessage = generateIssueSms({ audience: 'landlord_created', ticket, tenant, unit });
  const caretakerMessage = generateIssueSms({ audience: 'caretaker_created', ticket, tenant, unit });

  await notify({
    tenantId: tenant.id,
    type: 'ISSUE_CREATED',
    title: 'Issue Logged',
    message: tenantMessage.replace(/^Kodisha:\s*/, ''),
    channel: 'BOTH',
    phone: tenant.phone,
    metadata,
  });

  if (landlord?.id) {
    await notifyLandlord(landlord.id, 'ISSUE_CREATED', 'New Tenant Issue', landlordMessage, metadata);
    if (landlord.phone) {
      await sendSMS(landlord.phone, landlordMessage).catch((err) =>
        logger.error('Landlord issue SMS failed', { error: err.message, landlordId: landlord.id })
      );
    }
  }

  if (caretaker?.phone) {
    await sendSMS(caretaker.phone, caretakerMessage).catch((err) =>
      logger.error('Caretaker issue SMS failed', { error: err.message, caretakerId: caretaker.id })
    );
  }
}

async function notifyIssueClosed(ticket) {
  const message = generateIssueSms({
    audience: 'tenant_closed',
    ticket,
    tenant: ticket.tenant,
    unit: ticket.unit,
  });

  await notify({
    tenantId: ticket.tenant.id,
    type: 'ISSUE_UPDATED',
    title: 'Issue Resolved',
    message: message.replace(/^Kodisha:\s*/, ''),
    channel: 'BOTH',
    phone: ticket.tenant.phone,
    metadata: { ticketId: ticket.id, status: 'CLOSED' },
  });
}

module.exports = {
  generateIssueSms,
  notifyIssueCreated,
  notifyIssueClosed,
};
