const { PrismaClient } = require("@prisma/client");
const { submittedScoresCheck, calculateScore, calculateAverageScore } = require("../utilities/score");
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


const generateReport = async(req, res) =>{

    try{
      let user = req.user;
      // req.params.userId
      let { pid } = req.params;
      let project;
      simple = (simple === 'true')
      project = await prisma.project.findFirst({
        where: { id: pid },
        include: { evaluations: true },
      }); 

      return res.status(200).send({"project": project})
    }catch(e){
        // console.log(e)
        return res.status(500).send({ error: e });

    }
}


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
        include: {
          subquestions: true,
        },
        orderBy: [
          {
            number: "asc",
          },
        ],
      });
    } else {
      questions = await prisma.question.findMany({
        include: {
          subquestions: true,
        },
      });
    }
    return res.status(200).send({ questions: questions });
  } catch (e) {
    return res.status(500).send({ error: e });
  }
};

const createProject = async (req, res) => {
  try {
    const { projectName } = req.body;
    let user = req.user;
    let project = await prisma.project.findFirst({
      where: { name: projectName, userId: user.id },
      include: { evaluations: true },
    });
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: projectName,
          userId: user.id,
        },
      });
    }

    let evaluation = await prisma.evaluation.findFirst({
      where: { projectId: project.id, layersDone: 0 },
    });
    if (!evaluation) {
      evaluation = await prisma.evaluation.create({
        data: { projectId: project.id, score: [0, 0, 0, 0] },
      });
      return res
        .status(200)
        .send({ message: "Project created.", data: project });
    }
    return res
      .status(200)
      .send({ message: `Let's proceed with ${projectName}.`, data: project });
  } catch (e) {
    return res.status(500).send({ message: "Something went wrong." });
  }
};

const getProjects = async (req, res) => {
  try {
    let user = req.user;
    let { simple } = req.query;
    let projects = [];
    simple = (simple === 'true')
    projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: { evaluations: true },
    });
    await Promise.all(
      projects.map(async (project) => {
        const evaluation = await prisma.evaluation.findFirst({
          where: { projectId: project.id },
        });
        const answeres = await prisma.answer.findMany({
          where: {
            evaluationId: evaluation.id,
          },
          include:{question:true}
        });
       
        const score = await calculateAverageScore(answeres)
       
        let updatedEvaluation = await prisma.evaluation.update({
          where: { id: evaluation.id },
          data: { score: score },
        });

        return updatedEvaluation;
      })
    );
    let sortedProjects;
    if (simple === true) {
      sortedProjects = await prisma.project.findMany({
        where: { userId: user.id },
        
        select: {
          name:true,
         
        },
      });
    }else{

      sortedProjects = await prisma.project.findMany({
        where: { userId: user.id },
        include: {
          evaluations: {
            orderBy: {
              timeStarted: "desc",
            },
          },
        },
      });
      
    }
    return res.status(200).send({ data: sortedProjects });
  } catch (e) {
    // console.log(e)
    return res.status(500).send({ message: "Something went wrong." });
  }
};

const submitAnswers = async (req, res) => {
  try {
    const { answers, projectId } = req.body;
    const user = req.user;
    const evaluation = await prisma.evaluation.findFirst({
      where: { projectId: parseInt(projectId), layersDone: 0 },
    });
    if (evaluation === null) {
      return res.status(404).send({ message: "Project evaluation not found." });
    }
    if (answers.length < 1) {
      return res.status(401).send({ message: "You need to submit answers." });
    }

    answers.forEach(async (userAnswer) => {
      const question = await prisma.subQuestion.findFirst({
        where: { id: userAnswer.id },
      });
      if (question) {
        let answer = await prisma.answer.findFirst({
          where: { questionId: userAnswer.id, evaluationId: evaluation.id },
        });

        if (question.type === "text") {
          if (answer) {
            answer.answer = userAnswer.answer;
          } else {
            answer = await prisma.answer.create({
              data: {
                score: 10,
                answer: userAnswer.answer,
                questionId: question.id,
                evaluationId: evaluation.id,
                weight: question.weight,
              },
            });
          }
        } else {
          if (answer) {
            answer.score = userAnswer.score;
          } else {
            answer = await prisma.answer.create({
              data: {
                score: userAnswer.score,
                questionId: question.id,
                evaluationId: evaluation.id,
                weight: question.weight,
              },
            });
          }
        }
      }
    });


    const evaluationAnswers = await prisma.answer.findMany({
      where: { evaluationId: evaluation.id },
      include:{question:true}
    });
    const score = await calculateAverageScore(evaluationAnswers)
    updatedEvaluation = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: { layersDone: 1 },
    });

    
    // let updatedEvaluation = await prisma.evaluation.update({
    //   where: { id: evaluation.id },
    //   data: { score: score, layersDone: 1 },
    // });
    return res.status(200).send({
      message: "Submitted successifully",
      evaluation: updatedEvaluation,
    });
  } catch (e) {
    // console.log(e);
    return res.status(500).send({ message: e });
  }
};

const getEvaluations = async (req, res) => {
  try {
    const { projectId } = req.query;
    const user = req.user;
    let evaluations = [];
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: parseInt(projectId) },
      });

      evaluations = await prisma.evaluation.findMany({
        where: { projectId: project.id, userId: user.id },
      });
    } else {
      evaluations = await prisma.evaluation.findMany({
        where: { userId: user.id },
      });
    }

    let updatedEvaluations = await Promise.all(
      evaluations.map(async (evaluation) => {
        const answeresLayerOne = await prisma.answer.findMany({
          where: {
            evaluationId: evaluation.id,
            question: { question: { layer: { value: 1 } } },
          },
        });
        const answeresLayerTwo = await prisma.answer.findMany({
          where: {
            evaluationId: evaluation.id,
            question: { question: { layer: { value: 2 } } },
          },
        });
        const answeresLayerThree = await prisma.answer.findMany({
          where: {
            evaluationId: evaluation.id,
            question: { question: { layer: { value: 3 } } },
          },
        });
        let score = calculateScore(
          answeresLayerOne,
          answeresLayerTwo,
          answeresLayerThree
        );
        let updatedEvaluation = await prisma.evaluation.update({
          where: { id: evaluation.id },
          data: { score: score },
        });
        return updatedEvaluation;
      })
    );

    return res.status(200).send({ data: updatedEvaluations });
  } catch (e) {
    return res.status(500).send({ message: "Something went wrong." });
  }
};

module.exports = {
  getLayers,
  getQuestions,
  submitAnswers,
  createProject,
  getEvaluations,
  getProjects,
  generateReport
};
