const logger = require('../utils/logger');

// Africa's Talking IP whitelist validation
const WHITELISTED_IPS = (process.env.AT_WHITELISTED_IPS || '').split(',').map((ip) => ip.trim());

function validateATRequest(req, res, next) {
  if (process.env.NODE_ENV === 'development') return next(); // Skip in dev

  const clientIP =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket.remoteAddress;

  if (!WHITELISTED_IPS.includes(clientIP)) {
    logger.warn('Blocked non-AT request', { ip: clientIP, path: req.path });
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

module.exports = { validateATRequest };
