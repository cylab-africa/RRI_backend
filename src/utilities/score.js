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

      return [parseFloat((layerOneAverage*10).toFixed(1)), parseFloat((layerTwoAverage*10).toFixed(1)), parseFloat((layerThreeAverage*10).toFixed(1)), totalAverage*100]

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
  let avg = 
            (layerOneAverage * 0.346 / 10) 
            + (layerTwoAverage * 0.331 /10) 
            + (layerThreeAverage * 0.323 /10) 

  return avg
}


module.exports = {
  // submittedScoresCheck,
  // calculateScore,
  // calculateAverageScore,
  calculateAverageScore
};
