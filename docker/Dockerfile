# ═══════════════════════════════════════════════════════════════════
# Stage 1: BUILD — install deps, generate Prisma client, prune
# ═══════════════════════════════════════════════════════════════════
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# ── Layer cache: dependency manifests first ──────────────────────
COPY package.json package-lock.json* ./

# ── Copy Prisma schema + migrations (needed for generate & deploy)
COPY src/db/configs/prisma/ ./src/db/configs/prisma/

# ── Install ALL deps (including prisma CLI for generate) ─────────
# Use `npm ci` for reproducible builds when a lockfile is present.
# Fall back to `npm install` if no lockfile exists (generates one).
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      echo "⚠ No package-lock.json found — using npm install"; \
      npm install; \
    fi

# ── Generate Prisma client ───────────────────────────────────────
RUN npx prisma generate --schema=./src/db/configs/prisma/schema.prisma

# ── Prune to production deps only ───────────────────────────────
# Then re-add just the prisma CLI (needed at runtime for migrations).
# This avoids shipping jest, nodemon, and supertest (~40MB saved).
RUN npm prune --production && npm install prisma


# ═══════════════════════════════════════════════════════════════════
# Stage 2: PRODUCTION — minimal runtime image
# ═══════════════════════════════════════════════════════════════════
FROM node:22-alpine AS production

# OpenSSL for Prisma engine, dumb-init for signal forwarding
RUN apk add --no-cache openssl dumb-init

# ── Non-root user ────────────────────────────────────────────────
USER node
WORKDIR /usr/src/app

# ── Copy node_modules from builder (prod deps + prisma CLI) ─────
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules

# ── Copy application source ─────────────────────────────────────
COPY --chown=node:node package.json ./
COPY --chown=node:node index.js ./
#COPY --chown=node:node docker-entrypoint.sh ./
#COPY --chown=node:node docker/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --chown=node:node src/ ./src/
COPY --chown=node:node auth/ ./auth/

# FIX: Only one COPY for the entrypoint, and chmod it
COPY --chown=node:node docker/docker-entrypoint.sh ./docker-entrypoint.sh

# Switch to root just to make it executable, then back to node
USER root
RUN chmod +x ./docker-entrypoint.sh
USER node

# ── Metadata ─────────────────────────────────────────────────────
EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:8081/api/healthz || exit 1

# ── Entrypoint: migrations → seed → start ───────────────────────
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "./docker-entrypoint.sh"]
