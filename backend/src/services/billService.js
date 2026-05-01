const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');
const { notifyBillGenerated } = require('./notificationService');

/**
 * Bill Service — handles rent, water, and utility billing
 */

function normalizePagination(page, limit, fallbackLimit) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : fallbackLimit;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

/**
 * Generate monthly rent bills for all active tenants of a landlord
 */
async function generateMonthlyRentBills(landlordId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const dueDate = new Date(year, now.getMonth(), 5); // Due on 5th

  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
      unit: { property: { landlordId } },
    },
    include: { unit: { include: { property: true } } },
  });

  const bills = [];
  const skipped = [];
  const notified = [];
  const notificationFailures = [];

  for (const tenant of tenants) {
    // Check if bill already exists for this period
    const existing = await prisma.bill.findFirst({
      where: { tenantId: tenant.id, type: 'RENT', periodMonth: month, periodYear: year },
    });
    if (existing) {
      skipped.push(existing);
      continue;
    }

    const bill = await prisma.bill.create({
      data: {
        tenantId: tenant.id,
        unitId: tenant.unitId,
        type: 'RENT',
        amount: tenant.unit.rentAmount,
        dueDate,
        periodMonth: month,
        periodYear: year,
        description: `Rent for ${now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}`,
      },
    });

    bills.push(bill);

    // Notify tenant
    try {
      const notification = await notifyBillGenerated(tenant, bill);
      if (notification.smsSent) {
        notified.push({ tenantId: tenant.id, billId: bill.id, phone: tenant.phone });
      } else {
        notificationFailures.push({
          tenantId: tenant.id,
          billId: bill.id,
          phone: tenant.phone,
          error: notification.smsError || notification.error || 'SMS was not sent',
        });
      }
    } catch (err) {
      notificationFailures.push({ tenantId: tenant.id, billId: bill.id, phone: tenant.phone, error: err.message });
    }
  }

  logger.info('Monthly rent bills generated', {
    landlordId,
    count: bills.length,
    skipped: skipped.length,
    notified: notified.length,
    notificationFailures: notificationFailures.length,
    month,
    year,
  });

  return {
    bills,
    skipped,
    notified,
    notificationFailures,
    periodMonth: month,
    periodYear: year,
  };
}

/**
 * Generate water bill from meter reading
 */
async function generateWaterBill(reading, unit) {
  const ratePerUnit = Number(unit.property?.waterRatePerUnit || 50);
  const consumption = Number(reading.consumption);
  const amount = consumption * ratePerUnit;

  if (amount <= 0) return null;

  const tenant = await prisma.tenant.findFirst({
    where: { unitId: unit.id, isActive: true },
  });

  if (!tenant) {
    logger.warn('No active tenant for water bill', { unitId: unit.id });
    return null;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14); // 14 days to pay

  const bill = await prisma.bill.create({
    data: {
      tenantId: tenant.id,
      unitId: unit.id,
      type: 'WATER',
      amount,
      dueDate,
      periodMonth: reading.periodMonth,
      periodYear: reading.periodYear,
      description: `Water bill: ${consumption.toFixed(1)} units × KSh ${ratePerUnit}/unit`,
    },
  });

  await notifyBillGenerated(tenant, bill).catch(() => {});

  logger.info('Water bill generated', { billId: bill.id, tenantId: tenant.id, amount });
  return bill;
}

/**
 * Link a payment to a bill and update bill status
 */
async function linkPaymentToBill(paymentId, billId) {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });
  if (!bill) return null;

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { billId },
  });

  // Recalculate paid amount
  const totalPaid = await prisma.payment.aggregate({
    where: { billId },
    _sum: { amount: true },
  });

  const paidAmount = Number(totalPaid._sum.amount || 0);
  const billAmount = Number(bill.amount);

  await prisma.bill.update({
    where: { id: billId },
    data: {
      paidAmount,
      status: paidAmount >= billAmount ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING',
    },
  });

  return payment;
}

/**
 * Get bills for a tenant
 */
async function getTenantBills(tenantId, { type, status, page = 1, limit = 20 } = {}) {
  const where = { tenantId };
  if (type) where.type = type;
  if (status) where.status = status;

  const pagination = normalizePagination(page, limit, 20);

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: { unit: { select: { unitNumber: true } }, payments: true },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.bill.count({ where }),
  ]);

  return { bills, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) };
}

/**
 * Get bills for a landlord (all properties)
 */
async function getLandlordBills(landlordId, { type, status, page = 1, limit = 50 } = {}) {
  const where = landlordId ? { unit: { property: { landlordId } } } : {};
  if (type) where.type = type;
  if (status) where.status = status;

  const pagination = normalizePagination(page, limit, 50);

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        unit: { select: { unitNumber: true, property: { select: { name: true } } } },
        payments: { select: { id: true, amount: true, paymentDate: true, channel: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.bill.count({ where }),
  ]);

  return { bills, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) };
}

/**
 * Mark overdue bills
 */
async function markOverdueBills() {
  const now = new Date();
  const result = await prisma.bill.updateMany({
    where: {
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });
  logger.info('Overdue bills marked', { count: result.count });
  return result.count;
}

module.exports = {
  generateMonthlyRentBills,
  generateWaterBill,
  linkPaymentToBill,
  getTenantBills,
  getLandlordBills,
  markOverdueBills,
};
