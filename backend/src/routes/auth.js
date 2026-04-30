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

// ─── Landlord Login ──────────────────────────────────────────────────────────

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const landlord = await prisma.landlord.findUnique({ where: { email } });
      if (!landlord || !(await bcrypt.compare(password, landlord.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const tokens = generateTokens({ id: landlord.id, role: 'LANDLORD', phone: landlord.phone });
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { token: tokens.refreshToken, landlordId: landlord.id, expiresAt },
      });

      const { passwordHash: _, ...landlordData } = landlord;
      res.json({ user: landlordData, role: 'LANDLORD', ...tokens });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Tenant Login ────────────────────────────────────────────────────────────

router.post('/tenant/login',
  body('phone').trim().notEmpty(),
  body('password').notEmpty(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone, password } = req.body;
    try {
      const tenant = await prisma.tenant.findUnique({ where: { phone } });
      if (!tenant || !(await bcrypt.compare(password, tenant.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const tokens = generateTokens({ id: tenant.id, role: 'TENANT', phone: tenant.phone });
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { token: tokens.refreshToken, tenantId: tenant.id, expiresAt },
      });

      const { passwordHash: _, idNumber: __, ...tenantData } = tenant;
      res.json({ user: tenantData, role: 'TENANT', ...tokens });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Caretaker Login ─────────────────────────────────────────────────────────

router.post('/caretaker/login',
  body('phone').trim().notEmpty(),
  body('password').notEmpty(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone, password } = req.body;
    try {
      const caretaker = await prisma.caretaker.findUnique({ where: { phone } });
      if (!caretaker || !caretaker.isActive || !(await bcrypt.compare(password, caretaker.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const tokens = generateTokens({ id: caretaker.id, role: 'CARETAKER', phone: caretaker.phone, landlordId: caretaker.landlordId });
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { token: tokens.refreshToken, caretakerId: caretaker.id, expiresAt },
      });

      const { passwordHash: _, ...caretakerData } = caretaker;
      res.json({ user: caretakerData, role: 'CARETAKER', ...tokens });
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
