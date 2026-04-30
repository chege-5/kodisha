const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
const REPORT_DIR = process.env.STORAGE_PATH
  ? path.join(process.env.STORAGE_PATH, 'reports')
  : path.join(__dirname, '../../uploads/reports');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function monthName(m) {
  return ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'][m];
}

function quarterMonths(quarter) {
  const map = { Q1: [1, 2, 3], Q2: [4, 5, 6], Q3: [7, 8, 9], Q4: [10, 11, 12], ANNUAL: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] };
  return map[quarter] || map.ANNUAL;
}

async function generateITax(landlordId, year, quarter = 'ANNUAL') {
  ensureDir(REPORT_DIR);

  const months = quarterMonths(quarter);
  const landlord = await prisma.landlord.findUnique({ where: { id: landlordId } });

  // Fetch all payments for this landlord's units in the period
  const payments = await prisma.payment.findMany({
    where: {
      periodYear: year,
      periodMonth: { in: months },
      unit: { property: { landlordId } },
    },
    include: {
      tenant: { select: { name: true } },
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
    },
    orderBy: [{ periodMonth: 'asc' }, { unit: { unitNumber: 'asc' } }],
  });

  const rows = payments.map((p) => ({
    Month: monthName(p.periodMonth),
    Unit: p.unit.unitNumber,
    Property: p.unit.property.name,
    'Tenant Name': p.tenant.name,
    'Rent Amount (KES)': parseFloat(p.amount).toFixed(2),
    'Late Fees (KES)': parseFloat(p.lateFee || 0).toFixed(2),
    'Total (KES)': (parseFloat(p.amount) + parseFloat(p.lateFee || 0)).toFixed(2),
    Channel: p.channel,
    'Payment Date': p.paymentDate.toISOString().slice(0, 10),
  }));

  const totalIncome = payments.reduce((s, p) => s + parseFloat(p.amount) + parseFloat(p.lateFee || 0), 0);

  // Summary row
  rows.push({
    Month: 'TOTAL',
    Unit: '',
    Property: '',
    'Tenant Name': '',
    'Rent Amount (KES)': payments.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2),
    'Late Fees (KES)': payments.reduce((s, p) => s + parseFloat(p.lateFee || 0), 0).toFixed(2),
    'Total (KES)': totalIncome.toFixed(2),
    Channel: '',
    'Payment Date': '',
  });

  const baseName = `itax_${landlordId}_${year}_${quarter}_${Date.now()}`;
  const csvPath = path.join(REPORT_DIR, `${baseName}.csv`);
  const pdfPath = path.join(REPORT_DIR, `${baseName}.pdf`);

  // Write CSV
  await new Promise((resolve, reject) => {
    stringify(rows, { header: true }, (err, output) => {
      if (err) return reject(err);
      fs.writeFile(csvPath, output, (e) => e ? reject(e) : resolve());
    });
  });

  // Write PDF
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(14).font('Helvetica-Bold')
      .text(`KRA RENTAL INCOME TAX RETURN — ${year} ${quarter}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text(`Landlord: ${landlord.name} | Generated: ${new Date().toLocaleDateString('en-KE')}`, { align: 'center' });
    doc.moveDown();

    const colWidths = [60, 50, 100, 100, 90, 80, 90, 60, 80];
    const headers = Object.keys(rows[0]);
    let x = 40;
    let y = doc.y;

    doc.font('Helvetica-Bold').fontSize(8);
    headers.forEach((h, i) => {
      doc.text(h, x, y, { width: colWidths[i], lineBreak: false });
      x += colWidths[i];
    });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(750, doc.y).stroke();

    doc.font('Helvetica').fontSize(7.5);
    rows.forEach((row, ri) => {
      x = 40;
      y = doc.y + 2;
      if (ri === rows.length - 1) {
        doc.font('Helvetica-Bold');
        doc.moveTo(40, y - 2).lineTo(750, y - 2).stroke();
      }
      Object.values(row).forEach((val, i) => {
        doc.text(String(val), x, y, { width: colWidths[i], lineBreak: false });
        x += colWidths[i];
      });
      doc.moveDown(0.6);
    });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const csvUrl = `/uploads/reports/${baseName}.csv`;
  const pdfUrl = `/uploads/reports/${baseName}.pdf`;

  await prisma.iTaxReport.create({
    data: { landlordId, year, quarter, totalIncome, csvUrl, pdfUrl },
  });

  logger.info('iTax report generated', { landlordId, year, quarter, totalIncome });
  return { csvUrl, pdfUrl, totalIncome, rowCount: rows.length - 1 };
}

module.exports = { generateITax };
