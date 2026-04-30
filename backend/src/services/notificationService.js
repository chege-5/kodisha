const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');

/**
 * Centralized Notification Service
 * Dispatches notifications via IN_APP, SMS, or BOTH
 */

const { sendSMS } = require('./africastalking');

/**
 * Create and dispatch a notification
 */
async function notify({
  tenantId = null,
  userId = null,
  userRole = null,
  type,
  title,
  message,
  channel = 'IN_APP',
  metadata = null,
  phone = null,
}) {
  try {
    // Save in-app notification
    if (channel === 'IN_APP' || channel === 'BOTH') {
      await prisma.notification.create({
        data: { tenantId, userId, userRole, type, title, message, channel, metadata },
      });
    }

    // Send SMS
    if ((channel === 'SMS' || channel === 'BOTH') && phone) {
      await sendSMS(phone, `Kodisha: ${message}`).catch((err) =>
        logger.error('Notification SMS failed', { error: err.message, phone })
      );
    }

    logger.info('Notification dispatched', { type, channel, tenantId, userId });
  } catch (err) {
    logger.error('Notification dispatch failed', { error: err.message, type });
  }
}

/**
 * Notify on payment received
 */
async function notifyPaymentReceived(tenant, amount, ref) {
  await notify({
    tenantId: tenant.id,
    type: 'PAYMENT_RECEIVED',
    title: 'Payment Received',
    message: `Payment of KSh ${Number(amount).toLocaleString('en-KE')} received. Ref: ${ref || 'CASH'}`,
    channel: 'BOTH',
    phone: tenant.phone,
    metadata: { amount: Number(amount), ref },
  });
}

/**
 * Notify on bill generated
 */
async function notifyBillGenerated(tenant, bill) {
  await notify({
    tenantId: tenant.id,
    type: 'BILL_GENERATED',
    title: `${bill.type} Bill Generated`,
    message: `Your ${bill.type.toLowerCase()} bill of KSh ${Number(bill.amount).toLocaleString('en-KE')} is due on ${new Date(bill.dueDate).toLocaleDateString('en-KE')}`,
    channel: 'BOTH',
    phone: tenant.phone,
    metadata: { billId: bill.id, billType: bill.type, amount: Number(bill.amount) },
  });
}

/**
 * Notify on issue update
 */
async function notifyIssueUpdate(tenant, ticket, status) {
  await notify({
    tenantId: tenant.id,
    type: 'ISSUE_UPDATED',
    title: 'Issue Update',
    message: `Your ${ticket.category} issue (Ticket #${ticket.id.slice(0, 8)}) is now ${status}`,
    channel: 'BOTH',
    phone: tenant.phone,
    metadata: { ticketId: ticket.id, status },
  });
}

/**
 * Notify on meter reading
 */
async function notifyMeterReading(tenant, reading) {
  await notify({
    tenantId: tenant.id,
    type: 'METER_READING',
    title: 'Meter Reading Updated',
    message: `Water meter reading recorded: ${Number(reading.consumption).toFixed(1)} units consumed`,
    channel: 'IN_APP',
    metadata: { readingId: reading.id, consumption: Number(reading.consumption) },
  });
}

/**
 * Notify landlord
 */
async function notifyLandlord(landlordId, type, title, message, metadata = null) {
  await notify({
    userId: landlordId,
    userRole: 'LANDLORD',
    type,
    title,
    message,
    channel: 'IN_APP',
    metadata,
  });
}

/**
 * Notify rent due (SMS reminder)
 */
async function notifyRentDue(tenant, amount) {
  await notify({
    tenantId: tenant.id,
    type: 'RENT_DUE',
    title: 'Rent Due Reminder',
    message: `Your rent of KSh ${Number(amount).toLocaleString('en-KE')} is due. Pay via M-Pesa or dial *384*100#`,
    channel: 'BOTH',
    phone: tenant.phone,
    metadata: { amount: Number(amount) },
  });
}

/**
 * Get notifications for a user
 */
async function getUserNotifications(userId, userRole, { page = 1, limit = 20 } = {}) {
  const where = userRole === 'TENANT'
    ? { tenantId: userId }
    : { userId, userRole };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
  ]);

  return { notifications, total, unreadCount, page, pages: Math.ceil(total / limit) };
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(userId, userRole) {
  const where = userRole === 'TENANT'
    ? { tenantId: userId, isRead: false }
    : { userId, userRole, isRead: false };

  return prisma.notification.updateMany({ where, data: { isRead: true } });
}

module.exports = {
  notify,
  notifyPaymentReceived,
  notifyBillGenerated,
  notifyIssueUpdate,
  notifyMeterReading,
  notifyLandlord,
  notifyRentDue,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
