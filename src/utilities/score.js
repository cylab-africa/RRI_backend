const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const calculateScore = (
  layerOneAnswers,
  layerTwoAnswers = null,
  layerThreeAnswers = null
) => {
  let layerOneScore = 0;
  let layerTwoScore = 0;
  let layerThreeScore = 0;

  let sum = 0;
  layerOneAnswers.forEach((e) => {
    score = (e.score * e.weight) / 10;
    sum += score;
  });

  layerOneScore = sum === 0 ? 0 : (sum * 50) / (layerOneAnswers.length * 10);

  if (layerTwoAnswers !== null || layerTwoAnswers.length !== 0) {
    let sum = 0;
    layerTwoAnswers.forEach((e) => {
      score = (e.score * e.weight) / 10;
      sum += score;
    });
    layerTwoScore = sum === 0 ? 0 : (sum * 30) / (layerTwoAnswers.length * 10);
  }

  if (layerThreeAnswers !== null || layerThreeAnswers.length !== 0) {
    let sum = 0;
    layerThreeAnswers.forEach((e) => {
      score = (e.score * e.weight) / 10;
      sum += score;
    });
    layerThreeScore =
      sum === 0 ? 0 : (sum * 20) / (layerThreeAnswers.length * 10);
  }
  return [
    parseFloat(layerOneScore.toFixed(1)),
    parseFloat(layerTwoScore.toFixed(1)),
    parseFloat(layerThreeScore.toFixed(1)),
    parseFloat((layerOneScore + layerTwoScore + layerThreeScore).toFixed(1)),
  ];
};

const submittedScoresCheck = async (answers, evaluation) => {
  let response = { status: true };
  for (let i = 0; i < answers.length; i++) {
    let question = await prisma.question.findUnique({
      where: { id: answers[i].id },
      include: { layer: true },
    });
    if (evaluation.layersDone === 0) {
      return response;
    }

    if (
      (evaluation.layersDone === 1) & (question.layer.value > 1) ||
      (evaluation.layersDone === 2) & (question.layer.value > 2)
    ) {
      response = { status: true };
    } else {
      response = { status: false };
      break;
    }
  }
  return response;
};

function calculateAverageScore(questions, weights) {
  let totalWeight = 0;
  let weightedSum = 0;

  // Iterate through each question
  questions.forEach((question) => {
    // Find the corresponding weight for the question
    const weight = weights.find((item) => item.id === question.id)?.w || 1;

    // Ensure score is within the range [0, 10]
    const normalizedScore = Math.min(Math.max(question.score, 0), 10);

    // Update the weighted sum and total weight
    weightedSum += normalizedScore * weight;
    totalWeight += weight;
  });

  // Calculate the average score
  const averageScore = totalWeight !== 0 ? weightedSum / totalWeight : 0;
  return averageScore.toFixed(1); // Round to one decimal place
}

module.exports = {
  submittedScoresCheck,
  calculateScore,
  calculateAverageScore,
};
