const router = require('express').Router();
const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const logger = require('../utils/logger');

router.use(authenticate);
router.use(requireRole('ADMIN'));

// ─── Platform overview stats ─────────────────────────────────────────────────

router.get('/stats', async (req, res, next) => {
  try {
    const [landlordCount, caretakerCount, tenantCount, propertyCount, unitCount, totalRevenue, openTickets] = await Promise.all([
      prisma.landlord.count(),
      prisma.caretaker.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.property.count(),
      prisma.unit.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.maintenanceTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);

    res.json({
      users: { landlords: landlordCount, caretakers: caretakerCount, tenants: tenantCount, total: landlordCount + caretakerCount + tenantCount },
      properties: propertyCount,
      units: unitCount,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      openTickets,
    });
  } catch (err) { next(err); }
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
