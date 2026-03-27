/**
 * OpenTelemetry Instrumentation for RRI Backend
 *
 * This file MUST be loaded before any other module via:
 *   NODE_OPTIONS="--require ./src/instrumentation.js"
 *
 * It sets up:
 *  - Trace export to Jaeger via OTLP (HTTP)
 *  - Auto-instrumentation for Express, HTTP, Prisma
 *  - Trace-ID propagation (W3C TraceContext)
 */

const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const {
  OTLPMetricExporter,
} = require("@opentelemetry/exporter-metrics-otlp-http");
const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");
const { Resource } = require("@opentelemetry/resources");
const {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} = require("@opentelemetry/semantic-conventions");
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");

// ── Debug logging (only in non-production) ──────────────────────
if (process.env.OTEL_LOG_LEVEL === "debug") {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// ── OTLP endpoint — defaults to Jaeger collector ────────────────
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

// ── Resource: identifies this service in traces ─────────────────
const resource = new Resource({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "rri-backend",
  [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "1.0.0",
  [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.ENV || "development",
});

// ── Trace exporter → Jaeger via OTLP/HTTP ───────────────────────
const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
});

// ── Metric exporter → Prometheus via OTLP (optional) ────────────
const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 15000,
});

// ── SDK setup ───────────────────────────────────────────────────
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // ── Express: capture route, method, status ────────────────
      "@opentelemetry/instrumentation-express": {
        enabled: true,
      },
      // ── HTTP: capture outgoing calls to DB, external APIs ─────
      "@opentelemetry/instrumentation-http": {
        enabled: true,
        ignoreIncomingRequestHook: (req) => {
          // Don't trace health checks — they're noisy
          const url = req.url || "";
          return url === "/api/healthz" || url === "/api/ready" || url === "/api/metrics";
        },
      },
      // ── Prisma: capture DB queries as spans ───────────────────
      "@prisma/instrumentation": {
        enabled: true,
      },
      // ── Disable noisy instrumentations ────────────────────────
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
      "@opentelemetry/instrumentation-net": { enabled: false },
    }),
  ],
});

// ── Start the SDK ───────────────────────────────────────────────
sdk.start();
console.log(
  `OpenTelemetry initialized — exporting to ${otlpEndpoint}`
);

// ── Graceful shutdown: flush remaining spans ────────────────────
process.on("SIGTERM", async () => {
  try {
    await sdk.shutdown();
    console.log("OpenTelemetry SDK shut down.");
  } catch (err) {
    console.error("Error shutting down OpenTelemetry:", err);
  }
});
