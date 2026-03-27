const prisma = require("../db/prismaClient");
const { calculateScores } = require("../utilities/score");
const { createAnonimousAccount } = require("./authController");
const { generateJWTToken, verifyJWTToken } = require("../utilities/tokenGenerator");

// ── Default principle scores template (used in multiple places) ─────
const DEFAULT_PRINCIPLE_SCORES = {
  "Benefits to Society & Public Engagement": { totalScore: 0, count: 0, avg: 0 },
  "Ethics & Governance": { totalScore: 0, count: 0, avg: 0 },
  "Privacy & Security": { totalScore: 0, count: 0, avg: 0 },
  "Fairness, Gender Equality & Inclusivity": { totalScore: 0, count: 0, avg: 0 },
  "Responsiveness, Transparency & Accountability": { totalScore: 0, count: 0, avg: 0 },
  "Human Agency & Oversight": { totalScore: 0, count: 0, avg: 0 },
  "Open Access": { totalScore: 0, count: 0, avg: 0 },
};

// ── Shared: validate that a string parses to a positive integer ─────
const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// ── Shared: process answers and upsert into the database ────────────
// BUG FIX: This logic was copy-pasted identically in submitAuth and submitAnswers.
// Extracted here to maintain consistency and reduce surface area for bugs.
const processAnswers = async (answers, evaluationId) => {
  for (const userAnswer of answers) {
    const subquestion = await prisma.subQuestion.findFirst({
      where: { id: userAnswer.id },
    });

    if (!subquestion) continue;

    const existingAnswer = await prisma.answer.findFirst({
      where: { subQuestionId: userAnswer.id, evaluationId: evaluationId },
    });

    const score = subquestion.type === "text" ? 10 : userAnswer.score;

    if (existingAnswer) {
      await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: { score: score },
      });
    } else {
      await prisma.answer.create({
        data: {
          score: score,
          subQuestionId: subquestion.id,
          evaluationId: evaluationId,
        },
      });
    }
  }
};

// ── Shared: calculate and persist evaluation scores ─────────────────
const computeAndSaveScores = async (evaluationId, projectId) => {
  const evaluationAnswers = await prisma.answer.findMany({
    where: { evaluationId: evaluationId },
    include: { subQuestion: true },
  });

  const projectScores = await calculateScores(evaluationAnswers);

  let layerScoresArray = Object.values(projectScores?.layerScores || {}).map(
      (entry) => entry.totalScore * 100
  );
  layerScoresArray.push(projectScores?.overallScore || 0);

  const updatedEvaluation = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      projectId: projectId,
      score: layerScoresArray,
      principleScores: projectScores?.principleScores || {},
      questionScores: projectScores?.questionScores || {},
      completedLayers: 1,
    },
  });

  return updatedEvaluation;
};

// ── POST /api/submit-auth ───────────────────────────────────────────
const submitAuth = async (req, res) => {
  if (!req.user) {
    const createdUser = await createAnonimousAccount();
    req.user = createdUser.user;
  }

  try {
    const { projectName, projectAnswers } = req.body;
    if (!projectName || !projectAnswers?.answers?.length) {
      return res.status(400).json({ message: "projectName and projectAnswers.answers are required." });
    }

    let project = await prisma.project.findFirst({
      where: { name: projectName },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: projectName,
          userId: req.user.id,
        },
      });
    } else {
      project = await prisma.project.update({
        where: { id: project.id },
        data: { owner: { connect: { id: req.user.id } } },
      });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        projectId: project.id,
        score: [0, 0, 0, 0],
        principleScores: { ...DEFAULT_PRINCIPLE_SCORES },
        questionScores: {},
        description: projectAnswers.answers[0]?.score || "",
      },
    });

    await processAnswers(projectAnswers.answers, evaluation.id);
    const updatedEvaluation = await computeAndSaveScores(evaluation.id, project.id);

    return res.status(200).json({
      message: "Submitted successfully",
      evaluation: updatedEvaluation,
      user: req.user,
    });
  } catch (e) {
    console.error("submitAuth error:", e);
    // BUG FIX: Never leak error details/stack traces to the client
    return res.status(500).json({ message: "Submission failed." });
  }
};

