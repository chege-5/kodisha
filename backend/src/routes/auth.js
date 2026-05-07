const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { generateTokens, rotateRefreshToken, setAuthCookies, clearAuthCookies, readCookie } = require('../middleware/auth');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// ─── Landlord Register ───────────────────────────────────────────────────────

router.post('/register',
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('phone').trim().matches(/^(\+?254|0)[17]\d{8}$/).withMessage('Invalid Kenyan phone'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PUBLIC_REGISTRATION !== 'true') {
      return res.status(403).json({ error: 'Landlord accounts are created by the super admin.' });
    }

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

      setAuthCookies(res, tokens);

      logger.info('Landlord registered', { landlordId: landlord.id });
      res.status(201).json({ landlord, role: 'LANDLORD' });
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
        setAuthCookies(res, tokens);
        const { passwordHash: _, ...user } = landlord;
        return res.json({ user, role });
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
        setAuthCookies(res, tokens);
        const { passwordHash: _, ...user } = caretaker;
        return res.json({ user, role: 'CARETAKER' });
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
        setAuthCookies(res, tokens);
        const { passwordHash: _, idNumber: __, ...user } = tenant;
        return res.json({ user, role: 'TENANT' });
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
  const refreshToken = req.body?.refreshToken || readCookie(req, 'refreshToken');
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
  clearAuthCookies(res);
  res.json({ message: 'Logged out' });
});

router.post('/change-password', authenticate,
  body('currentPassword').isLength({ min: 1 }),
  body('newPassword').isLength({ min: 12 }).withMessage('Use at least 12 characters'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;

    try {
      const model = req.user.role === 'TENANT' ? 'tenant' : req.user.role === 'CARETAKER' ? 'caretaker' : 'landlord';
      const record = await prisma[model].findUnique({ where: { id: req.user.id } });
      if (!record) return res.status(404).json({ error: 'Account not found' });

      const valid = await bcrypt.compare(currentPassword, record.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma[model].update({ where: { id: req.user.id }, data: { passwordHash } });

      await prisma.refreshToken.deleteMany({
        where: model === 'landlord' ? { landlordId: req.user.id } : model === 'caretaker' ? { caretakerId: req.user.id } : { tenantId: req.user.id },
      });

      clearAuthCookies(res);
      res.json({ message: 'Password updated. Please sign in again.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
