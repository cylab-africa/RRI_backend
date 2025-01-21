const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Fetch the weight of a principle from the database.
 * @param {number} principleId - The ID of the principle.
 * @returns {Promise<number>} - The weight of the principle.
 */
const getPrincipleWeightFromDB = async (principleName) => {
  const principle = await prisma.principle.findFirst({
    where: { name: principleName },
    select: { weight: true }, // Fetch the weight of the principle
  });
  return principle ? principle.weight : 0;
};

/**
 * Fetch the weight of a layer from the database.
 * @param {number} layerId - The ID of the layer.
 * @returns {Promise<number>} - The weight of the layer.
 */
const getLayerWeightFromDB = async (layerId) => {
  const layer = await prisma.layer.findUnique({
    where: { id: layerId },
    select: { weight: true }, // Fetch the weight of the layer
  });
  return layer ? layer.weight : 0;
};

/**
 * Calculate the average score for each principle based on subquestion scores.
 * 1. Iterate through each subquestion and find its corresponding principle.
 * 2. Accumulate the scores for each subquestions for specific questions in principle.
 * 3. Calculate the average score for each principle.
 * @param {Array} subquestionScores - Array of objects containing scores for subquestions.
 * @returns {Promise<Object>} - Object with average scores for each principle.
 */

const calculateAverageScorePerQuestion = async (subquestionScores) => {

  // Fetch all questions with their associated principles and subquestions
  const questions = await prisma.question.findMany({
    include: {
      subQuestions: true, // Include the subquestions linked to each question
    },
  });

  // Object to store the accumulated scores and counts for each principle
  const questionScores = {};
  // Iterate over all subquestion scores to accumulate them under the corresponding principle

  for (let scoreEntry of subquestionScores) {
    const q_id = scoreEntry.subQuestion.questionId; // Get the question ID for the subquestion

    const question = questions.find((q) => q.id === q_id); // Find the corresponding question

    // Initialize tracking for the principle if not already done
    if (!questionScores[question.text]) {
      questionScores[question.text] = { totalScore: 0, count: 0 };
    }

    // Add the subquestion score to the principle's accumulated total
    if (typeof scoreEntry.score === 'number') {
      questionScores[question.text].totalScore += scoreEntry.score; // Accumulate score
      questionScores[question.text].count += 1; // Increment the count for calculating the average
    }
  }

  // Calculate the average score for each principle and apply the principle's weight
  const questionAverageScores = {};

  for (const questionelt in questionScores) {
    questionScores[questionelt].avg = questionScores[questionelt].totalScore / questionScores[questionelt].count;

  }
  return questionScores;
};


const calculateAverageScorePerPrinciple = async (questionScores) => {
  // Fetch all questions with their associated principles and subquestions
  const principles = await prisma.principle.findMany({
    include: {
      questions: true, // Include the subquestions linked to each question
    },
  });

  // Object to store the accumulated scores and counts for each principle
  const principleScores = {};

  // Iterate over all subquestion scores to accumulate them under the corresponding principle
  for (let [questionText, scoreEntry] of Object.entries(questionScores)) {

    // to search question by test
    const question = await prisma.question.findFirst({
      where: {
        text: questionText, // Find the question by its text
      },
      include: {
        principle: true, // Include the principle if needed
        subQuestions: true, // Include related subquestions if needed
      },
    });
    const principle = question.principle.name; // Get the name of the principle linked to the question

    // Initialize tracking for the principle if not already done
    if (!principleScores[principle]) {
      principleScores[principle] = { totalScore: 0, count: 0 };
    }

    // Add the subquestion score to the principle's accumulated total
    if (typeof scoreEntry.avg === 'number') {
      principleScores[principle].totalScore += scoreEntry.avg; // Accumulate score
      principleScores[principle].count += 1; // Increment the count for calculating the average
    }
  }

  for (const principle in principleScores) {
    principleScores[principle].avg = principleScores[principle].totalScore / principleScores[principle].count;
    // Fetch the weight of the principle from the database
    // const principleWeight = await getPrincipleWeightFromDB(principle);
    // Apply the principle's weight to the average score
    // principleAverageScores[principle] = avgPrincipleScore * principleWeight; // Weighted score for each principle
  }
  return principleScores;
};

