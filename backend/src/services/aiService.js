const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');

/**
 * AI Service — Rule-based intelligence layer
 * Provides smart insights, predictions, and natural language query processing
 */

/**
 * Predict tenants likely to be overdue based on payment history
 */
async function predictOverdueTenants(landlordId) {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true, unit: { property: { landlordId } } },
    include: {
      unit: { select: { unitNumber: true, rentAmount: true, property: { select: { name: true } } } },
      trustScore: { select: { score: true } },
      payments: {
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
        take: 6,
      },
    },
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return tenants.map((tenant) => {
    const score = tenant.trustScore?.score || 500;
    const recentPayments = tenant.payments;

    // Risk factors
    let riskScore = 0;
    let riskFactors = [];

    // 1. Trust score below 500
    if (score < 400) { riskScore += 40; riskFactors.push('Poor trust score'); }
    else if (score < 500) { riskScore += 20; riskFactors.push('Below-average trust score'); }

    // 2. Late payments in last 3 months
    const latePayments = recentPayments.filter((p) => p.daysLate > 0).length;
    if (latePayments >= 2) { riskScore += 30; riskFactors.push(`${latePayments} late payments recently`); }
    else if (latePayments === 1) { riskScore += 15; riskFactors.push('1 late payment recently'); }

    // 3. Partial payments
    const partials = recentPayments.filter((p) => p.isPartial).length;
    if (partials > 0) { riskScore += 20; riskFactors.push(`${partials} partial payments`); }

    // 4. No payment this month yet
    const paidThisMonth = recentPayments.some(
      (p) => p.periodMonth === currentMonth && p.periodYear === currentYear
    );
    if (!paidThisMonth && now.getDate() > 5) {
      riskScore += 25;
      riskFactors.push('No payment yet this month');
    }

    // 5. Average days late
    const avgDaysLate = recentPayments.length > 0
      ? recentPayments.reduce((s, p) => s + p.daysLate, 0) / recentPayments.length
      : 0;
    if (avgDaysLate > 7) { riskScore += 15; riskFactors.push(`Avg ${avgDaysLate.toFixed(0)} days late`); }

    const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';

    return {
      tenantId: tenant.id,
      name: tenant.name,
      phone: tenant.phone,
      unit: tenant.unit?.unitNumber,
      property: tenant.unit?.property?.name,
      rentAmount: Number(tenant.unit?.rentAmount || 0),
      trustScore: score,
      riskScore: Math.min(100, riskScore),
      riskLevel,
      riskFactors,
      paidThisMonth,
    };
  })
    .sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Revenue summary analytics
 */
async function getRevenueSummary(landlordId, months = 6) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const [monthlyRevenue, totalExpected, collectedThisMonth] = await Promise.all([
    prisma.payment.groupBy({
      by: ['periodYear', 'periodMonth'],
      where: {
        paymentDate: { gte: startDate },
        unit: { property: { landlordId } },
      },
      _sum: { amount: true },
      _count: true,
      orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
    }),
    prisma.unit.aggregate({
      where: { property: { landlordId }, status: 'OCCUPIED' },
      _sum: { rentAmount: true },
    }),
    prisma.payment.aggregate({
      where: {
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        unit: { property: { landlordId } },
      },
      _sum: { amount: true },
    }),
  ]);

  const expected = Number(totalExpected._sum.rentAmount || 0);
  const collected = Number(collectedThisMonth._sum.amount || 0);
  const collectionRate = expected > 0 ? ((collected / expected) * 100).toFixed(1) : 0;

  return {
    monthlyRevenue: monthlyRevenue.map((r) => ({
      month: `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}`,
      collected: Number(r._sum.amount || 0),
      paymentCount: r._count,
    })),
    currentMonth: {
      expected,
      collected,
      outstanding: Math.max(0, expected - collected),
      collectionRate: Number(collectionRate),
    },
  };
}

/**
 * Occupancy analytics
 */
