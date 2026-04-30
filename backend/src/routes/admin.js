const router = require('express').Router();
const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
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

// ─── Toggle admin status ─────────────────────────────────────────────────────

router.patch('/users/:id/admin', async (req, res, next) => {
  const { isAdmin } = req.body;
  try {
    const updated = await prisma.landlord.update({
      where: { id: req.params.id },
      data: { isAdmin: Boolean(isAdmin) },
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
