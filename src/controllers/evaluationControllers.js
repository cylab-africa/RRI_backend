const { PrismaClient } = require("@prisma/client");
const { submittedScoresCheck, calculateScore } = require("../utilities/score");
// const token = process.env.TOKEN_SECRET;

const prisma = new PrismaClient();


const getLayers = async (req, res) => {
  try {
    // Check if there is already some layers in the DB
    const layers = await prisma.layer.findMany({});
    return res.status(200).send({ layers: layers });

  } catch (e) {
    return res.status(500).send({ error: e });
  }
};

const getQuestions = async (req, res) => {
  try {
    // Get the layer id (This is not mandatory)
    const { id } = req.query;
    let questions = [];
    if (id) {
      questions = await prisma.question.findMany({
        where: {
          layerId: parseInt(id),
        },
        include:{
          subquestions:true
        },
        orderBy: [
          {
            number: 'asc',
          },
        ]
      });
    } else {
      questions = await prisma.question.findMany({
        include:{
          subquestions:true
        }
      });
    }
    return res.status(200).send({ questions: questions });
  } catch (e) {
    // console.log(e);
    return res.status(500).send({ error: e });
  }
};

const createProject = async (req, res) => {
  try {
    const { projectName } = req.body;
    // console.log(projectName)
    let user = req.user;
    let project = await prisma.project.findFirst({where:{name:projectName}, include:{evaluations:true}})
    if (!project){
      project = await prisma.project.create({
        data:{
          name:projectName,
          userId: user.id
        }
      })
    }

    let evaluation = await prisma.evaluation.findFirst({where:{projectId:project.id, layersDone:0}})
    if(!evaluation){
        evaluation = await prisma.evaluation.create({
          data: { projectId: project.id, score:[0,0,0,0] },
        });
        // console.log("Hi there ----")
        return res.status(200).send({ message: "Project created.", data: project });

    }
    // console.log(evaluation)
    return res.status(200).send({ message: `Let's proceed with ${projectName}.`, data: project });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ message: "Something went wrong." });
  }
};


const getProjects = async (req, res) => {
  try {
    // const { projectName } = req.body;
    const { projectId } = req.query
    // console.log(projectName)
    let user = req.user;

    let projects = []
    if (projectId){
        projects = await prisma.project.findMany({where:{id: projectId, userId:user.id}, include:{evaluations:true}})
        return res.status(200).send({  data: projects });
    }else{
        projects = await prisma.project.findMany({where:{userId:user.id}, include:{evaluations:true}})
        return res.status(200).send({data: projects });
    }
  } catch (e) {
      // console.log(e);
      return res.status(500).send({ message: "Something went wrong." });
  }
};


const submitAnswers = async (req, res) => {
  try {
    // console.log(token)
    const { answers, projectId } = req.body;
    console.log(answers)
    const user = req.user;
    // console.log(user)
    // const layer = await prisma.layer.findUnique({where:{id:layerId}})
    const evaluation = await prisma.evaluation.findFirst({
      where: { projectId: parseInt(projectId), layersDone:0},
    });
    if (evaluation === null) {
      return res.status(404).send({ message: "Project evaluation not found." });
    }
    if (answers.length < 1) {
      return res.status(401).send({ message: "You need to submit answers." });
    }
    // let evaluation = await prisma.evaluation.findFirst({where:{projectId:project.id}})
   
    //  check which layer of answeres to be evaluated for
    // const allowedToProceed = await submittedScoresCheck(answers, evaluation)
    // if(allowedToProceed.status){
          // console.log(evaluation)
    answers.forEach(async (userAnswer) => {
      // console.log(userAnswer)
      const question = await prisma.subQuestion.findFirst({where:{id:userAnswer.id}})
      if(question){
        let answer = await prisma.answer.findFirst({where:{questionId:userAnswer.id, evaluationId:evaluation.id}})

        if(question.type === 'text'){
            if(answer){
              answer.answer = userAnswer.answer
            }else{
      
            answer = await prisma.answer.create({
              data: {
                score:10,
                answer:userAnswer.answer,
                questionId: question.id,
                evaluationId: evaluation.id,
                weight:question.weight
              },
            });
          }
        }else{
            if(answer){
              answer.score = userAnswer.score
            }else{
      
            answer = await prisma.answer.create({
              data: {
                score: userAnswer.score,
                questionId: question.id,
                evaluationId: evaluation.id,
                weight:question.weight
              },
            });
          }
        }
      }

    });
    
 
      updatedEvaluation = await prisma.evaluation.update({where:{id:evaluation.id}, data:{layersDone:1}})

    return res
      .status(200)
      .send({ message: "Submitted successifully", evaluation: updatedEvaluation });
     
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
        const project = await prisma.project.findFirst({where:{id:parseInt(projectId)}}) 

        evaluations= await prisma.evaluation.findMany({where:{projectId:project.id, userId:user.id}})
       
    }else{
        evaluations = await prisma.evaluation.findMany({where:{userId:user.id}})
    }

    let updatedEvaluations = await Promise.all(evaluations.map( async evaluation=>{
      // if(evaluation.layersDone === 3){
          const answeresLayerOne = await prisma. answer.findMany({where:{evaluationId:evaluation.id, question:{question:{layer:{value:1}}}}})
          const answeresLayerTwo = await prisma. answer.findMany({where:{evaluationId:evaluation.id, question:{question:{layer:{value:2}}}}})
          const answeresLayerThree = await prisma. answer.findMany({where:{evaluationId:evaluation.id, question:{question:{layer:{value:3}}}}})
          let score = calculateScore(answeresLayerOne, answeresLayerTwo, answeresLayerThree)
          // console.log(score)
          let updatedEvaluation = await prisma.evaluation.update({where:{id:evaluation.id}, data:{score:score}})
          return updatedEvaluation;
      // }else{
      //   return evaluation;
      // }
    }))
    // console.log(updatedEvaluations)
    
    // averageScore = calculateScore()

    return res.status(200).send({data:updatedEvaluations})
  } catch (e) {
    // console.log(e)
    return res.status(500).send({"message":"Something went wrong."})
  }
};

module.exports = {
  getLayers,
  getQuestions,
  submitAnswers,
  createProject,
  getEvaluations,
  getProjects
};