async function getOccupancyStats(landlordId) {
  const units = await prisma.unit.groupBy({
    by: ['status'],
    where: { property: { landlordId } },
    _count: { status: true },
  });

  const statusMap = Object.fromEntries(units.map((u) => [u.status, u._count.status]));
  const total = Object.values(statusMap).reduce((s, v) => s + v, 0);
  const occupied = statusMap.OCCUPIED || 0;
  const rate = total > 0 ? ((occupied / total) * 100).toFixed(1) : 0;

  // Per-property breakdown
  const properties = await prisma.property.findMany({
    where: { landlordId },
    include: {
      units: { select: { status: true } },
    },
  });

  const propertyBreakdown = properties.map((p) => {
    const totalUnits = p.units.length;
    const occupiedUnits = p.units.filter((u) => u.status === 'OCCUPIED').length;
    return {
      propertyId: p.id,
      name: p.name,
      totalUnits,
      occupiedUnits,
      vacantUnits: p.units.filter((u) => u.status === 'VACANT').length,
      maintenanceUnits: p.units.filter((u) => u.status === 'MAINTENANCE').length,
      occupancyRate: totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0,
    };
  });

  return {
    overall: { total, occupied, vacant: statusMap.VACANT || 0, maintenance: statusMap.MAINTENANCE || 0, occupancyRate: Number(rate) },
    properties: propertyBreakdown,
  };
}

/**
 * Natural Language Query Parser (rule-based, no ML)
 */
async function processNaturalLanguageQuery(query, landlordId) {
  const q = query.toLowerCase().trim();

  // Intent patterns
  const patterns = [
    { match: /(?:unpaid|haven.t paid|not paid|overdue|arrears)/i, handler: queryUnpaidTenants },
    { match: /(?:total|how much).*(collected|received|revenue).*(month|today)/i, handler: queryCollectedThisMonth },
    { match: /(?:vacant|empty|available)\s*(?:units?|rooms?|spaces?)/i, handler: queryVacantUnits },
    { match: /(?:occupied|full|taken)\s*(?:units?|rooms?)/i, handler: queryOccupiedUnits },
    { match: /(?:open|pending|active)\s*(?:tickets?|issues?|maintenance)/i, handler: queryOpenTickets },
    { match: /(?:how many|number of|total)\s*(?:tenants?|occupants?)/i, handler: queryTenantCount },
    { match: /(?:how many|number of|total)\s*(?:properties|buildings)/i, handler: queryPropertyCount },
    { match: /(?:water|meter).*(bill|reading)/i, handler: queryWaterBills },
    { match: /(?:risk|risky|dangerous|problematic)\s*(?:tenants?|accounts?)/i, handler: queryRiskyTenants },
    { match: /(?:occupancy|occupation)\s*(?:rate|percentage|%)/i, handler: queryOccupancyRate },
    { match: /(?:collection)\s*(?:rate|percentage|%)/i, handler: queryCollectionRate },
    { match: /(?:best|top|excellent)\s*(?:tenants?|payers?)/i, handler: queryBestTenants },
  ];

  for (const p of patterns) {
    if (p.match.test(q)) {
      return await p.handler(landlordId);
    }
  }

  return {
    type: 'unknown',
    message: "I couldn't understand that query. Try asking about unpaid tenants, revenue collected, vacant units, open tickets, or risky tenants.",
    suggestions: ['Show unpaid tenants', 'Total collected this month', 'Vacant units', 'Open tickets', 'Risky tenants'],
  };
}

// ─── Query Handlers ─────────────────────────────────────────────────────────

async function queryUnpaidTenants(landlordId) {
  const now = new Date();
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true, unit: { property: { landlordId } } },
    include: {
      unit: { select: { unitNumber: true, rentAmount: true } },
      payments: {
        where: { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() },
        select: { amount: true },
      },
    },
  });

  const unpaid = tenants.filter((t) => {
    const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
    return paid < Number(t.unit.rentAmount);
  }).map((t) => {
    const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
    return { name: t.name, unit: t.unit.unitNumber, owing: Number(t.unit.rentAmount) - paid };
  });

  return {
    type: 'unpaid_tenants',
    message: unpaid.length > 0
      ? `${unpaid.length} tenant(s) haven't fully paid this month:`
      : 'All tenants are fully paid this month! 🎉',
    data: unpaid,
    total: unpaid.reduce((s, t) => s + t.owing, 0),
  };
}

async function queryCollectedThisMonth(landlordId) {
  const now = new Date();
  const agg = await prisma.payment.aggregate({
    where: {
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      unit: { property: { landlordId } },
    },
    _sum: { amount: true },
    _count: true,
  });
  return {
    type: 'collection',
    message: `Total collected this month: KSh ${Number(agg._sum.amount || 0).toLocaleString('en-KE')} from ${agg._count} payment(s).`,
    data: { collected: Number(agg._sum.amount || 0), count: agg._count },
  };
}

