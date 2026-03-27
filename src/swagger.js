/**
 * OpenAPI 3.0 specification for the RRI Backend API.
 *
 * Serves as both interactive documentation (via Swagger UI at /api/docs)
 * and a machine-readable contract for frontend teams and API consumers.
 */

const PORT = process.env.PORT || 8082;
const ENV = process.env.ENV || "PROD";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "RRI Backend API",
    description:
      "Responsible Research & Innovation (RRI) evaluation platform API.\n\n" +
      "This API enables users to create projects, answer RRI assessment questions, " +
      "and receive weighted scores across three evaluation layers and seven principles:\n" +
      "- **Layer 1** — Benefits to Society, Ethics & Governance, Privacy & Security\n" +
      "- **Layer 2** — Fairness & Inclusivity, Responsiveness & Accountability\n" +
      "- **Layer 3** — Human Agency & Oversight, Open Access\n\n" +
      "### Authentication\n" +
      "Protected endpoints require a JWT token in the `Authorization` header. " +
      "Tokens are issued on signup or via Google OAuth check-user flow. " +
      "Both `Bearer <token>` and raw token formats are accepted.\n\n" +
      "### Anonymous Access\n" +
      "The `POST /api/submit-auth` endpoint supports anonymous submissions — " +
      "if no valid token is provided, an anonymous account is created automatically.",
    version: "1.0.0",
    contact: {
      name: "CyLab-Africa / Upanzi Network",
      url: "https://github.com/cylab-africa/RRI_backend",
    },
    license: {
      name: "ISC",
    },
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: `Local development (port ${PORT})`,
    },
    ...(ENV !== "TEST"
      ? [{ url: "{productionUrl}", description: "Production", variables: { productionUrl: { default: "https://rri-api.example.com" } } }]
      : []),
  ],
  tags: [
    { name: "Health", description: "Kubernetes health probes (liveness & readiness)" },
    { name: "Auth", description: "User registration and Google OAuth authentication" },
    { name: "Layers & Questions", description: "RRI framework structure — layers, principles, and questions" },
    { name: "Projects", description: "Project management — create, list, and retrieve projects" },
    { name: "Evaluations", description: "Submit answers, calculate scores, and retrieve evaluations" },
    { name: "Reports", description: "Generate detailed evaluation reports" },
  ],

  // ── Security scheme ─────────────────────────────────────────────
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtained from `/api/signup` or `/api/check-user`. Pass as `Authorization: Bearer <token>`.",
      },
    },

    // ── Reusable schemas ──────────────────────────────────────────
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Something went wrong." },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string", example: "email, firstName, lastName, and googleCredential are required" },
        },
      },

      // ── User ──────────────────────────────────────────────────
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          email: { type: "string", format: "email", example: "user@example.com" },
          firstName: { type: "string", example: "Carmel" },
          lastName: { type: "string", example: "L." },
          role: { type: "string", enum: ["ADMIN", "USER", "PROJECT_LEAD"], example: "USER" },
          createdAt: { type: "string", format: "date-time" },
          googleCredential: { type: "string", nullable: true },
        },
      },

      // ── Layer ─────────────────────────────────────────────────
      Layer: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "LAYER 1" },
          order: { type: "integer", example: 1, description: "Hierarchy level (1, 2, or 3)" },
          weight: { type: "number", format: "float", example: 0.346 },
        },
      },

      // ── Principle ─────────────────────────────────────────────
      Principle: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Benefits to Society & Public Engagement" },
          weight: { type: "number", format: "float", example: 0.319 },
          layerId: { type: "integer", example: 1 },
        },
      },

      // ── SubQuestion ───────────────────────────────────────────
      SubQuestion: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          text: { type: "string", example: "Briefly describe the societal problem that your innovation addresses." },
          type: {
            type: "string",
            enum: ["text", "scale", "choice"],
            description: "`text` = open-ended, `scale` = 1-10 rating, `choice` = yes/no agreement",
          },
          questionId: { type: "integer", example: 1 },
        },
      },

      // ── Question ──────────────────────────────────────────────
      Question: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          number: { type: "integer", example: 1, description: "Display order" },
          text: { type: "string", example: "What societal problem does your innovation address?" },
          principleId: { type: "integer", example: 1 },
          subQuestions: {
            type: "array",
            items: { $ref: "#/components/schemas/SubQuestion" },
          },
        },
      },

      // ── PrincipleScore ────────────────────────────────────────
      PrincipleScore: {
        type: "object",
        description: "Score breakdown for a single RRI principle",
        properties: {
          totalScore: { type: "number", example: 7.5 },
          count: { type: "integer", example: 2 },
          avg: { type: "number", example: 3.75 },
        },
      },

      // ── Evaluation ────────────────────────────────────────────
      Evaluation: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          projectId: { type: "integer", example: 1 },
          description: { type: "string", example: "" },
          score: {
            type: "array",
            items: { type: "number" },
            description: "Array of [layer1%, layer2%, layer3%, overall%]",
            example: [65.2, 72.1, 58.4, 64.8],
          },
          principleScores: {
            type: "object",
            description: "Score breakdown per RRI principle",
            additionalProperties: { $ref: "#/components/schemas/PrincipleScore" },
          },
          questionScores: {
            type: "object",
            description: "Score breakdown per question text",
            additionalProperties: { $ref: "#/components/schemas/PrincipleScore" },
          },
          startTime: { type: "string", format: "date-time" },
          lastUpdateTime: { type: "string", format: "date-time" },
          completedLayers: { type: "integer", example: 1, description: "0 = in progress, 1 = completed" },
        },
      },

      // ── Project ───────────────────────────────────────────────
      Project: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "AI Crop Disease Detector" },
          description: { type: "string", example: "" },
          userId: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          evaluations: {
            type: "array",
            items: { $ref: "#/components/schemas/Evaluation" },
          },
        },
      },

      // ── Answer ────────────────────────────────────────────────
      Answer: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          score: { type: "number", example: 8 },
          response: { type: "string", example: "" },
          evaluationId: { type: "integer", example: 1 },
          subQuestionId: { type: "integer", example: 3 },
          subQuestion: { $ref: "#/components/schemas/SubQuestion" },
        },
      },

      // ── Request bodies ────────────────────────────────────────
      SignupRequest: {
        type: "object",
        required: ["email", "firstName", "lastName", "googleCredential"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          firstName: { type: "string", example: "Carmel" },
          lastName: { type: "string", example: "L." },
          googleCredential: { type: "string", description: "Google OAuth credential token" },
        },
      },
      CheckUserRequest: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", description: "Google OAuth ID token to verify" },
        },
      },
      SubmitAuthRequest: {
        type: "object",
        required: ["projectName", "projectAnswers"],
        properties: {
          projectName: { type: "string", example: "AI Crop Disease Detector" },
          projectAnswers: {
            type: "object",
            required: ["answers"],
            properties: {
              answers: {
                type: "array",
                items: {
                  type: "object",
                  required: ["id", "score"],
                  properties: {
                    id: { type: "integer", description: "SubQuestion ID", example: 3 },
                    score: {
                      oneOf: [
                        { type: "number", description: "Numeric score (1-10 for scale, 0/10 for choice)" },
                        { type: "string", description: "Text response for open-ended questions" },
                      ],
                      example: 8,
                    },
                  },
                },
                minItems: 1,
              },
            },
          },
        },
      },
      SubmitAnswersRequest: {
        type: "object",
        required: ["answers", "projectId"],
        properties: {
          projectId: { type: "integer", example: 1 },
          answers: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "score"],
              properties: {
                id: { type: "integer", description: "SubQuestion ID", example: 5 },
                score: { type: "number", description: "Score value (1-10 for scale, 0/10 for choice)", example: 7 },
              },
            },
            minItems: 1,
          },
        },
      },
      CreateProjectRequest: {
        type: "object",
        required: ["projectName"],
        properties: {
          projectName: { type: "string", example: "AI Crop Disease Detector", minLength: 1 },
        },
      },

      // ── Health ────────────────────────────────────────────────
      LivenessResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          uptime: { type: "integer", description: "Uptime in seconds", example: 3600 },
        },
      },
      ReadinessResponse: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ok", "degraded"], example: "ok" },
          uptime: { type: "integer", example: 3600 },
          checks: {
            type: "object",
            properties: {
              database: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["ok", "error"], example: "ok" },
                  responseTime: { type: "integer", description: "DB ping in ms", example: 3 },
                  message: { type: "string", description: "Error message if status is error" },
                },
              },
            },
          },
        },
      },
    },

    // ── Reusable responses ──────────────────────────────────────
    responses: {
      Unauthorized: {
        description: "Missing or invalid JWT token",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { message: "Authorization token required." } } },
      },
      BadRequest: {
        description: "Invalid or missing request parameters",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { message: "Project not found." } } },
      },
      ServerError: {
        description: "Internal server error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { message: "Something went wrong." } } },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ── PATHS ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  paths: {
    // ── Health ──────────────────────────────────────────────────
    "/api/healthz": {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        description: "Lightweight check confirming the Node.js process is alive. Used by Kubernetes `livenessProbe`. No database call.",
        operationId: "liveness",
        responses: {
          200: {
            description: "Process is alive",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LivenessResponse" } } },
          },
        },
      },
    },
    "/api/ready": {
      get: {
        tags: ["Health"],
        summary: "Readiness probe",
        description: "Checks both process health and database connectivity. Used by Kubernetes `readinessProbe`. Returns 503 if the database is unreachable.",
        operationId: "readiness",
        responses: {
          200: {
            description: "Application is ready to serve traffic",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ReadinessResponse" } } },
          },
          503: {
            description: "Database unreachable — pod will be removed from load balancer",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReadinessResponse" },
                example: { status: "degraded", uptime: 3600, checks: { database: { status: "error", message: "FATAL: sorry, too many clients already" } } },
              },
            },
          },
        },
      },
    },

    // ── Auth ────────────────────────────────────────────────────
    "/api/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a new user account",
        description: "Registers a new user with email and Google credential. Returns a JWT access token on success.",
        operationId: "createAccount",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SignupRequest" } } },
        },
        responses: {
          201: {
            description: "Account created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string", description: "JWT token for subsequent requests" },
                    user: { $ref: "#/components/schemas/User" },
                    userRegistered: { type: "boolean", example: true },
                    googleCredential: { type: "string", nullable: true },
                    success: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          400: { description: "Missing fields or user already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/check-user": {
      post: {
        tags: ["Auth"],
        summary: "Verify Google token and check user registration",
        description: "Verifies a Google OAuth ID token. If the user exists, returns a JWT access token and user info. If not, returns `userRegistered: false`.",
        operationId: "checkUser",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CheckUserRequest" } } },
        },
        responses: {
          200: {
            description: "User check result",
            content: {
              "application/json": {
                examples: {
                  registered: {
                    summary: "User exists",
                    value: {
                      accessToken: "eyJhbGciOi...",
                      user: { id: 1, email: "user@example.com", firstName: "Carmel", lastName: "L.", googleCredential: "...", createdAt: "2025-01-15T10:00:00.000Z" },
                      userRegistered: true,
                      googleCredential: "...",
                    },
                  },
                  notRegistered: {
                    summary: "User does not exist",
                    value: { userRegistered: false, googleCredential: null },
                  },
                },
              },
            },
          },
          400: { description: "Token missing", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // ── Layers & Questions ──────────────────────────────────────
    "/api/layer": {
      get: {
        tags: ["Layers & Questions"],
        summary: "Get all evaluation layers",
        description: "Returns the three RRI evaluation layers with their weights. Layers are the top-level grouping: Layer 1 (Social & Ethical), Layer 2 (Fairness & Transparency), Layer 3 (Agency & Access).",
        operationId: "getLayers",
        responses: {
          200: {
            description: "List of layers",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    layers: { type: "array", items: { $ref: "#/components/schemas/Layer" } },
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/questions": {
      get: {
        tags: ["Layers & Questions"],
        summary: "Get assessment questions",
        description: "Returns RRI assessment questions with their sub-questions. Optionally filter by layer ID to get questions for a specific layer only.",
        operationId: "getQuestions",
        parameters: [
          {
            name: "id",
            in: "query",
            required: false,
            description: "Layer ID to filter questions by. Omit to get all questions.",
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "List of questions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    questions: { type: "array", items: { $ref: "#/components/schemas/Question" } },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // ── Projects ────────────────────────────────────────────────
    "/api/projects": {
      get: {
        tags: ["Projects"],
        summary: "List all projects for the authenticated user",
        description: "Returns all projects owned by the current user, with evaluations included by default. Use `?simple=true` to return only project names (faster).",
        operationId: "getProjects",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "simple",
            in: "query",
            required: false,
            description: "If `true`, returns only `{ id, name }` per project (no evaluations).",
            schema: { type: "string", enum: ["true", "false"], default: "false" },
          },
        ],
        responses: {
          200: {
            description: "List of projects",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Project" } },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/projects/{pid}": {
      get: {
        tags: ["Projects"],
        summary: "Get a specific project by ID",
        description: "Returns a single project with its latest evaluation. This is a public endpoint — no authentication required.",
        operationId: "getProject",
        parameters: [
          {
            name: "pid",
            in: "path",
            required: true,
            description: "Project ID",
            schema: { type: "integer", minimum: 1, example: 1 },
          },
        ],
        responses: {
          200: {
            description: "Project details with evaluation",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    project: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "AI Crop Disease Detector" },
                        evaluations: { type: "array", items: { $ref: "#/components/schemas/Evaluation" } },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // ── Evaluations ─────────────────────────────────────────────
    "/api/evaluation": {
      get: {
        tags: ["Evaluations"],
        summary: "List evaluations for the authenticated user",
        description: "Returns all evaluations for the current user's projects. Optionally filter by project ID.",
        operationId: "getEvaluations",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "query",
            required: false,
            description: "Filter evaluations by project ID",
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "List of evaluations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    evaluations: { type: "array", items: { $ref: "#/components/schemas/Evaluation" } },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/submit-auth": {
      post: {
        tags: ["Evaluations"],
        summary: "Submit project answers (with auto-auth)",
        description:
          "Creates or finds a project, creates a new evaluation, processes all answers, and calculates RRI scores. " +
          "If no valid JWT is provided, an anonymous account is created automatically.\n\n" +
          "This is the primary endpoint for submitting a complete RRI assessment.",
        operationId: "submitAuth",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SubmitAuthRequest" } } },
        },
        responses: {
          200: {
            description: "Answers submitted and scores calculated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Submitted successfully" },
                    evaluation: { $ref: "#/components/schemas/Evaluation" },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // ── Reports ─────────────────────────────────────────────────
    "/api/report/{pid}": {
      get: {
        tags: ["Reports"],
        summary: "Generate evaluation report",
        description: "Returns a detailed evaluation report including all scores, principle breakdowns, and individual answers. Only accessible by the project owner.",
        operationId: "generateReport",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "pid",
            in: "path",
            required: true,
            description: "Evaluation ID (not project ID)",
            schema: { type: "integer", minimum: 1, example: 1 },
          },
        ],
        responses: {
          200: {
            description: "Evaluation report",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    project: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        score: { type: "array", items: { type: "number" }, example: [65.2, 72.1, 58.4, 64.8] },
                        principleScores: { type: "object", additionalProperties: { $ref: "#/components/schemas/PrincipleScore" } },
                        questionScores: { type: "object", additionalProperties: { $ref: "#/components/schemas/PrincipleScore" } },
                        answers: { type: "array", items: { $ref: "#/components/schemas/Answer" } },
                        firstName: { type: "string", example: "Carmel" },
                        lastName: { type: "string", example: "L." },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // ── Gateway ─────────────────────────────────────────────────
    "/api/": {
      get: {
        tags: ["Health"],
        summary: "API gateway test",
        description: "Simple test endpoint to verify the API is reachable. Returns an empty users array.",
        operationId: "testGateway",
        responses: {
          200: {
            description: "Gateway is reachable",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: { type: "array", items: { type: "object" }, example: [] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = spec;
