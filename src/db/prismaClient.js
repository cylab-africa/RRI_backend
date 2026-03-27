const { PrismaClient } = require('@prisma/client');

// Single shared PrismaClient instance to avoid connection pool exhaustion.
// Each PrismaClient opens its own pool (~5 connections by default on PostgreSQL).
// Previously, 9 separate instantiations across the codebase × 2 pods = ~90 connections,
// hitting PostgreSQL's default max_connections (100).

const prisma = new PrismaClient({
  log: process.env.ENV === 'TEST' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

// Graceful shutdown — release connections when the process exits
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
