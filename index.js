const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require('dotenv').config();
const prisma = require("./src/db/prismaClient");

const app = express();
const { testGetWay } = require("./src/controllers/testController");
const {
   getLayers,
   getQuestions,
   submitAnswers,
   createProject,
   getEvaluations,
   getProjects,
   generateReport,
   submitAuth,
   getProject,
} = require("./src/controllers/evaluationControllers");
const { initApp } =  require('./src/controllers/initAppController');
const { strictAuthorize, authenticate, authorize } = require("./src/middleware/authorization");
const { createAccount, checkUser } = require("./src/controllers/authController");
const { liveness, readiness } = require("./src/controllers/healthController");
const { metricsMiddleware, metricsHandler } = require("./src/middleware/metrics");
const swaggerUi = require("swagger-ui-express");
let swaggerSpec;
const debugFetch =
   typeof fetch === "function"
      ? fetch
      : typeof global !== "undefined" && typeof global.fetch === "function"
        ? global.fetch
        : null;
try {
   swaggerSpec = require("./src/swagger");
   // #region agent log (swagger require success)
   debugFetch &&
      debugFetch("http://127.0.0.1:7441/ingest/3fc8c49b-2cd2-4921-aefb-4173ccbbb37e", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6fc834",
         },
         body: JSON.stringify({
            sessionId: "6fc834",
            runId: "initial",
            hypothesisId: "H2",
            location: "index.js:24",
            message: "Swagger spec loaded",
            data: {
               swaggerType: swaggerSpec && typeof swaggerSpec,
               hasOpenapi: swaggerSpec && typeof swaggerSpec.openapi === "string",
            },
            timestamp: Date.now(),
         }),
      }).catch(() => {});
   // #endregion
} catch (err) {
   // #region agent log (swagger require failure)
   debugFetch &&
      debugFetch("http://127.0.0.1:7441/ingest/3fc8c49b-2cd2-4921-aefb-4173ccbbb37e", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6fc834",
         },
         body: JSON.stringify({
            sessionId: "6fc834",
            runId: "initial",
            hypothesisId: "H1",
            location: "index.js:26",
            message: "Failed requiring swagger spec",
            data: {
               errorName: err && err.name,
               errorMessage: err && err.message,
            },
            timestamp: Date.now(),
         }),
      }).catch(() => {});
   // #endregion
   throw err;
}

const PORT = process.env.PORT || 8082;
const ORIGIN = process.env.WEBSITE;
const ENV = process.env.ENV;

// ── Middleware ───────────────────────────────────────────────────
app.disable("x-powered-by");

if (ENV === "TEST") {
   app.use(cors({ origin: "*" }));
} else {
   app.use(cors({ origin: ORIGIN }));
}

app.use(express.json());
app.use(cookieParser());

// ── API Documentation (Swagger UI) ──────────────────────────────
try {
   app.use(
      "/api/docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
         customCss: ".swagger-ui .topbar { display: none }",
         customSiteTitle: "RRI Backend API Docs",
      })
   );
} catch (err) {
   // #region agent log (swagger-ui setup failure)
   debugFetch &&
      debugFetch("http://127.0.0.1:7441/ingest/3fc8c49b-2cd2-4921-aefb-4173ccbbb37e", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6fc834",
         },
         body: JSON.stringify({
            sessionId: "6fc834",
            runId: "initial",
            hypothesisId: "H2",
            location: "index.js:48",
            message: "Swagger UI setup threw an error",
            data: {
               errorName: err && err.name,
               errorMessage: err && err.message,
            },
            timestamp: Date.now(),
         }),
      }).catch(() => {});
   // #endregion
   throw err;
}

app.get("/api/docs.json", (req, res) => {
   // #region agent log (docs.json called)
   debugFetch &&
      debugFetch("http://127.0.0.1:7441/ingest/3fc8c49b-2cd2-4921-aefb-4173ccbbb37e", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6fc834",
         },
         body: JSON.stringify({
            sessionId: "6fc834",
            runId: "initial",
            hypothesisId: "H3",
            location: "index.js:59",
            message: "/api/docs.json requested",
            data: {
               swaggerIsNull: !swaggerSpec,
            },
            timestamp: Date.now(),
         }),
      }).catch(() => {});
   // #endregion
   return res.json(swaggerSpec);
});

// ── Prometheus metrics (must be before routes to capture all) ────
app.use(metricsMiddleware);

// ── Health probes (no auth, no CORS — used by K8s) ──────────────
app.get("/api/healthz", liveness);
app.get("/api/ready", readiness);

// ---  Init App ---------------------------------------------------
app.post("/api/init-app", initApp);

// ── Public routes ───────────────────────────────────────────────
app.get("/api/", testGetWay);
app.get("/api/layer", getLayers);
app.get("/api/questions", getQuestions);
app.get("/api/projects/:pid", getProject);

// ── Auth routes ─────────────────────────────────────────────────
app.post("/api/signup", createAccount);
app.post("/api/check-user", checkUser);

// ── Protected routes ────────────────────────────────────────────
app.get("/api/evaluation", strictAuthorize, getEvaluations);
app.get("/api/projects", strictAuthorize, getProjects);
app.get("/api/report/:pid", strictAuthorize, generateReport);
app.post("/api/submit-auth", authorize, submitAuth);

// ── Global error handler ────────────────────────────────────────
// Catches unhandled errors thrown by async route handlers.
// Without this, Express returns the raw error to the client.
app.use((err, req, res, _next) => {
   console.error("Unhandled error:", err);
   res.status(500).json({ message: "Internal server error." });
});

// ── Start server ────────────────────────────────────────────────
const server = app.listen(PORT, () => {
   console.log(`RRI backend listening at http://localhost:${PORT}`);
   console.log(`API docs available at http://localhost:${PORT}/api/docs`);
});

// ── Graceful shutdown ───────────────────────────────────────────
// When K8s sends SIGTERM (during rolling deploys), finish in-flight
// requests, close the DB pool, then exit cleanly.
const shutdown = async (signal) => {
   console.log(`${signal} received — shutting down gracefully...`);
   server.close(async () => {
      await prisma.$disconnect();
      console.log("DB pool closed. Exiting.");
      process.exit(0);
   });

   // Force-kill if graceful shutdown takes too long (10s)
   setTimeout(() => {
      console.error("Graceful shutdown timed out — forcing exit.");
      process.exit(1);
   }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
