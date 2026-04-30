const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { generateTokens, rotateRefreshToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ─── Landlord Register ───────────────────────────────────────────────────────

router.post('/register',
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('phone').trim().matches(/^(\+?254|0)[17]\d{8}$/).withMessage('Invalid Kenyan phone'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, phone, email, password } = req.body;
    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const landlord = await prisma.landlord.create({
        data: { name, phone, email, passwordHash },
        select: { id: true, name: true, phone: true, email: true, plan: true },
      });

      const tokens = generateTokens({ id: landlord.id, role: 'LANDLORD', phone: landlord.phone });
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { token: tokens.refreshToken, landlordId: landlord.id, expiresAt },
      });

      logger.info('Landlord registered', { landlordId: landlord.id });
      res.status(201).json({ landlord, ...tokens });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Smart Login ─────────────────────────────────────────────────────────────

router.post('/smart-login',
  body('identifier').trim().notEmpty(),
  body('password').notEmpty(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { identifier, password } = req.body;
    try {
      // 1. Try Landlord / Admin
      const landlord = await prisma.landlord.findFirst({
        where: {
          OR: [{ email: identifier }, { phone: identifier }]
        }
      });
      if (landlord && await bcrypt.compare(password, landlord.passwordHash)) {
        const role = landlord.isAdmin ? 'ADMIN' : 'LANDLORD';
        const tokens = generateTokens({ id: landlord.id, role, phone: landlord.phone });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
          data: { token: tokens.refreshToken, landlordId: landlord.id, expiresAt },
        });
        const { passwordHash: _, ...user } = landlord;
        return res.json({ user, role, ...tokens });
      }

      // 2. Try Caretaker
      const caretaker = await prisma.caretaker.findFirst({
        where: { phone: identifier, isActive: true }
      });
      if (caretaker && await bcrypt.compare(password, caretaker.passwordHash)) {
        const tokens = generateTokens({ id: caretaker.id, role: 'CARETAKER', phone: caretaker.phone, landlordId: caretaker.landlordId });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
          data: { token: tokens.refreshToken, caretakerId: caretaker.id, expiresAt },
        });
        const { passwordHash: _, ...user } = caretaker;
        return res.json({ user, role: 'CARETAKER', ...tokens });
      }

      // 3. Try Tenant
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [{ phone: identifier }, { email: identifier }]
        }
      });
      if (tenant && await bcrypt.compare(password, tenant.passwordHash)) {
        if (!tenant.isActive) {
          return res.status(403).json({ error: 'Account disabled' });
        }
        const tokens = generateTokens({ id: tenant.id, role: 'TENANT', phone: tenant.phone });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
          data: { token: tokens.refreshToken, tenantId: tenant.id, expiresAt },
        });
        const { passwordHash: _, idNumber: __, ...user } = tenant;
        return res.json({ user, role: 'TENANT', ...tokens });
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Refresh Token ───────────────────────────────────────────────────────────
router.post('/refresh', rotateRefreshToken);

// ─── Logout ──────────────────────────────────────────────────────────────────
router.post('/logout', async (req, res, next) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
  res.json({ message: 'Logged out' });
});

module.exports = router;
