#!/bin/sh
set -e

echo "╔══════════════════════════════════════════════╗"
echo "║     RRI Backend — Container Startup          ║"
echo "╚══════════════════════════════════════════════╝"

# ── Step 1: Run Prisma migrations ────────────────────────────────
# Applies any pending migrations to bring the DB schema up to date.
# Safe to run multiple times — Prisma tracks which migrations have
# already been applied.
if [ "${RUN_MIGRATIONS}" = "true" ]; then
  echo ""
  echo "▶ Running Prisma migrations..."
  npx prisma migrate deploy --schema=./src/db/configs/prisma/schema.prisma
  echo "✓ Migrations applied."
else
  echo ""
  echo "⏭ Skipping migrations (RUN_MIGRATIONS != true)"
fi

# ── Step 2: Seed the database with layers, principles, questions ─
# Only runs when SEED_DB=true. The addQuestions.js script deletes
# existing seed data and re-inserts it (idempotent).
if [ "${SEED_DB}" = "true" ]; then
  echo ""
  echo "▶ Seeding database with RRI questions..."
  node src/utilities/addQuestions.js
  echo "✓ Database seeded."
else
  echo ""
  echo "⏭ Skipping DB seed (SEED_DB != true)"
fi

# ── Step 3: Start the application ────────────────────────────────
echo ""
echo "▶ Starting RRI backend..."
echo ""
exec node index.js
