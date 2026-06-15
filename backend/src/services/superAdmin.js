const bcrypt = require('bcryptjs');
const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');

async function ensureSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@kodisha.org';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  const phone = process.env.SUPER_ADMIN_PHONE || '+254700000000';

  const passwordHash = await bcrypt.hash(password, 12);
  const [adminByEmail, adminByPhone] = await Promise.all([
    prisma.landlord.findUnique({ where: { email }, select: { id: true, email: true } }),
    prisma.landlord.findUnique({ where: { phone }, select: { id: true, email: true } }),
  ]);

  const target = adminByEmail || adminByPhone;
  const admin = target
    ? await prisma.landlord.update({
        where: { id: target.id },
        data: {
          name,
          passwordHash,
          plan: 'ENTERPRISE',
          isAdmin: true,
        },
        select: { id: true, email: true },
      })
    : await prisma.landlord.create({
        data: {
          name,
          phone,
          email,
          passwordHash,
          plan: 'ENTERPRISE',
          isAdmin: true,
        },
        select: { id: true, email: true },
      });

  if (adminByEmail && adminByPhone && adminByEmail.id !== adminByPhone.id) {
    logger.warn('Super admin bootstrap found separate landlord records for the requested email and phone; using the email record as canonical.', {
      email,
      phone,
      emailRecordId: adminByEmail.id,
      phoneRecordId: adminByPhone.id,
    });
  }

  await prisma.landlord.updateMany({
    where: { isAdmin: true, id: { not: admin.id } },
    data: { isAdmin: false },
  }).catch(() => {});

  await prisma.systemLog.create({
    data: {
      userId: admin.id,
      userRole: 'ADMIN',
      action: 'SUPER_ADMIN_BOOTSTRAPPED',
      resource: 'landlord',
      details: { email: admin.email },
    },
  }).catch(() => {});

  logger.info('Super admin account bootstrapped', { adminId: admin.id, email: admin.email });
}

module.exports = { ensureSuperAdmin };