async function queryVacantUnits(landlordId) {
  const units = await prisma.unit.findMany({
    where: { property: { landlordId }, status: 'VACANT' },
    include: { property: { select: { name: true } } },
  });
  return {
    type: 'vacant_units',
    message: `${units.length} vacant unit(s):`,
    data: units.map((u) => ({ unit: u.unitNumber, property: u.property.name, rent: Number(u.rentAmount) })),
  };
}

async function queryOccupiedUnits(landlordId) {
  const count = await prisma.unit.count({ where: { property: { landlordId }, status: 'OCCUPIED' } });
  return { type: 'occupied_units', message: `${count} unit(s) are currently occupied.`, data: { count } };
}

async function queryOpenTickets(landlordId) {
  const tickets = await prisma.maintenanceTicket.findMany({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, unit: { property: { landlordId } } },
    include: { unit: { select: { unitNumber: true } }, tenant: { select: { name: true } } },
    take: 10,
  });
  return {
    type: 'open_tickets',
    message: `${tickets.length} open ticket(s):`,
    data: tickets.map((t) => ({ id: t.id.slice(0, 8), category: t.category, unit: t.unit.unitNumber, tenant: t.tenant.name, status: t.status })),
  };
}

async function queryTenantCount(landlordId) {
  const count = await prisma.tenant.count({ where: { isActive: true, unit: { property: { landlordId } } } });
  return { type: 'tenant_count', message: `You have ${count} active tenant(s).`, data: { count } };
}

async function queryPropertyCount(landlordId) {
  const count = await prisma.property.count({ where: { landlordId } });
  return { type: 'property_count', message: `You have ${count} property/properties.`, data: { count } };
}

async function queryWaterBills(landlordId) {
  const now = new Date();
  const bills = await prisma.bill.findMany({
    where: { type: 'WATER', unit: { property: { landlordId } }, periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() },
    include: { tenant: { select: { name: true } }, unit: { select: { unitNumber: true } } },
  });
  const total = bills.reduce((s, b) => s + Number(b.amount), 0);
  return {
    type: 'water_bills',
    message: `${bills.length} water bill(s) this month totaling KSh ${total.toLocaleString('en-KE')}.`,
    data: bills.map((b) => ({ tenant: b.tenant.name, unit: b.unit.unitNumber, amount: Number(b.amount), status: b.status })),
  };
}

async function queryRiskyTenants(landlordId) {
  const predictions = await predictOverdueTenants(landlordId);
  const risky = predictions.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'MEDIUM');
  return {
    type: 'risky_tenants',
    message: `${risky.length} tenant(s) flagged as at-risk:`,
    data: risky.slice(0, 10).map((r) => ({ name: r.name, unit: r.unit, riskLevel: r.riskLevel, riskScore: r.riskScore, factors: r.riskFactors })),
  };
}

async function queryOccupancyRate(landlordId) {
  const stats = await getOccupancyStats(landlordId);
  return {
    type: 'occupancy_rate',
    message: `Overall occupancy rate: ${stats.overall.occupancyRate}% (${stats.overall.occupied}/${stats.overall.total} units).`,
    data: stats,
  };
}

async function queryCollectionRate(landlordId) {
  const summary = await getRevenueSummary(landlordId, 1);
  return {
    type: 'collection_rate',
    message: `Collection rate this month: ${summary.currentMonth.collectionRate}% (KSh ${summary.currentMonth.collected.toLocaleString('en-KE')} of KSh ${summary.currentMonth.expected.toLocaleString('en-KE')}).`,
    data: summary.currentMonth,
  };
}

async function queryBestTenants(landlordId) {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true, unit: { property: { landlordId } } },
    include: {
      trustScore: { select: { score: true } },
      unit: { select: { unitNumber: true } },
    },
    orderBy: { trustScore: { score: 'desc' } },
    take: 5,
  });
  return {
    type: 'best_tenants',
    message: `Top tenants by trust score:`,
    data: tenants.map((t) => ({ name: t.name, unit: t.unit?.unitNumber, score: t.trustScore?.score || 500 })),
  };
}

module.exports = { predictOverdueTenants, getRevenueSummary, getOccupancyStats, processNaturalLanguageQuery };
