const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient — never create new PrismaClient() elsewhere
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['warn', 'error']
    : ['error'],
});

module.exports = prisma;
