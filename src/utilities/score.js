const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();



  const calculateAverageScore = async (subquestionScores)=>{
      const layerOne = [];
      const layerTwo = [];
      const layerThree = [];
      
      let questions  = await prisma.question.findMany({
        include: { layer: true, subquestions:true},
      });


      subquestionScores.forEach(scoreEntry => {
        const q_id = scoreEntry.question.questionId;
        
        const question = questions.find(q => q.id === q_id);
    
        const layer = question.layer;
        if (layer.value === 1) {
          layerOne.push(scoreEntry);
        } else if (layer.value === 2) {
          layerTwo.push(scoreEntry);
        } else if (layer.value === 3) {
          layerThree.push(scoreEntry);
        }
      });
      
     
      
      const layerOneAverage = calculateLayerAverage(layerOne, questions);
      const layerTwoAverage = calculateLayerAverage(layerTwo, questions);
      const layerThreeAverage = calculateLayerAverage(layerThree, questions);
      
      const totalAverage = calculateGeneralAverage(questions, layerOneAverage, layerTwoAverage, layerThreeAverage);

      return [ parseInt(layerOneAverage*10), parseInt(layerTwoAverage*10), parseInt(layerThreeAverage*10), parseInt(totalAverage*100)]

  }
  
  function calculateLayerAverage(layer, questions) {

    let totalWeightedScore = 0;
    let totalWeight = 0;
    layer.forEach(scoreEntry => {
      const q_id = scoreEntry.question.questionId;
      const question = questions.find(q => q.id === q_id);
      const subquestion = question.subquestions.find(sq => sq.id === scoreEntry.questionId);

      const weight = subquestion.weight;
      const score = scoreEntry.score;
      if (typeof score === 'number') {
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    });
    return totalWeight === 0 ? 0 : totalWeightedScore / totalWeight;
  }



const calculateGeneralAverage =  (questions, layerOneAverage, layerTwoAverage, layerThreeAverage)=>{
  const totalLayerWeight = questions.reduce((sum, q) => sum + q.weight, 0);
  let avg = (layerOneAverage * 0.346 / 10) + (layerTwoAverage * 0.331 /10) + (layerThreeAverage * 0.323 /10) 
  // const generalAverage = (
  //   layerOneAverage * questions.filter(q => q.layerId === 1).reduce((sum, q) => sum + q.weight, 0) +
  //   layerTwoAverage * questions.filter(q => q.layerId === 2).reduce((sum, q) => sum + q.weight, 0) +
  //   layerThreeAverage * questions.filter(q => q.layerId === 3).reduce((sum, q) => sum + q.weight, 0)
  // ) / totalLayerWeight;
  return avg
}

// const calculateScore = (
//   layerOneAnswers,
//   layerTwoAnswers = null,
//   layerThreeAnswers = null
// ) => {
//   let layerOneScore = 0;
//   let layerTwoScore = 0;
//   let layerThreeScore = 0;

//   let sum = 0;
//   layerOneAnswers.forEach((e) => {
//     score = (e.score * e.weight) / 10;
//     sum += score;
//   });

//   layerOneScore = sum === 0 ? 0 : (sum * 50) / (layerOneAnswers.length * 10);

//   if (layerTwoAnswers !== null || layerTwoAnswers.length !== 0) {
//     let sum = 0;
//     layerTwoAnswers.forEach((e) => {
//       score = (e.score * e.weight) / 10;
//       sum += score;
//     });
//     layerTwoScore = sum === 0 ? 0 : (sum * 30) / (layerTwoAnswers.length * 10);
//   }

//   if (layerThreeAnswers !== null || layerThreeAnswers.length !== 0) {
//     let sum = 0;
//     layerThreeAnswers.forEach((e) => {
//       score = (e.score * e.weight) / 10;
//       sum += score;
//     });
//     layerThreeScore =
//       sum === 0 ? 0 : (sum * 20) / (layerThreeAnswers.length * 10);
//   }
//   return [
//     parseFloat(layerOneScore.toFixed(1)),
//     parseFloat(layerTwoScore.toFixed(1)),
//     parseFloat(layerThreeScore.toFixed(1)),
//     parseFloat((layerOneScore + layerTwoScore + layerThreeScore).toFixed(1)),
//   ];
// };

// const submittedScoresCheck = async (answers, evaluation) => {
//   let response = { status: true };
//   for (let i = 0; i < answers.length; i++) {
//     let question = await prisma.question.findUnique({
//       where: { id: answers[i].id },
//       include: { layer: true },
//     });
//     if (evaluation.layersDone === 0) {
//       return response;
//     }

//     if (
//       (evaluation.layersDone === 1) & (question.layer.value > 1) ||
//       (evaluation.layersDone === 2) & (question.layer.value > 2)
//     ) {
//       response = { status: true };
//     } else {
//       response = { status: false };
//       break;
//     }
//   }
//   return response;
// };

// function calculateAverageScore(questions, weights) {
//   let totalWeight = 0;
//   let weightedSum = 0;

//   // Iterate through each question
//   questions.forEach((question) => {
//     // Find the corresponding weight for the question
//     const weight = weights.find((item) => item.id === question.id)?.w || 1;

//     // Ensure score is within the range [0, 10]
//     const normalizedScore = Math.min(Math.max(question.score, 0), 10);

//     // Update the weighted sum and total weight
//     weightedSum += normalizedScore * weight;
//     totalWeight += weight;
//   });

//   // Calculate the average score
//   const averageScore = totalWeight !== 0 ? weightedSum / totalWeight : 0;
//   return averageScore.toFixed(1); // Round to one decimal place
// }

module.exports = {
  // submittedScoresCheck,
  // calculateScore,
  // calculateAverageScore,
  calculateAverageScore
};
