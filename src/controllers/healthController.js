const prisma = require('../db/prismaClient');

const startTime = Date.now();

/**
 * Liveness probe — GET /api/healthz
 * Confirms the Node.js process is alive and can serve HTTP.
 * K8s uses this to decide whether to restart the pod.
 * Intentionally lightweight: no DB call, no external dependency.
 */
const liveness = (req, res) => {
  return res.status(200).json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
};

/**
 * Readiness probe — GET /api/ready
 * Confirms the app can actually serve traffic (DB reachable, pool healthy).
 * K8s uses this to decide whether to route traffic to the pod.
 * If this fails, the pod is removed from the Service endpoints
 * but NOT restarted (unlike liveness).
 */
const readiness = async (req, res) => {
  const health = {
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {},
  };

  // DB connectivity check — lightweight raw query
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'ok',
      responseTime: Date.now() - dbStart,
    };
  } catch (err) {
    health.status = 'degraded';
    health.checks.database = {
      status: 'error',
      message: err.message,
    };
    return res.status(503).json(health);
  }

  return res.status(200).json(health);
};

module.exports = { liveness, readiness };
