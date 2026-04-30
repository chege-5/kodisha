const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');
const { generateWaterBill } = require('./billService');
const { notifyMeterReading } = require('./notificationService');

/**
 * Water Bill Service — meter readings → auto water bills
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
 * Record a meter reading and generate water bill
 */
async function recordMeterReading({ unitId, currentReading, periodMonth, periodYear, readBy, notes }) {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { property: true },
  });

  if (!unit) throw new Error('Unit not found');

  // Get previous reading
  const previousReading = await prisma.meterReading.findFirst({
    where: { unitId },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
  });

  const prevValue = previousReading ? Number(previousReading.currentReading) : 0;
  const consumption = Math.max(0, Number(currentReading) - prevValue);

  // Create meter reading
  const reading = await prisma.meterReading.create({
    data: {
      unitId,
      previousReading: prevValue,
      currentReading: Number(currentReading),
      consumption,
      periodMonth,
      periodYear,
      readBy,
      notes,
    },
  });

  logger.info('Meter reading recorded', { unitId, consumption, readingId: reading.id });

  // Auto-generate water bill
  const bill = await generateWaterBill(reading, unit);

  // Notify tenant
  const tenant = await prisma.tenant.findFirst({
    where: { unitId, isActive: true },
  });
  if (tenant) {
    await notifyMeterReading(tenant, reading).catch(() => {});
  }

  return { reading, bill };
}

/**
 * Get reading history for a unit
 */
async function getUnitReadings(unitId, { page = 1, limit = 12 } = {}) {
  const pagination = normalizePagination(page, limit, 12);

  const [readings, total] = await Promise.all([
    prisma.meterReading.findMany({
      where: { unitId },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.meterReading.count({ where: { unitId } }),
  ]);

  return { readings, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) };
}

/**
 * Get all readings for a landlord (all properties)
 */
async function getLandlordReadings(landlordId, { periodMonth, periodYear, page = 1, limit = 50 } = {}) {
  const where = landlordId ? { unit: { property: { landlordId } } } : {};
  if (periodMonth) where.periodMonth = periodMonth;
  if (periodYear) where.periodYear = periodYear;

  const pagination = normalizePagination(page, limit, 50);

  const [readings, total] = await Promise.all([
    prisma.meterReading.findMany({
      where,
      include: {
        unit: { select: { unitNumber: true, property: { select: { name: true } } } },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.meterReading.count({ where }),
  ]);

  return { readings, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) };
}

module.exports = { recordMeterReading, getUnitReadings, getLandlordReadings };
