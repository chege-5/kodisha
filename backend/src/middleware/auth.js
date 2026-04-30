const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, phone }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
}

async function rotateRefreshToken(req, res, next) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token invalid or expired' });
    }

    // Rotate: delete old, issue new pair
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const newPayload = { id: payload.id, role: payload.role, phone: payload.phone };
    const tokens = generateTokens(newPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenData = { token: tokens.refreshToken, expiresAt };
    if (payload.role === 'LANDLORD') tokenData.landlordId = payload.id;
    else if (payload.role === 'CARETAKER') tokenData.caretakerId = payload.id;
    else if (payload.role === 'TENANT') tokenData.tenantId = payload.id;

    await prisma.refreshToken.create({ data: tokenData });

    res.json(tokens);
  } catch (err) {
    logger.warn('Refresh token rotation failed', { error: err.message });
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

module.exports = { authenticate, generateTokens, rotateRefreshToken };
