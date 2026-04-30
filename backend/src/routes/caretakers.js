const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { notifyIssueClosed } = require('../services/issueMessaging');

const prisma = new PrismaClient();
router.use(authenticate);

// ─── List caretakers (landlord view) ─────────────────────────────────────────

router.get('/', requireRole('LANDLORD', 'ADMIN'), async (req, res, next) => {
  try {
    const caretakers = await prisma.caretaker.findMany({
      where: { landlordId: req.user.id },
      select: { id: true, name: true, phone: true, permissions: true, isActive: true, createdAt: true },
    });
    res.json(caretakers);
  } catch (err) { next(err); }
});

// ─── Update caretaker ─────────────────────────────────────────────────────────

router.patch('/:id', requireRole('LANDLORD'), async (req, res, next) => {
  const allowed = ['name', 'permissions', 'isActive'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  try {
    const updated = await prisma.caretaker.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, phone: true, permissions: true, isActive: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// ─── Caretaker's assigned property data ──────────────────────────────────────

router.get('/portal', requireRole('CARETAKER'), async (req, res, next) => {
  try {
    const caretaker = await prisma.caretaker.findUnique({ where: { id: req.user.id } });
    const units = await prisma.unit.findMany({
      where: { property: { landlordId: caretaker.landlordId } },
      include: {
        property: { select: { name: true } },
        tenants: {
          where: { isActive: true },
          select: { id: true, name: true, phone: true },
        },
        payments: {
          where: {
            periodMonth: new Date().getMonth() + 1,
            periodYear: new Date().getFullYear(),
          },
          select: { amount: true, channel: true },
        },
        tickets: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          select: { id: true, category: true, status: true, createdAt: true },
        },
      },
    });

    res.json({ caretaker: { id: caretaker.id, name: caretaker.name }, units });
  } catch (err) { next(err); }
});

// ─── Maintenance tickets (caretaker view) ────────────────────────────────────

router.get('/tickets', requireRole('CARETAKER'), async (req, res, next) => {
  try {
    const caretaker = await prisma.caretaker.findUnique({ where: { id: req.user.id } });
    const tickets = await prisma.maintenanceTicket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        unit: { property: { landlordId: caretaker.landlordId } },
      },
      include: {
        unit: { select: { unitNumber: true } },
        tenant: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (err) { next(err); }
});

// ─── Update ticket status ─────────────────────────────────────────────────────

router.patch('/tickets/:ticketId', requireRole('CARETAKER', 'LANDLORD'), async (req, res, next) => {
  const { status, assignedTo } = req.body;
  try {
    const data = { ...(status && { status }), ...(assignedTo && { assignedTo }) };
    if (status === 'CLOSED') data.closedAt = new Date();

    const ticket = await prisma.maintenanceTicket.update({
      where: { id: req.params.ticketId },
      data,
      include: {
        tenant: { select: { id: true, phone: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
      },
    });

    if (status === 'CLOSED') {
      await notifyIssueClosed(ticket);
    }

    res.json(ticket);
  } catch (err) { next(err); }
});

module.exports = router;
