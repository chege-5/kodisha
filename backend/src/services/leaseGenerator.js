const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');

const UPLOADS_DIR = process.env.STORAGE_PATH || path.join(__dirname, '../../uploads/leases');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

async function generateLease({ tenantId, unitId, landlordId, customTerms }) {
  ensureDir(UPLOADS_DIR);

  const [tenant, unit, landlord] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.unit.findUnique({ where: { id: unitId }, include: { property: true } }),
    prisma.landlord.findUnique({ where: { id: landlordId } }),
  ]);

  if (!tenant || !unit || !landlord) throw new Error('Invalid tenant/unit/landlord IDs');

  const filename = `lease_${tenantId}_${Date.now()}.pdf`;
  const filepath = path.join(UPLOADS_DIR, filename);
  const publicUrl = `/uploads/leases/${filename}`;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('KODI RENTAL MANAGEMENT', { align: 'center' });
    doc.fontSize(14).text('RESIDENTIAL TENANCY AGREEMENT', { align: 'center' });
    doc.fontSize(10).text('(Kenya — Residential Tenancy)', { align: 'center' });
    doc.moveDown(2);

    // Parties
    doc.fontSize(12).font('Helvetica-Bold').text('PARTIES');
    doc.font('Helvetica').fontSize(11);
    doc.text(`LANDLORD: ${landlord.name}`);
    doc.text(`Phone: ${landlord.phone}  |  Email: ${landlord.email}`);
    doc.moveDown(0.5);
    doc.text(`TENANT: ${tenant.name}`);
    doc.text(`Phone: ${tenant.phone}  |  ID No: ${tenant.idNumber}`);
    doc.moveDown();

    // Property
    doc.font('Helvetica-Bold').fontSize(12).text('PROPERTY DETAILS');
    doc.font('Helvetica').fontSize(11);
    doc.text(`Property: ${unit.property.name}`);
    doc.text(`Address: ${unit.property.address}, ${unit.property.county}`);
    doc.text(`Unit Number: ${unit.unitNumber}`);
    doc.moveDown();

    // Terms
    doc.font('Helvetica-Bold').fontSize(12).text('TENANCY TERMS');
    doc.font('Helvetica').fontSize(11);
    doc.text(`Commencement Date: ${formatDate(tenant.leaseStart)}`);
    doc.text(`End Date: ${tenant.leaseEnd ? formatDate(tenant.leaseEnd) : 'Periodic (month-to-month)'}`);
    doc.text(`Monthly Rent: KSh ${parseFloat(unit.rentAmount).toLocaleString('en-KE')}`);
    doc.text(`Security Deposit: KSh ${parseFloat(tenant.depositAmount).toLocaleString('en-KE')}`);
    doc.text('Rent Due Date: 1st of each calendar month');
    doc.text('Notice Period: 30 days (either party)');
    doc.moveDown();

    // Standard KRA-compliant clauses
    doc.font('Helvetica-Bold').text('STANDARD CLAUSES');
    doc.font('Helvetica').fontSize(10);
    const clauses = [
      '1. RENT: The Tenant agrees to pay the agreed monthly rent on the 1st day of each month. Payments shall be made via M-Pesa or bank transfer unless otherwise agreed.',
      '2. DEPOSIT: The security deposit shall be held by the Landlord against any damages beyond normal wear and tear and any unpaid rent. It shall be refunded within 30 days of vacating, less any lawful deductions.',
      '3. USE: The premises shall be used solely as a private residential dwelling by the Tenant and immediate family members. Sub-letting requires written consent.',
      '4. REPAIRS: The Landlord shall maintain the structure and exterior. The Tenant is responsible for minor repairs (below KSh 5,000) and shall promptly report defects.',
      '5. UTILITIES: Unless specified otherwise, the Tenant shall pay all utility bills (electricity, water) accrued during occupancy.',
      '6. TERMINATION: Either party may terminate this agreement with 30 days written notice. Breach of this agreement entitles the aggrieved party to terminate with 7 days notice.',
      '7. TAX COMPLIANCE: This agreement is subject to applicable Kenyan tax law. The Landlord is responsible for declaring rental income per KRA requirements (Income Tax Act, Cap 470).',
      '8. GOVERNING LAW: This agreement is governed by the laws of the Republic of Kenya, including the Landlord and Tenant (Shops, Hotels and Catering Establishments) Act and the Rent Restrictions Act.',
    ];
    clauses.forEach((c) => { doc.text(c, { paragraphGap: 5 }); doc.moveDown(0.3); });

    if (customTerms) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('SPECIAL CONDITIONS');
      doc.font('Helvetica').text(customTerms);
    }

    doc.moveDown(2);

    // Swahili summary
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('MUHTASARI WA MKATABA (KISWAHILI)', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text(`Mpangaji: ${tenant.name}`);
    doc.text(`Mwenye nyumba: ${landlord.name}`);
    doc.text(`Nyumba: ${unit.property.name}, Chumba ${unit.unitNumber}`);
    doc.text(`Kodi ya mwezi: KSh ${parseFloat(unit.rentAmount).toLocaleString('en-KE')}`);
    doc.text(`Amana: KSh ${parseFloat(tenant.depositAmount).toLocaleString('en-KE')}`);
    doc.text(`Tarehe ya kuanza: ${formatDate(tenant.leaseStart)}`);
    doc.moveDown();
    doc.text('Masharti muhimu:');
    doc.text('• Kodi ilipwe tarehe 1 ya kila mwezi kupitia M-Pesa au benki.');
    doc.text('• Notisi ya siku 30 inahitajika kwa kukomesha mkataba huu.');
    doc.text('• Mpangaji hataruhusiwa kupanga mtu mwingine bila idhini ya maandishi.');
    doc.text('• Mkataba huu unafuata sheria za Kenya.');
    doc.moveDown(3);

    // Signatures
    doc.font('Helvetica-Bold').text('SIGNATURES');
    doc.moveDown();
    doc.font('Helvetica');
    doc.text('Landlord Signature: ________________________    Date: ____________');
    doc.moveDown();
    doc.text('Tenant Signature:   ________________________    Date: ____________');
    doc.moveDown();
    doc.text('Witness Signature:  ________________________    Date: ____________');

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Persist lease record
  const lease = await prisma.lease.create({
    data: { tenantId, unitId, landlordId, customTerms, pdfUrl: publicUrl },
  });

  logger.info('Lease generated', { leaseId: lease.id, tenantId });
  return { leaseId: lease.id, pdfUrl: publicUrl };
}

module.exports = { generateLease };
