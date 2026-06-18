const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kodisha database...');
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@kodisha.org';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
  const superAdminPhone = process.env.SUPER_ADMIN_PHONE || '+254700000000';
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  // ─── Super Admin ──────────────────────────────────────────────────────────
  const admin = await prisma.landlord.upsert({
    where: { email: superAdminEmail },
    update: { isAdmin: true, plan: 'ENTERPRISE' },
    create: {
      name: superAdminName,
      phone: superAdminPhone,
      email: superAdminEmail,
      passwordHash: await bcrypt.hash(superAdminPassword, 12),
      plan: 'ENTERPRISE',
      isAdmin: true,
    },
  });
  console.log('✅ Super Admin:', admin.name);

  const landlord = await prisma.landlord.upsert({
    where: { email: 'john.kamau@gmail.com' },
    update: {},
    create: {
      name: 'John Kamau',
      phone: '+254712000001',
      email: 'john.kamau@gmail.com',
      passwordHash: await bcrypt.hash('password123', 12),
      plan: 'PRO',
      language: 'en',
      currencyPref: 'KES',
      monthlyAirtimeCap: 5000,
    },
  });
  console.log('✅ Landlord:', landlord.name);

  // ─── Caretaker ────────────────────────────────────────────────────────────
  const caretaker = await prisma.caretaker.upsert({
    where: { phone: '+254712000002' },
    update: {},
    create: {
      landlordId: landlord.id,
      name: 'Peter Otieno',
      phone: '+254712000002',
      passwordHash: await bcrypt.hash('caretaker123', 12),
      permissions: ['LOG_PAYMENTS', 'MANAGE_TICKETS', 'VIEW_UNITS', 'METER_READINGS', 'MANAGE_TENANTS'],
    },
  });
  console.log('✅ Caretaker:', caretaker.name);

  // ─── Property ─────────────────────────────────────────────────────────────
  const property = await prisma.property.upsert({
    where: { id: 'prop-westlands-001' },
    update: {},
    create: {
      id: 'prop-westlands-001',
      landlordId: landlord.id,
      name: 'Westlands Heights',
      address: 'Westlands Road, Off Waiyaki Way',
      county: 'Nairobi',
      type: 'APARTMENT',
      waterRatePerUnit: 50,
    },
  });
  console.log('✅ Property:', property.name);

  // ─── Units ────────────────────────────────────────────────────────────────
  const units = await Promise.all([
    prisma.unit.upsert({
      where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: 'A1' } },
      update: {},
      create: { id: 'unit-a1', propertyId: property.id, unitNumber: 'A1', rentAmount: 12000, status: 'OCCUPIED', floor: 1, bedrooms: 1 },
    }),
    prisma.unit.upsert({
      where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: 'A2' } },
      update: {},
      create: { id: 'unit-a2', propertyId: property.id, unitNumber: 'A2', rentAmount: 15000, status: 'OCCUPIED', floor: 1, bedrooms: 2 },
    }),
    prisma.unit.upsert({
      where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: 'B1' } },
      update: {},
      create: { id: 'unit-b1', propertyId: property.id, unitNumber: 'B1', rentAmount: 18000, status: 'OCCUPIED', floor: 2, bedrooms: 2 },
    }),
    prisma.unit.upsert({
      where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: 'B2' } },
      update: {},
      create: { id: 'unit-b2', propertyId: property.id, unitNumber: 'B2', rentAmount: 12000, status: 'VACANT', floor: 2, bedrooms: 1 },
    }),
    prisma.unit.upsert({
      where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: 'C1' } },
      update: {},
      create: { id: 'unit-c1', propertyId: property.id, unitNumber: 'C1', rentAmount: 20000, status: 'OCCUPIED', floor: 3, bedrooms: 3 },
    }),
  ]);
  console.log('✅ Units:', units.map((u) => u.unitNumber).join(', '));

  // ─── DEMO 1: Amina — 3 consecutive on-time payments ──────────────────────
  const amina = await prisma.tenant.upsert({
    where: { phone: '+254712000010' },
    update: {},
    create: {
      id: 'tenant-amina',
      unitId: 'unit-a1',
      name: 'Amina Hassan',
      phone: '+254712000010',
      email: 'amina.hassan@email.com',
      idNumber: '12345678',
      leaseStart: new Date('2024-01-01'),
      depositAmount: 24000,
      passwordHash: await bcrypt.hash('tenant123', 12),
      language: 'en',
    },
  });
  console.log('✅ Tenant (Demo 1):', amina.name);

  const now = new Date();
  for (let i = 2; i >= 0; i--) {
    const month = now.getMonth() + 1 - i;
    const year = month <= 0 ? now.getFullYear() - 1 : now.getFullYear();
    const adjustedMonth = ((month - 1 + 12) % 12) + 1;
    await prisma.payment.upsert({
      where: { mpesaTransactionId: `TEST-AMINA-${adjustedMonth}-${year}` },
      update: {},
      create: {
        tenantId: amina.id, unitId: 'unit-a1', amount: 12000,
        mpesaTransactionId: `TEST-AMINA-${adjustedMonth}-${year}`,
        channel: 'MPESA', paymentDate: new Date(year, adjustedMonth - 1, 1),
        periodMonth: adjustedMonth, periodYear: year, isPartial: false, daysLate: 0,
      },
    });
  }

  await prisma.trustScore.upsert({ where: { tenantId: amina.id }, update: { score: 640 }, create: { tenantId: amina.id, score: 640 } });
  await prisma.creditPassport.upsert({ where: { tenantId: amina.id }, update: { totalMonths: 3, onTimeMonths: 3 }, create: { tenantId: amina.id, totalMonths: 3, onTimeMonths: 3, lateMonths: 0, averageDaysLate: 0 } });

  await prisma.airtimeReward.create({
    data: { tenantId: amina.id, amount: 30, reason: '3 consecutive on-time payments', phone: amina.phone, status: 'SENT' },
  }).catch(() => {});
  console.log('✅ Amina: 3 on-time payments + KSh 30 airtime reward seeded');

  // ─── DEMO 2: John — IVR plumbing ticket ──────────────────────────────────
  const john = await prisma.tenant.upsert({
    where: { phone: '+254712000011' },
    update: {},
    create: {
      id: 'tenant-john', unitId: 'unit-a2', name: 'John Mwangi',
      phone: '+254712000011', email: 'john.mwangi@email.com', idNumber: '23456789',
      leaseStart: new Date('2024-03-01'), depositAmount: 30000,
      passwordHash: await bcrypt.hash('tenant123', 12),
    },
  });

  await prisma.maintenanceTicket.upsert({
    where: { id: 'ticket-pipe-burst-001' },
    update: {},
    create: {
      id: 'ticket-pipe-burst-001', unitId: 'unit-a2', tenantId: john.id,
      category: 'PLUMBING', description: 'Pipe burst in bathroom — reported via IVR.',
      voiceRecordingUrl: 'https://demo.Kodisha.ke/recordings/ticket-pipe-burst-001.mp3',
      status: 'CLOSED', assignedTo: 'Peter Otieno', rating: 4,
      ratingComment: 'Fixed quickly, thank you!', closedAt: new Date(),
    },
  });

  await prisma.payment.upsert({
    where: { mpesaTransactionId: 'TEST-JOHN-MONTH1' },
    update: {},
    create: {
      tenantId: john.id, unitId: 'unit-a2', amount: 15000,
      mpesaTransactionId: 'TEST-JOHN-MONTH1', channel: 'MPESA',
      paymentDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      periodMonth: now.getMonth() - 1 || 12,
      periodYear: now.getMonth() - 1 < 1 ? now.getFullYear() - 1 : now.getFullYear(),
      isPartial: false, daysLate: 8,
    },
  });

  await prisma.trustScore.upsert({ where: { tenantId: john.id }, update: { score: 440 }, create: { tenantId: john.id, score: 440 } });
  await prisma.creditPassport.upsert({ where: { tenantId: john.id }, update: { totalMonths: 1, onTimeMonths: 0, lateMonths: 1 }, create: { tenantId: john.id, totalMonths: 1, onTimeMonths: 0, lateMonths: 1, averageDaysLate: 8 } });
  console.log('✅ John: plumbing ticket + late payment seeded');

  // ─── Grace — 6 months on-time ────────────────────────────────────────────
  const grace = await prisma.tenant.upsert({
    where: { phone: '+254712000012' },
    update: {},
    create: {
      unitId: 'unit-b1', name: 'Grace Wanjiru', phone: '+254712000012',
      email: 'grace.wanjiru@email.com', idNumber: '34567890',
      leaseStart: new Date('2023-06-01'), depositAmount: 36000,
      passwordHash: await bcrypt.hash('tenant123', 12),
    },
  });

  for (let i = 5; i >= 0; i--) {
    const month = ((now.getMonth() - i - 1 + 12) % 12) + 1;
    const year = now.getMonth() - i <= 0 ? now.getFullYear() - 1 : now.getFullYear();
    const txId = `TEST-GRACE-${month}-${year}`;
    const existing = await prisma.payment.findUnique({ where: { mpesaTransactionId: txId } });
    if (!existing) {
      await prisma.payment.create({
        data: {
          tenantId: grace.id, unitId: 'unit-b1', amount: 18000,
          mpesaTransactionId: txId, channel: 'MPESA',
          paymentDate: new Date(year, month - 1, 1),
          periodMonth: month, periodYear: year, isPartial: false, daysLate: 0,
        },
      });
    }
  }

  await prisma.trustScore.upsert({ where: { tenantId: grace.id }, update: { score: 780 }, create: { tenantId: grace.id, score: 780 } });
  await prisma.creditPassport.upsert({ where: { tenantId: grace.id }, update: { totalMonths: 6, onTimeMonths: 6 }, create: { tenantId: grace.id, totalMonths: 6, onTimeMonths: 6, lateMonths: 0, averageDaysLate: 0 } });

  // ─── Samuel — partial payment (arrears) ──────────────────────────────────
  const samuel = await prisma.tenant.upsert({
    where: { phone: '+254712000013' },
    update: {},
    create: {
      unitId: 'unit-c1', name: 'Samuel Njoroge', phone: '+254712000013',
      email: 'samuel.njoroge@email.com', idNumber: '45678901',
      leaseStart: new Date('2024-01-01'), depositAmount: 40000,
      passwordHash: await bcrypt.hash('tenant123', 12),
    },
  });

  const currentTxId = `TEST-SAMUEL-${now.getMonth() + 1}-${now.getFullYear()}`;
  const samuelExisting = await prisma.payment.findUnique({ where: { mpesaTransactionId: currentTxId } });
  if (!samuelExisting) {
    await prisma.payment.create({
      data: {
        tenantId: samuel.id, unitId: 'unit-c1', amount: 10000,
        mpesaTransactionId: currentTxId, channel: 'MPESA', paymentDate: new Date(),
        periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(),
        isPartial: true, daysLate: now.getDate() - 1,
      },
    });
  }

  await prisma.trustScore.upsert({ where: { tenantId: samuel.id }, update: { score: 470 }, create: { tenantId: samuel.id, score: 470 } });
  await prisma.creditPassport.upsert({ where: { tenantId: samuel.id }, update: { totalMonths: 4, onTimeMonths: 2, lateMonths: 2, partialMonths: 1 }, create: { tenantId: samuel.id, totalMonths: 4, onTimeMonths: 2, lateMonths: 2, partialMonths: 1, averageDaysLate: 7 } });
  console.log('✅ Additional tenants seeded:', grace.name, samuel.name);

  // ─── Bills ────────────────────────────────────────────────────────────────
  const tenants = [amina, john, grace, samuel];
  const unitIds = ['unit-a1', 'unit-a2', 'unit-b1', 'unit-c1'];
  const rents = [12000, 15000, 18000, 20000];
  for (let i = 0; i < tenants.length; i++) {
    await prisma.bill.create({
      data: {
        tenantId: tenants[i].id, unitId: unitIds[i], type: 'RENT',
        amount: rents[i], dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
        periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(),
        description: `Rent for ${now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}`,
        status: i < 2 ? 'PAID' : i === 2 ? 'PAID' : 'PARTIALLY_PAID',
        paidAmount: i < 3 ? rents[i] : 10000,
      },
    }).catch(() => {});
  }
  console.log('✅ Rent bills seeded');

  // ─── Meter Readings + Water Bills ────────────────────────────────────────
  for (let i = 0; i < tenants.length; i++) {
    const prevReading = 100 + i * 50;
    const currReading = prevReading + 15 + Math.floor(Math.random() * 10);
    const consumption = currReading - prevReading;

    await prisma.meterReading.create({
      data: {
        unitId: unitIds[i], previousReading: prevReading, currentReading: currReading,
        consumption, periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(),
        readBy: caretaker.id,
      },
    }).catch(() => {});

    await prisma.bill.create({
      data: {
        tenantId: tenants[i].id, unitId: unitIds[i], type: 'WATER',
        amount: consumption * 50, dueDate: new Date(now.getFullYear(), now.getMonth(), 20),
        periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(),
        description: `Water: ${consumption} units × KSh 50/unit`,
        status: 'PENDING',
      },
    }).catch(() => {});
  }
  console.log('✅ Meter readings + water bills seeded');

  // ─── Notifications ────────────────────────────────────────────────────────
  const notifs = [
    { tenantId: amina.id, type: 'PAYMENT_RECEIVED', title: 'Payment Received', message: 'Payment of KSh 12,000 received. Ref: TEST-AMINA' },
    { tenantId: john.id, type: 'ISSUE_UPDATED', title: 'Issue Resolved', message: 'Your plumbing issue has been resolved.' },
    { tenantId: grace.id, type: 'WATER_BILL', title: 'Water Bill Generated', message: 'Your water bill has been generated.' },
    { userId: landlord.id, userRole: 'LANDLORD', type: 'RENT_DUE', title: 'Rent Collection Update', message: '3 of 4 tenants have paid this month.' },
    { tenantId: samuel.id, type: 'RENT_DUE', title: 'Rent Reminder', message: 'You have KSh 10,000 outstanding.' },
  ];
  for (const n of notifs) {
    await prisma.notification.create({ data: n }).catch(() => {});
  }
  console.log('✅ Notifications seeded');

  // ─── iTax report ──────────────────────────────────────────────────────────
  const existingReport = await prisma.iTaxReport.findFirst({ where: { landlordId: landlord.id, year: 2025, quarter: 'Q1' } });
  if (!existingReport) {
    await prisma.iTaxReport.create({
      data: { landlordId: landlord.id, year: 2025, quarter: 'Q1', totalIncome: 135000, csvUrl: '/uploads/reports/demo-itax-q1-2025.csv', pdfUrl: '/uploads/reports/demo-itax-q1-2025.pdf' },
    });
  }

  // ─── Broadcast ────────────────────────────────────────────────────────────
  await prisma.broadcastMessage.create({
    data: {
      landlordId: landlord.id, propertyId: property.id,
      message: 'Dear Tenants, rent is due on 1st of every month. Pay via M-Pesa or dial *384*100#. — Kodisha',
      channel: 'SMS', sentAt: new Date(), recipientCount: 4, status: 'SENT',
    },
  }).catch(() => {});

  // ─── System Logs ──────────────────────────────────────────────────────────
  await prisma.systemLog.create({
    data: { userId: admin.id, userRole: 'ADMIN', action: 'SYSTEM_SEED', resource: 'database', details: { message: 'Demo data seeded' } },
  }).catch(() => {});

  console.log('\n🎉 Seeding complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Kodisha LOGIN CREDENTIALS:');
  console.log(`  Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
  console.log('  Landlord : john.kamau@gmail.com / password123');
  console.log('  Caretaker: +254712000002 / caretaker123');
  console.log('  Tenant 1 : +254712000010 / tenant123 (Amina — 3 on-time)');
  console.log('  Tenant 2 : +254712000011 / tenant123 (John — plumbing ticket)');
  console.log('  Tenant 3 : +254712000012 / tenant123 (Grace — excellent score)');
  console.log('  Tenant 4 : +254712000013 / tenant123 (Samuel — arrears)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
