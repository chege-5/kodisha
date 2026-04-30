const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { getTier } = require('../services/trustScore');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
const PASSPORT_DIR = path.join(__dirname, '../../uploads/passports');

router.use(authenticate);

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// ─── Get Credit Passport ──────────────────────────────────────────────────────

router.get('/:tenantId', async (req, res, next) => {
  const { tenantId } = req.params;

  // Tenants can only see their own passport
  if (req.user.role === 'TENANT' && req.user.id !== tenantId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const [tenant, passport, trustScore, payments] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, phone: true, leaseStart: true, unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
      }),
      prisma.creditPassport.findUnique({ where: { tenantId } }),
      prisma.trustScore.findUnique({ where: { tenantId } }),
      prisma.payment.findMany({
        where: { tenantId },
        select: { periodYear: true, periodMonth: true, daysLate: true, isPartial: true, amount: true },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
        take: 12,
      }),
    ]);

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const score = trustScore?.score || 500;
    const tier = getTier(score);
    const onTimeRate = passport?.totalMonths > 0
      ? ((passport.onTimeMonths / passport.totalMonths) * 100).toFixed(1)
      : '0.0';

    // Build 12-month payment calendar
    const calendar = buildPaymentCalendar(payments);

    res.json({
      tenant,
      passport: {
        totalMonths: passport?.totalMonths || 0,
        onTimeMonths: passport?.onTimeMonths || 0,
        lateMonths: passport?.lateMonths || 0,
        partialMonths: passport?.partialMonths || 0,
        missedMonths: passport?.missedMonths || 0,
        onTimeRate: `${onTimeRate}%`,
        averageDaysLate: parseFloat(passport?.averageDaysLate || 0).toFixed(1),
      },
      trustScore: { score, tier },
      paymentCalendar: calendar,
    });
  } catch (err) { next(err); }
});

// ─── Generate Shareable PDF ───────────────────────────────────────────────────

router.post('/:tenantId/share', async (req, res, next) => {
  const { tenantId } = req.params;
  ensureDir(PASSPORT_DIR);

  try {
    const [tenant, passport, trustScore] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { unit: { include: { property: true } } },
      }),
      prisma.creditPassport.findUnique({ where: { tenantId } }),
      prisma.trustScore.findUnique({ where: { tenantId } }),
    ]);

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const score = trustScore?.score || 500;
    const tier = getTier(score);
    const filename = `passport_${tenantId}_${Date.now()}.pdf`;
    const filepath = path.join(PASSPORT_DIR, filename);
    const publicUrl = `/uploads/passports/${filename}`;

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.rect(0, 0, 595, 80).fill('#1a365d');
      doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
        .text('KODI CREDIT PASSPORT', 50, 25, { align: 'center' });
      doc.fontSize(10).text('Verified Rental Payment History — Kenya', 50, 55, { align: 'center' });

      doc.fillColor('black').moveDown(4);

      // Tenant info
      doc.fontSize(13).font('Helvetica-Bold').text('Tenant Information');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Name: ${tenant.name}`);
      doc.text(`Phone: ${tenant.phone}`);
      doc.text(`Property: ${tenant.unit?.property?.name || 'N/A'}, Unit ${tenant.unit?.unitNumber || 'N/A'}`);
      doc.text(`Lease Start: ${tenant.leaseStart.toLocaleDateString('en-KE')}`);
      doc.moveDown();

      // Score box
      const scoreColor = score >= 750 ? '#276749' : score >= 600 ? '#2b6cb0' : score >= 400 ? '#c05621' : '#9b2c2c';
      doc.rect(50, doc.y, 495, 60).fill(scoreColor);
      doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
        .text(`${score}`, 60, doc.y - 50, { lineBreak: false });
      doc.fontSize(16).text(`  ${tier}`, { lineBreak: false });
      doc.fontSize(10).text('   Trust Score (500 = Neutral, 900 = Max)', { continued: false });
      doc.fillColor('black').moveDown(4);

      // Stats
      doc.fontSize(13).font('Helvetica-Bold').text('Payment Summary');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Months Tracked: ${passport?.totalMonths || 0}`);
      doc.text(`On-Time Payments: ${passport?.onTimeMonths || 0}`);
      doc.text(`Late Payments: ${passport?.lateMonths || 0}`);
      doc.text(`Partial Payments: ${passport?.partialMonths || 0}`);
      const rate = passport?.totalMonths > 0 ? ((passport.onTimeMonths / passport.totalMonths) * 100).toFixed(1) : '0.0';
      doc.text(`On-Time Rate: ${rate}%`);
      doc.text(`Average Days Late: ${parseFloat(passport?.averageDaysLate || 0).toFixed(1)}`);
      doc.moveDown();

      doc.fontSize(9).fillColor('#666')
        .text(`Generated by KODI Platform on ${new Date().toLocaleDateString('en-KE')}. This document reflects verified payment data.`, { align: 'center' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    logger.info('Credit passport PDF generated', { tenantId });
    res.json({ pdfUrl: publicUrl, message: 'Passport generated successfully' });
  } catch (err) { next(err); }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPaymentCalendar(payments) {
  const now = new Date();
  const calendar = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const payment = payments.find((p) => p.periodMonth === month && p.periodYear === year);

    let status = 'missed';
    if (payment) {
      if (payment.isPartial) status = 'partial';
      else if (payment.daysLate === 0) status = 'paid';
      else status = 'late';
    } else if (date > now) {
      status = 'future';
    }

    calendar.push({
      month: date.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }),
      year,
      monthNum: month,
      status,
      daysLate: payment?.daysLate || 0,
    });
  }
  return calendar;
}

module.exports = router;