/**
 * Calculate the score for each layer by summing up the weighted principle scores.
 * 1. Sum the weighted scores of all principles within a layer.
 * 2. Apply the layer's weight to calculate the final score for that layer.
 * @param {Object} principleScores - Object containing the weighted scores for each principle.
 * @returns {Promise<Object>} - Object containing the score for each layer.
 */
const calculateLayerScores = async (principleScores) => {

  let layerScore = {}

  for (let [principletext, scoreEntry] of Object.entries(principleScores)) {
    const principle = await prisma.principle.findFirst({
      where: {
        name: principletext, // Find the question by its text
      },
      include: {
        layer: true, // Include the principle if needed
      },
    });


    if (!layerScore[principle.layer.order]) {
      layerScore[principle.layer.order] = { totalScore: 0 };
    }


    if (typeof scoreEntry.avg === 'number') {

      // 1. weight of principle
      const pWeight = await getPrincipleWeightFromDB(principle.name);

      // 2. weight*scoreEntry.avg

      // 3. calculate sum
      layerScore[principle.layer.order].totalScore = layerScore[principle.layer.order].totalScore + (scoreEntry.avg * pWeight);


      // N.B. all of this for perfect score should be equal to one

    }

  }
  // Iterate through each layer to calculate its score based on principles
  for (let key in layerScore) {
    if (layerScore[key].totalScore !== undefined) { // Check if totalScore exists
      layerScore[key].totalScore /= 10; // Divide totalScore by the divisor
    }
  }

  return layerScore;
};

/**
 * Calculate the overall score by summing up the scores of all layers.
 * 1. Sum the scores of each layer.
 * 2. Return the final overall score as a percentage.
 * @param {Object} layerScores - Object containing the scores for each layer.
 * @returns {Promise<number>} - The final overall score as a percentage.
 */
const calculateOverallScore = async (layerScores) => {

  // Define the weights for each layer
  const weights = {
    '1': 0.346,
    '2': 0.331,
    '3': 0.323
  };

  // Calculate the weighted sum
  const weightedSum = (layerScores['1']?.totalScore * weights['1']) +
    (layerScores['2']?.totalScore * weights['2']) +
    (layerScores['3']?.totalScore * weights['3']);

  // Return the overall score as a percentage
  return weightedSum * 100; // Assuming the final score is represented as a percentage
};

/**
 * Main function to calculate the total scores for an evaluation.
 * 1. Calculate the average scores for each principle.
 * 2. Calculate the scores for each layer based on the principle scores.
 * 3. Calculate the final overall score.
 * @param {Array} subquestionScores - Array of objects containing the scores for subquestions.
 * @returns {Promise<Object>} - Object containing the principle scores, layer scores, and the overall score.
 */
const calculateScores = async (subquestionScores) => {

  if (subquestionScores != null) {
    console.log('subquestionScores: ',subquestionScores)
    // Step 1: Calculate average scores per question
    const questionScores = await calculateAverageScorePerQuestion(subquestionScores);
    console.log('questionscores: ',questionScores)
    if (Object.keys(questionScores).length > 0) {
      
      // Step 2: Calculate average scores per principle
      const principleScores = await calculateAverageScorePerPrinciple(questionScores);

      const layerScores = await calculateLayerScores(principleScores);

      if (Object.keys(layerScores).length > 0) {
        const overallScore = await calculateOverallScore(layerScores);
        if(!overallScore){
          console.log('we don\'t have overall score')
        }
        return { questionScores, principleScores, layerScores, overallScore };
      }
      console.log('we don\'t have layers score')
      return null;

    } else {
      console.log('we don\'t have question score')
      return null;
    }

  } else {
    return null
  }
  // Step 1: Calculate average scores per principle
  // const principleScores = await calculateAverageScorePerPrinciple(subquestionScores);

  // Step 2: Calculate the scores for each layer based on the principle scores
  // const layerScores = await calculateLayerScores(principleScores);

  // Step 3: Calculate the overall score by summing layer scores
  // const overallScore = await calculateOverallScore(layerScores);

  // Return the result containing principle scores, layer scores, and overall score
};

module.exports = {
  calculateScores,
};
