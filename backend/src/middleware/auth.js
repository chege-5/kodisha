const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');

function parseDurationMs(value, fallbackMs) {
  if (!value || typeof value !== 'string') return fallbackMs;
  const match = value.trim().match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * multipliers[unit];
}

function cookieOptions(maxAge) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge,
  };
}

function setAuthCookies(res, tokens) {
  res.cookie('accessToken', tokens.accessToken, cookieOptions(parseDurationMs(process.env.JWT_EXPIRES_IN, 15 * 60 * 1000)));
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions(parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000)));
}

function clearAuthCookies(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseOptions = { path: '/', sameSite: isProduction ? 'none' : 'lax', secure: isProduction };
  res.clearCookie('accessToken', baseOptions);
  res.clearCookie('refreshToken', baseOptions);
}

function readCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const match = raw.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function getBearerOrCookieToken(req, cookieName) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return readCookie(req, cookieName);
}

async function authenticate(req, res, next) {
  const token = getBearerOrCookieToken(req, 'accessToken');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

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
  const refreshToken = req.body?.refreshToken || readCookie(req, 'refreshToken');
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token invalid or expired' });
    }

    // Rotate: delete old, issue new pair
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    const newPayload = {
      id: payload.id,
      role: payload.role,
      phone: payload.phone,
      ...(payload.landlordId && { landlordId: payload.landlordId }),
    };
    const tokens = generateTokens(newPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenData = { token: tokens.refreshToken, expiresAt };
    if (payload.role === 'LANDLORD' || payload.role === 'ADMIN') tokenData.landlordId = payload.id;
    else if (payload.role === 'CARETAKER') tokenData.caretakerId = payload.id;
    else if (payload.role === 'TENANT') tokenData.tenantId = payload.id;

    await prisma.refreshToken.create({ data: tokenData });

    setAuthCookies(res, tokens);

    res.json({ message: 'Refreshed', accessToken: tokens.accessToken, role: newPayload.role });
  } catch (err) {
    logger.warn('Refresh token rotation failed', { error: err.name });
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

module.exports = { authenticate, generateTokens, rotateRefreshToken, setAuthCookies, clearAuthCookies, readCookie };
