require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cron = require('node-cron');

const prisma = require('./utils/prismaClient');
const logger = require('./utils/logger');
const { rateLimiter, strictLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const ussdRoutes = require('./routes/ussd');
const smsRoutes = require('./routes/sms');
const voiceRoutes = require('./routes/voice');
const mpesaRoutes = require('./routes/mpesa');
const tenantRoutes = require('./routes/tenants');
const landlordRoutes = require('./routes/landlords');
const reportRoutes = require('./routes/reports');
const leaseRoutes = require('./routes/leases');
const diasporaRoutes = require('./routes/diaspora');
const broadcastRoutes = require('./routes/broadcast');
const airtimeRoutes = require('./routes/airtime');
const passportRoutes = require('./routes/passport');
const caretakerRoutes = require('./routes/caretakers');
const whatsappRoutes = require('./routes/whatsapp');

// New Kodisha routes
const billRoutes = require('./routes/bills');
const meterReadingRoutes = require('./routes/meterReadings');
const notificationRoutes = require('./routes/notifications');
const insightRoutes = require('./routes/insights');
const adminRoutes = require('./routes/admin');

// Cron jobs
const { scheduleRentReminders } = require('./jobs/rentReminders');
const { scheduleTrustScoreSync } = require('./jobs/trustScoreSync');
const { scheduleMonthlyDigest } = require('./jobs/monthlyDigest');

const app = express();
const PORT = process.env.PORT || 5000;

// Share prisma with legacy code that reads from app.get('prisma')
app.set('prisma', prisma);

// ─── Core Middleware ─────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// Apply rate limiting to all routes
app.use(rateLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      platform: 'Kodisha',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      services: { database: 'up', api: 'up' },
    });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'down', error: err.message });
  }
});

// ─── Public Routes (no auth needed) ─────────────────────────────────────────

app.use('/auth', strictLimiter, authRoutes);
app.use('/ussd', ussdRoutes);           // AT validates via IP whitelist middleware
app.use('/sms', smsRoutes);
app.use('/voice', voiceRoutes);
app.use('/mpesa', mpesaRoutes);
app.use('/whatsapp', whatsappRoutes);

// ─── Protected Routes (JWT required) ────────────────────────────────────────

app.use('/landlords', landlordRoutes);
app.use('/caretakers', caretakerRoutes);
app.use('/tenants', tenantRoutes);
app.use('/reports', reportRoutes);
app.use('/leases', leaseRoutes);
app.use('/diaspora', diasporaRoutes);
app.use('/broadcast', broadcastRoutes);
app.use('/airtime', airtimeRoutes);
app.use('/passport', passportRoutes);

// New Kodisha routes
app.use('/bills', billRoutes);
app.use('/meter-readings', meterReadingRoutes);
app.use('/notifications', notificationRoutes);
app.use('/insights', insightRoutes);
app.use('/admin', adminRoutes);

// Static files (generated PDFs, uploads)
app.use('/uploads', express.static('uploads'));

// ─── Error Handler ───────────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Cron Jobs ───────────────────────────────────────────────────────────────

function startCronJobs() {
  // 1st of month at 8:00 AM — rent reminders
  scheduleRentReminders();

  // Daily at midnight — trust score sync
  scheduleTrustScoreSync();

  // Weekly Sunday at 7:00 AM — digest emails
  scheduleMonthlyDigest();

  // Daily at 6am — mark overdue bills
  const { markOverdueBills } = require('./services/billService');
  cron.schedule('0 6 * * *', async () => {
    try {
      const count = await markOverdueBills();
      logger.info('Overdue bills cron completed', { count });
    } catch (err) {
      logger.error('Overdue bills cron failed', { error: err.message });
    }
  });

  logger.info('Cron jobs scheduled');
}

// ─── Startup ─────────────────────────────────────────────────────────────────

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(PORT, () => {
      logger.info(`Kodisha API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    startCronJobs();
  } catch (err) {
    logger.error('Startup failed', { error: err.message });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

start();

module.exports = app;
