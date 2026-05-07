const bcrypt = require('bcryptjs');
const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');

async function ensureSuperAdmin() {
  const existingAdmin = await prisma.landlord.findFirst({
    where: { isAdmin: true },
    select: { id: true },
  });

  if (existingAdmin) return;

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  const phone = process.env.SUPER_ADMIN_PHONE || '+254700000000';

  if (!email || !password) {
    logger.warn('No admin account exists. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD to bootstrap one.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.landlord.upsert({
    where: { email },
    update: {
      name,
      phone,
      passwordHash,
      plan: 'ENTERPRISE',
      isAdmin: true,
    },
    create: {
      name,
      phone,
      email,
      passwordHash,
      plan: 'ENTERPRISE',
      isAdmin: true,
    },
    select: { id: true, email: true },
  });

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
