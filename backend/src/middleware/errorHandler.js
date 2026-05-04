const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const requestId = req.headers['x-request-id'] || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const isProduction = process.env.NODE_ENV === 'production';

  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    stack: isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'That record already exists. Please check the details and try again.', requestId });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'We could not find that record. It may have been moved or deleted.', requestId });
    }
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Please check the highlighted details and try again.', requestId });
  }

  const statusCode = err.statusCode || 500;
  const friendlyMessages = {
    400: 'Some required information is missing or invalid.',
    401: 'Please sign in again to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'We could not find what you are looking for.',
    409: 'This change conflicts with existing information.',
    429: 'Too many requests. Please wait a moment and try again.',
  };
  const message = statusCode >= 500
    ? 'Something went wrong on our side. Please try again shortly.'
    : friendlyMessages[statusCode] || 'We could not complete that request. Please try again.';

  res.status(statusCode).json({ error: message, requestId });
}

module.exports = errorHandler;
