/**
 * Prometheus Metrics Middleware for RRI Backend
 *
 * Exposes HTTP request metrics at GET /api/metrics in Prometheus
 * exposition format. Scraped by the ServiceMonitor defined in the
 * Helm chart.
 *
 * Metrics exported:
 *  - http_request_duration_seconds (histogram) — latency by route/method/status
 *  - http_requests_total (counter)             — total requests
 *  - http_requests_in_flight (gauge)           — concurrent requests
 *  - prisma_client_queries_active (gauge)      — active DB queries (manual)
 */

const client = require("prom-client");

// ── Default metrics (CPU, memory, event loop, GC) ───────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "nodejs_" });

// ── Custom metrics ──────────────────────────────────────────────

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestsInFlight = new client.Gauge({
  name: "http_requests_in_flight",
  help: "Number of HTTP requests currently being processed",
  registers: [register],
});

const dbQueryDuration = new client.Histogram({
  name: "prisma_query_duration_seconds",
  help: "Duration of Prisma database queries",
  labelNames: ["model", "operation"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// ── Middleware: record per-request metrics ───────────────────────

/**
 * Normalizes Express route paths to avoid high-cardinality labels.
 * /api/projects/123 → /api/projects/:pid
 */
function getRoutePath(req) {
  // Express populates req.route after matching
  if (req.route && req.route.path) {
    return req.baseUrl + req.route.path;
  }
  // Fallback: collapse numeric IDs
  return req.path.replace(/\/\d+/g, "/:id");
}

function metricsMiddleware(req, res, next) {
  // Skip instrumenting the metrics endpoint itself
  if (req.path === "/api/metrics") {
    return next();
  }

  httpRequestsInFlight.inc();
  const end = httpRequestDuration.startTimer();

  // Hook into response finish
  res.on("finish", () => {
    const route = getRoutePath(req);
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    end(labels);
    httpRequestsTotal.inc(labels);
    httpRequestsInFlight.dec();
  });

  next();
}

// ── Metrics endpoint handler ────────────────────────────────────

async function metricsHandler(req, res) {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error("Error generating metrics:", err);
    res.status(500).end();
  }
}

module.exports = {
  metricsMiddleware,
  metricsHandler,
  register,
  dbQueryDuration,
};