// ── GET /api/layer ──────────────────────────────────────────────────
const getLayers = async (req, res) => {
  try {
    const layers = await prisma.layer.findMany({});
    return res.status(200).json({ layers: layers });
  } catch (e) {
    console.error("getLayers error:", e);
    return res.status(500).json({ message: "Failed to retrieve layers." });
  }
};

// ── GET /api/principles ─────────────────────────────────────────────
const getPrinciples = async (req, res) => {
  try {
    const principles = await prisma.principle.findMany({
      include: { layer: true },
    });
    return res.status(200).json({ principles: principles });
  } catch (e) {
    console.error("getPrinciples error:", e);
    return res.status(500).json({ message: "Failed to retrieve principles." });
  }
};

// ── GET /api/report/:pid ────────────────────────────────────────────
const generateReport = async (req, res) => {
  try {
    const user = req.user;
    const pid = parsePositiveInt(req.params.pid);
    if (!pid) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: pid,
        project: { userId: user.id },
      },
      include: {
        answers: { include: { subQuestion: true } },
      },
    });

    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found." });
    }

    return res.status(200).json({
      project: {
        description: evaluation.description,
        score: evaluation.score,
        principleScores: evaluation.principleScores,
        questionScores: evaluation.questionScores,
        answers: evaluation.answers,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (e) {
    console.error("generateReport error:", e);
    return res.status(500).json({ message: "Failed to generate report." });
  }
};

// ── GET /api/questions ──────────────────────────────────────────────
const getQuestions = async (req, res) => {
  try {
    const { id } = req.query;
    let questions;

    if (id) {
      const layerId = parsePositiveInt(id);
      if (!layerId) {
        return res.status(400).json({ message: "Invalid layer ID." });
      }
      questions = await prisma.question.findMany({
        where: { principle: { layerId: layerId } },
        include: { subQuestions: true },
        orderBy: [{ number: "asc" }],
      });
    } else {
      questions = await prisma.question.findMany({
        include: { subQuestions: true },
      });
    }
    return res.status(200).json({ questions: questions });
  } catch (e) {
    console.error("getQuestions error:", e);
    return res.status(500).json({ message: "Failed to retrieve questions." });
  }
};

// ── POST /api/create-project ────────────────────────────────────────
const createProject = async (req, res) => {
  try {
    const { projectName } = req.body;
    if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
      return res.status(400).json({ message: "projectName is required." });
    }

    const token = req.headers["authorization"];
    let user;

    if (!token) {
      const userAccount = await createAnonimousAccount();
      user = userAccount.user;
    } else {
      // verifyJWTToken now strips Bearer prefix internally
      user = await verifyJWTToken(token);
    }

    if (!user || !user.id) {
      return res.status(401).json({ message: "Failed to resolve a valid user." });
    }

    let project = await prisma.project.findFirst({
      where: { name: projectName.trim(), userId: user.id },
      include: { evaluations: true },
    });

    if (!project) {
      project = await prisma.project.create({
        data: { name: projectName.trim(), userId: user.id },
      });
    }

    let evaluation = await prisma.evaluation.findFirst({
      where: { projectId: project.id, completedLayers: 0 },
    });

    if (!evaluation) {
      evaluation = await prisma.evaluation.create({
        data: {
          projectId: project.id,
          score: [0, 0, 0, 0],
          principleScores: { ...DEFAULT_PRINCIPLE_SCORES },
          questionScores: {},
        },
      });
    }

    return res.status(200).json({
      message: `Let's proceed with ${projectName.trim()}.`,
      data: project,
    });
  } catch (e) {
    console.error("createProject error:", e);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ── GET /api/projects ───────────────────────────────────────────────
/**
 * PERF FIX: Previously recalculated scores for ALL projects on every request,
 * fetched all projects, then re-fetched them again. Now just reads the stored
 * scores (which are calculated and saved at submit time by computeAndSaveScores).
 */
const getProjects = async (req, res) => {
  try {
    const user = req.user;
    const { simple } = req.query;

    let projects;
    if (simple === "true") {
      projects = await prisma.project.findMany({
        where: { userId: user.id },
        select: { id: true, name: true },
      });
    } else {
      projects = await prisma.project.findMany({
        where: { userId: user.id },
        include: {
          evaluations: {
            orderBy: { startTime: "desc" },
          },
        },
      });
    }

    return res.status(200).json({ data: projects });
  } catch (e) {
    console.error("getProjects error:", e);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ── GET /api/projects/:pid ──────────────────────────────────────────
const getProject = async (req, res) => {
  try {
    const pid = parsePositiveInt(req.params.pid);
    if (!pid) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    const project = await prisma.project.findFirst({
      where: { id: pid },
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: { projectId: pid },
    });

    // BUG FIX: Previously would crash with "Cannot read properties of null"
    // if no evaluation existed for the project
    return res.status(200).json({
      project: {
        name: project.name,
        evaluations: evaluation
            ? [{
              id: evaluation.id,
              projectId: evaluation.projectId,
              description: evaluation.description,
              score: evaluation.score,
              startTime: evaluation.startTime,
              lastUpdateTime: evaluation.lastUpdateTime,
              completedLayers: evaluation.completedLayers,
            }]
            : [],
      },
    });
  } catch (e) {
    console.error("getProject error:", e);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// ── POST /api/submit-answers ────────────────────────────────────────
const submitAnswers = async (req, res) => {
  try {
    const { answers, projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required." });
    }
    if (!Array.isArray(answers) || answers.length < 1) {
      return res.status(400).json({ message: "At least one answer is required." });
    }

    const parsedProjectId = parsePositiveInt(projectId);
    if (!parsedProjectId) {
      return res.status(400).json({ message: "Invalid projectId." });
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: { projectId: parsedProjectId, completedLayers: 0 },
    });
    if (!evaluation) {
      return res.status(404).json({ message: "Project evaluation not found." });
    }

    await processAnswers(answers, evaluation.id);
    const updatedEvaluation = await computeAndSaveScores(evaluation.id, parsedProjectId);

    return res.status(200).json({
      message: "Submitted successfully",
      evaluation: updatedEvaluation,
    });
  } catch (e) {
    console.error("submitAnswers error:", e);
    // BUG FIX: Previously leaked e.message and e.stack to the client
    return res.status(500).json({ message: "Submission failed." });
  }
};

// ── GET /api/evaluation ─────────────────────────────────────────────
/**
 * BUG FIX: Previously queried `where: { userId: user.id }` on the Evaluation model,
 * but Evaluation has no `userId` field — it relates to User through Project.
 * Fixed to join through the Project table.
 */
const getEvaluations = async (req, res) => {
  try {
    const { projectId } = req.query;
    const user = req.user;
    let evaluations;

    if (projectId) {
      const pid = parsePositiveInt(projectId);
      if (!pid) {
        return res.status(400).json({ message: "Invalid projectId." });
      }
      evaluations = await prisma.evaluation.findMany({
        where: {
          projectId: pid,
          project: { userId: user.id },
        },
      });
    } else {
      evaluations = await prisma.evaluation.findMany({
        where: {
          project: { userId: user.id },
        },
      });
    }

    return res.status(200).json({ evaluations: evaluations });
  } catch (e) {
    console.error("getEvaluations error:", e);
    return res.status(500).json({ message: "Failed to retrieve evaluations." });
  }
};

module.exports = {
  getLayers,
  getPrinciples,
  generateReport,
  getQuestions,
  createProject,
  getProjects,
  submitAnswers,
  getEvaluations,
  submitAuth,
  getProject,
};
