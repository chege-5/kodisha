const router = require('express').Router();
const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const logger = require('../utils/logger');

router.use(authenticate);
router.use(requireRole('ADMIN'));

function toDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildDaySeries(days) {
  const labels = [];
  const keys = [];
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(current);
    day.setDate(current.getDate() - index);
    labels.push(day.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }));
    keys.push(toDayKey(day));
  }
  return { labels, keys };
}

async function getPropertySummaries(limit = 20) {
  const properties = await prisma.property.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      address: true,
      county: true,
      type: true,
      createdAt: true,
      landlord: { select: { id: true, name: true, email: true } },
      units: {
        select: {
          id: true,
          status: true,
          rentAmount: true,
          tenants: { select: { id: true } },
          payments: { select: { amount: true } },
        },
      },
    },
  });

  return properties.map((property) => {
    const unitCount = property.units.length;
    const occupiedUnits = property.units.filter((unit) => unit.status === 'OCCUPIED').length;
    const vacantUnits = property.units.filter((unit) => unit.status === 'VACANT').length;
    const maintenanceUnits = property.units.filter((unit) => unit.status === 'MAINTENANCE').length;
    const totalRent = property.units.reduce((sum, unit) => sum + Number(unit.rentAmount || 0), 0);
    const cashTransacted = property.units.reduce(
      (sum, unit) => sum + unit.payments.reduce((paymentSum, payment) => paymentSum + Number(payment.amount || 0), 0),
      0,
    );

    return {
      ...property,
      unitCount,
      occupiedUnits,
      vacantUnits,
      maintenanceUnits,
      totalRent,
      cashTransacted,
    };
  });
}

// ─── Platform overview stats ─────────────────────────────────────────────────

router.get('/stats', async (req, res, next) => {
  try {
    const [
      landlordCount,
      caretakerCount,
      tenantCount,
      propertyCount,
      unitCount,
      totalRevenue,
      openTickets,
      occupiedUnits,
      paymentsCount,
      recentLoginCount,
      propertyTypes,
      countyBreakdown,
    ] = await Promise.all([
      prisma.landlord.count(),
      prisma.caretaker.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.property.count(),
      prisma.unit.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.maintenanceTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.unit.count({ where: { status: 'OCCUPIED' } }),
      prisma.payment.count(),
      prisma.systemLog.count({ where: { action: 'LOGIN', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.property.groupBy({ by: ['type'], _count: { _all: true } }),
      prisma.property.groupBy({ by: ['county'], _count: { _all: true }, orderBy: { _count: { county: 'desc' } } }),
    ]);

    res.json({
      users: { landlords: landlordCount, caretakers: caretakerCount, tenants: tenantCount, total: landlordCount + caretakerCount + tenantCount },
      properties: propertyCount,
      units: unitCount,
      occupiedUnits,
      vacantUnits: Math.max(unitCount - occupiedUnits, 0),
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      cashTransacted: Number(totalRevenue._sum.amount || 0),
      paymentsCount,
      openTickets,
      recentLoginCount,
      propertyTypes: propertyTypes.map((item) => ({ type: item.type, count: item._count._all })),
      counties: countyBreakdown.map((item) => ({ county: item.county, count: item._count._all })),
    });
  } catch (err) { next(err); }
});

router.get('/analytics', async (req, res, next) => {
  const days = Math.min(Math.max(Number(req.query.days) || 14, 7), 90);
  try {
    const { labels, keys } = buildDaySeries(days);
    const start = new Date(keys[0] + 'T00:00:00.000Z');

    const [payments, authLogs, accessLogs, userLogs] = await Promise.all([
      prisma.payment.findMany({
        where: { paymentDate: { gte: start } },
        select: { paymentDate: true, amount: true },
      }),
      prisma.systemLog.findMany({
        where: { createdAt: { gte: start }, action: { in: ['LOGIN', 'LOGOUT'] } },
        select: { action: true, createdAt: true },
      }),
      prisma.systemLog.findMany({
        where: { createdAt: { gte: start }, action: 'LOGIN' },
        select: { createdAt: true },
      }),
      prisma.systemLog.findMany({
        where: { createdAt: { gte: start }, action: { in: ['LANDLORD_CREATED', 'SUPER_ADMIN_BOOTSTRAPPED', 'PASSWORD_CHANGED'] } },
        select: { action: true, createdAt: true },
      }),
    ]);

    const accessByDay = Object.fromEntries(keys.map((key) => [key, 0]));
    const logoutByDay = Object.fromEntries(keys.map((key) => [key, 0]));
    const revenueByDay = Object.fromEntries(keys.map((key) => [key, 0]));
    const userEventsByDay = Object.fromEntries(keys.map((key) => [key, 0]));

    for (const entry of authLogs) {
      const key = toDayKey(new Date(entry.createdAt));
      if (entry.action === 'LOGIN' && key in accessByDay) accessByDay[key] += 1;
      if (entry.action === 'LOGOUT' && key in logoutByDay) logoutByDay[key] += 1;
    }

    for (const entry of payments) {
      const key = toDayKey(new Date(entry.paymentDate));
      if (key in revenueByDay) revenueByDay[key] += Number(entry.amount || 0);
    }

    for (const entry of userLogs) {
      const key = toDayKey(new Date(entry.createdAt));
      if (key in userEventsByDay) userEventsByDay[key] += 1;
    }

    const accessEvents = accessLogs.length;
    const logouts = authLogs.filter((entry) => entry.action === 'LOGOUT').length;

    res.json({
      labels,
      series: {
        logins: keys.map((key) => accessByDay[key]),
        logouts: keys.map((key) => logoutByDay[key]),
        revenue: keys.map((key) => revenueByDay[key]),
        userEvents: keys.map((key) => userEventsByDay[key]),
      },
      totals: {
        accessEvents,
        logouts,
        revenue: payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        userEvents: userLogs.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/properties', async (req, res, next) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  try {
    const properties = await getPropertySummaries(limit);
    res.json({ properties });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions', async (req, res, next) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  try {
    const transactions = await prisma.payment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        channel: true,
        isPartial: true,
        mpesaTransactionId: true,
        tenant: { select: { id: true, name: true, phone: true } },
        unit: { select: { id: true, unitNumber: true, property: { select: { id: true, name: true } } } },
      },
    });
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
});

// ─── List all users ──────────────────────────────────────────────────────────

router.get('/users', async (req, res, next) => {
  const { role, search, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const users = [];

    if (!role || role === 'LANDLORD') {
      const landlords = await prisma.landlord.findMany({
        where: search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {},
        select: { id: true, name: true, phone: true, email: true, plan: true, isAdmin: true, createdAt: true },
        skip: role ? skip : undefined,
        take: role ? Number(limit) : 20,
        orderBy: { createdAt: 'desc' },
      });
      users.push(...landlords.map((l) => ({ ...l, role: l.isAdmin ? 'ADMIN' : 'LANDLORD' })));
    }

    if (!role || role === 'CARETAKER') {
      const caretakers = await prisma.caretaker.findMany({
        where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
        select: { id: true, name: true, phone: true, isActive: true, landlordId: true, createdAt: true },
        skip: role ? skip : undefined,
        take: role ? Number(limit) : 20,
        orderBy: { createdAt: 'desc' },
      });
      users.push(...caretakers.map((c) => ({ ...c, role: 'CARETAKER', email: null })));
    }

    if (!role || role === 'TENANT') {
      const tenants = await prisma.tenant.findMany({
        where: search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] } : {},
        select: { id: true, name: true, phone: true, email: true, isActive: true, createdAt: true },
        skip: role ? skip : undefined,
        take: role ? Number(limit) : 20,
        orderBy: { createdAt: 'desc' },
      });
      users.push(...tenants.map((t) => ({ ...t, role: 'TENANT' })));
    }

    res.json({ users, page: Number(page) });
  } catch (err) { next(err); }
});

// ─── Create landlord / home owner ───────────────────────────────────────────

router.post('/landlords',
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('phone').trim().matches(/^(\+?254|0)[17]\d{8}$/).withMessage('Invalid Kenyan phone'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Use at least 8 characters'),
  body('plan').optional().isIn(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
  body('language').optional().isLength({ min: 2, max: 8 }),
  body('currencyPref').optional().isLength({ min: 3, max: 3 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      name,
      phone,
      email,
      password,
      plan = 'FREE',
      language = 'en',
      currencyPref = 'KES',
      monthlyAirtimeCap = 5000,
    } = req.body;

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const landlord = await prisma.landlord.create({
        data: {
          name,
          phone,
          email,
          passwordHash,
          plan,
          language,
          currencyPref,
          monthlyAirtimeCap: Number(monthlyAirtimeCap) || 5000,
          isAdmin: false,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          plan: true,
          isAdmin: true,
          createdAt: true,
        },
      });

      await prisma.systemLog.create({
        data: {
          userId: req.user.id,
          userRole: req.user.role,
          action: 'LANDLORD_CREATED',
          resource: 'landlord',
          details: { landlordId: landlord.id, email: landlord.email, plan: landlord.plan },
          ipAddress: req.ip,
        },
      }).catch(() => {});

      logger.info('Landlord created by admin', { adminId: req.user.id, landlordId: landlord.id });
      res.status(201).json({ landlord: { ...landlord, role: 'LANDLORD' } });
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'A user with that email or phone already exists.' });
      }
      next(err);
    }
  }
);

