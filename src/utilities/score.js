const prisma = require("../db/prismaClient");

/**
 * PERFORMANCE FIX: The original score.js made individual DB queries inside every loop
 * iteration (N+1 query problem). For example, calculateAverageScorePerPrinciple queried
 * prisma.question.findFirst for EACH question text, and calculateLayerScores queried
 * prisma.principle.findFirst + getPrincipleWeightFromDB for EACH principle.
 *
 * This refactor batch-loads all reference data (questions, principles, layers) in a
 * single call at the top of calculateScores, then passes it through.
 */

/**
 * Load all reference data in one shot — questions with their principles, principles
 * with their layers. Called once per score calculation, not once per loop iteration.
 */
const loadReferenceData = async () => {
  const [questions, principles] = await Promise.all([
    prisma.question.findMany({
      include: {
        subQuestions: true,
        principle: { include: { layer: true } },
      },
    }),
    prisma.principle.findMany({
      include: { layer: true },
    }),
  ]);

  // Build lookup maps for O(1) access
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const principleByName = new Map(principles.map((p) => [p.name, p]));

  return { questions, questionById, principleByName };
};

/**
 * Step 1: Calculate average score per question.
 * Groups subquestion answer scores by their parent question.
 */
const calculateAverageScorePerQuestion = (subquestionScores, { questionById }) => {
  const questionScores = {};

  for (const scoreEntry of subquestionScores) {
    const qId = scoreEntry.subQuestion.questionId;
    const question = questionById.get(qId);

    if (!question) continue;

    if (!questionScores[question.text]) {
      questionScores[question.text] = { totalScore: 0, count: 0 };
    }

    if (typeof scoreEntry.score === "number") {
      questionScores[question.text].totalScore += scoreEntry.score;
      questionScores[question.text].count += 1;
    }
  }

  // Compute averages
  for (const key in questionScores) {
    const entry = questionScores[key];
    entry.avg = entry.count > 0 ? entry.totalScore / entry.count : 0;
  }

  return questionScores;
};

/**
 * Step 2: Calculate average score per principle.
 * Groups question averages by their parent principle.
 *
 * PERF FIX: Previously did prisma.question.findFirst({ where: { text } })
 * inside the loop — now uses the pre-loaded questions array.
 */
const calculateAverageScorePerPrinciple = (questionScores, { questions }) => {
  // Build a text→question lookup from the pre-loaded data
  const questionByText = new Map(questions.map((q) => [q.text, q]));

  const principleScores = {};

  for (const [questionText, scoreEntry] of Object.entries(questionScores)) {
    const question = questionByText.get(questionText);
    if (!question || !question.principle) continue;

    const principleName = question.principle.name;

    if (!principleScores[principleName]) {
      principleScores[principleName] = { totalScore: 0, count: 0 };
    }

    if (typeof scoreEntry.avg === "number") {
      principleScores[principleName].totalScore += scoreEntry.avg;
      principleScores[principleName].count += 1;
    }
  }

  for (const key in principleScores) {
    const entry = principleScores[key];
    entry.avg = entry.count > 0 ? entry.totalScore / entry.count : 0;
  }

  return principleScores;
};

/**
 * Step 3: Calculate layer scores from weighted principle scores.
 *
 * PERF FIX: Previously did two DB queries per principle (findFirst + getPrincipleWeightFromDB).
 * Now uses the pre-loaded principleByName map.
 */
const calculateLayerScores = (principleScores, { principleByName }) => {
  const layerScore = {};

  for (const [principleName, scoreEntry] of Object.entries(principleScores)) {
    const principle = principleByName.get(principleName);
    if (!principle || !principle.layer) continue;

    const layerOrder = principle.layer.order;

    if (!layerScore[layerOrder]) {
      layerScore[layerOrder] = { totalScore: 0 };
    }

    if (typeof scoreEntry.avg === "number") {
      layerScore[layerOrder].totalScore += scoreEntry.avg * principle.weight;
    }
  }

  // Normalize: divide by 10 (max scale score)
  for (const key in layerScore) {
    layerScore[key].totalScore /= 10;
  }

  return layerScore;
};

/**
 * Step 4: Calculate overall weighted score across all layers.
 */
const calculateOverallScore = (layerScores) => {
  // Layer weights — these match what's seeded in addQuestions.js
  const weights = {
    1: 0.346,
    2: 0.331,
    3: 0.323,
  };

  let weightedSum = 0;
  for (const [layerOrder, weight] of Object.entries(weights)) {
    const layerTotal = layerScores[layerOrder]?.totalScore || 0;
    weightedSum += layerTotal * weight;
  }

  return weightedSum * 100;
};

/**
 * Main entry point: calculate all scores for an evaluation's answers.
 *
 * PERF FIX: One DB round-trip (loadReferenceData) instead of ~30+ individual queries.
 */
const calculateScores = async (subquestionScores) => {
  if (!subquestionScores || subquestionScores.length === 0) {
    return null;
  }

  // Single DB call to load all reference data
  const refData = await loadReferenceData();

  // Step 1
  const questionScores = calculateAverageScorePerQuestion(subquestionScores, refData);
  if (Object.keys(questionScores).length === 0) {
    return null;
  }

  // Step 2
  const principleScores = calculateAverageScorePerPrinciple(questionScores, refData);

  // Step 3
  const layerScores = calculateLayerScores(principleScores, refData);
  if (Object.keys(layerScores).length === 0) {
    return null;
  }

  // Step 4
  const overallScore = calculateOverallScore(layerScores);

  return { questionScores, principleScores, layerScores, overallScore };
};

module.exports = {
  calculateScores,
};
