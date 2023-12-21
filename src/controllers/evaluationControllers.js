const { PrismaClient } = require("@prisma/client");
const { submittedScoresCheck, calculateScore } = require("../utilities/score");
// const token = process.env.TOKEN_SECRET;

const prisma = new PrismaClient();

const createLayers = async () => {
  const layer1 = await prisma.layer.create({ data: { name: "LAYER 1" , value:1} });
  const layer2 = await prisma.layer.create({ data: { name: "LAYER 2" , value:2} });
  const layer3 = await prisma.layer.create({ data: { name: "LAYER 3" , value:3} });
  return [layer1, layer2, layer3];
};

const createQuestionsCheckIfExist = async () => {
  const questions = await prisma.question.findMany({});
  if (questions.length > 0) {
    return;
  }

  const layers = await prisma.layer.findMany({});

  await prisma.question.createMany({
    data: [
      {
        layerId: layers[0].id,
        question:
          "What social problem does your innovation address, and how does it positively impact the local community or sociaty as a whole?",
      },
      {
        layerId: layers[0].id,
        question:
          "How do you involve the local community in the design and implementation of your innovation?",
      },
      {
        layerId: layers[0].id,
        question:
          "Can you provide insights into the ethical considerations that have guided the development and deployment of your innovation?",
      },
      {
        layerId: layers[0].id,
        question:
          "What gouvenment mechanisms are in place to ensure responsible decision-making and compliance with relevant regulations and ethical guidelines?",
      },
    ],
  });

  await prisma.question.createMany({
    data: [
      {
        layerId: layers[1].id,
        question:
          "This is just some questions for layer 2, and how does it positively impact the local community or sociaty as a whole?",
      },
      {
        layerId: layers[1].id,
        question:
          "Layer 2 has three questions only in the design and implementation of your innovation?",
      },
      {
        layerId: layers[1].id,
        question:
          "Can you provide insights into the ethical considerations that have guided the development and deployment of your innovation?",
      },
    ],
  });

  await prisma.question.createMany({
    data: [
      {
        layerId: layers[2].id,
        question:
          "Layer three questions, and how does it positively impact the local community or sociaty as a whole?",
      },
      {
        layerId: layers[2].id,
        question:
          "Layer 3 has two questions only in the design and implementation of your innovation?",
      },
    ],
  });

  return;
};

const getLayers = async (req, res) => {
  try {
    // Check if there is already some layers in the DB
    const layers = await prisma.layer.findMany({});
    if (layers.length === 3) {
      return res.status(200).send({ layers: layers });
    }
    const createdLayers = await createLayers();

    // console.log(user)
    return res.status(200).send({ layers: createdLayers });
  } catch (e) {
    return res.status(500).send({ error: e });
  }
};

const getQuestions = async (req, res) => {
  try {
    // Get the layer id (This is not mandatory)
    const { id } = req.query;
    // Get all layers and questions to check if they exist
    const layerCount = await prisma.layer.count();
    const questionCount = await prisma.question.count();
    // If not
    if (layerCount !== 3 || questionCount === 0) {
      // Create layers
      await createLayers();
      // Check if questions exist or create them
      await createQuestionsCheckIfExist();
    }
    let questions = [];
    if (id) {
      questions = await prisma.question.findMany({
        where: {
          layerId: parseInt(id),
        },
      });
    } else {
      questions = await prisma.question.findMany({});
    }
    return res.status(200).send({ questions: questions });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ error: e });
  }
};

const createProject = async (req, res) => {
  try {
    const { projectName } = req.body;
    console.log(projectName)
    let user = req.user;
    let evaluation = await prisma.evaluation.findFirst({where:{project:projectName, userId:user.id}})
    if(!evaluation){
        evaluation = await prisma.evaluation.create({
          data: { userId: user.id, project: projectName, score:0 },
        });
        // console.log("Hi there ----")
        return res.status(200).send({ message: "Project created.", data: evaluation });

    }
    // console.log(evaluation)
    return res.status(200).send({ message: `Let's proceed with ${projectName}.`, data: evaluation });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ message: "Something went wrong." });
  }
};

const submitAnswers = async (req, res) => {
  try {
    // console.log(token)
    const { answers, layerId, projectId } = req.body;
    const user = req.user;
    // console.log(user)
    // const layer = await prisma.layer.findUnique({where:{id:layerId}})
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: projectId},
    });
    if (evaluation === null) {
      return res.status(404).send({ message: "Project evaluation not found." });
    }
    if (answers.length < 1) {
      return res.status(401).send({ message: "You need to submit answers." });
    }
    // let evaluation = await prisma.evaluation.findFirst({where:{projectId:project.id}})
   
    //  check which layer of answeres to be evaluated for
    const allowedToProceed = await submittedScoresCheck(answers, evaluation)
    if(allowedToProceed.status){
          // console.log(evaluation)
          answers.forEach(async (userAnswer) => {
            // console.log(userAnswer)
            let answer = await prisma.answer.findUnique({where:{questionId:userAnswer.id, evaluationId:evaluation.id}})
            if(answer){
              answer.score = userAnswer.score
            }else{

            answer = await prisma.answer.create({
              data: {
                score: userAnswer.score,
                questionId: userAnswer.id,
                evaluationId: evaluation.id,

              },
            });
          }
            // const answer = await prisma.answer.create({data:{score:userAnswer.score, question:question}})
          });
         
          // console.log(answeresLayerOne)

          
          // evaluation.score =  score
          // evaluation.layersDone+=1
          let updatedEvaluation = await prisma.evaluation.update({where:{id:evaluation.id}, data:{layersDone:evaluation.layersDone+1}})
          return res
            .status(200)
            .send({ message: "Submitted successifully", evaluation: updatedEvaluation });
        }else{
          return res
            .status(401)
            .send({ message: "Project evaluation  completed", evaluation: evaluation});
        }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ message: e });
  }
};

const getEvaluations = async(req, res) => {
  try {
    const { projectId } = req.query;
    const user = req.user;
    // console.log(id)
    let evaluations = []
    if(projectId){
        evaluations= await prisma.evaluation.findMany({where:{id: parseInt(projectId), userId:user.id}})
       
    }else{
        evaluations = await prisma.evaluation.findMany({where:{userId:user.id}})
    }
    let updatedEvaluations = await Promise.all(evaluations.map( async evaluation=>{
      if(evaluation.layersDone === 3){
          const answeresLayerOne = await prisma. answer.findMany({where:{evaluationId:evaluation.id, question:{layer:{value:1}}}})
          const answeresLayerTwo = await prisma. answer.findMany({where:{evaluationId:evaluation.id, question:{layer:{value:2}}}})
          const answeresLayerThree = await prisma. answer.findMany({where:{evaluationId:evaluation.id, question:{layer:{value:3}}}})
          let score = calculateScore(answeresLayerOne, answeresLayerTwo, answeresLayerThree)
          // console.log(score)
          let updatedEvaluation = await prisma.evaluation.update({where:{id:evaluation.id}, data:{score:score}})
          return updatedEvaluation;
      }else{
        return evaluation;
      }
    }))
    console.log(updatedEvaluations)
    
    // averageScore = calculateScore()

    return res.status(200).send({data:updatedEvaluations})
  } catch (e) {
    console.log(e)
    return res.status(500).send({"message":"Something went wrong."})
  }
};

module.exports = {
  getLayers,
  getQuestions,
  submitAnswers,
  createProject,
  getEvaluations
};