// ─── Toggle admin status ─────────────────────────────────────────────────────

router.patch('/users/:id/admin', async (req, res, next) => {
  const { isAdmin } = req.body;
  try {
    const nextIsAdmin = Boolean(isAdmin);
    const landlord = await prisma.landlord.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, isAdmin: true },
    });
    if (!landlord) return res.status(404).json({ error: 'User not found' });
    if (!nextIsAdmin && landlord.id === req.user.id) {
      return res.status(400).json({ error: 'The super admin account cannot demote itself.' });
    }
    if (nextIsAdmin) {
      const existingAdmin = await prisma.landlord.findFirst({
        where: { isAdmin: true, id: { not: landlord.id } },
        select: { id: true },
      });
      if (existingAdmin) {
        return res.status(409).json({ error: 'Only one super admin account is allowed.' });
      }
    }

    const updated = await prisma.landlord.update({
      where: { id: req.params.id },
      data: { isAdmin: nextIsAdmin },
      select: { id: true, name: true, email: true, isAdmin: true },
    });
    logger.info('Admin status toggled', { userId: req.params.id, isAdmin: updated.isAdmin });
    res.json(updated);
  } catch (err) { next(err); }
});

// ─── System logs ─────────────────────────────────────────────────────────────

router.get('/logs', async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  try {
    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.systemLog.count(),
    ]);
    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
});

// ─── Create system log ──────────────────────────────────────────────────────

router.post('/logs', async (req, res, next) => {
  const { action, resource, details } = req.body;
  try {
    const log = await prisma.systemLog.create({
      data: {
        userId: req.user.id,
        userRole: req.user.role,
        action,
        resource,
        details,
        ipAddress: req.ip,
      },
    });
    res.status(201).json(log);
  } catch (err) { next(err); }
});

module.exports = router;
