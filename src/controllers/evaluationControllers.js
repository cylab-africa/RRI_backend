const { PrismaClient } = require("@prisma/client");
const { calculateScores } = require("../utilities/score");

const prisma = new PrismaClient();

// Get layers with their weights from the database
const getLayers = async (req, res) => {
  try {
    // Retrieve all layers from the database
    const layers = await prisma.layer.findMany({});
    return res.status(200).send({ layers: layers });
  } catch (e) {
    return res.status(500).send({ error: e });
  }
};

// Get principles linked to layers, including their weights
const getPrinciples = async (req, res) => {
  try {
    // Fetch principles from the database, including their associated layer and weight
    const principles = await prisma.principle.findMany({
      include: {
        layer: true,  // Include associated layer data for each principle
      },
    });
    return res.status(200).send({ principles: principles });
  } catch (e) {
    return res.status(500).send({ error: e });
  }
};

// Generate a report based on the evaluation of a project
const generateReport = async (req, res) => {
  try {
    let user = req.user;
    let { pid } = req.params;
    let project;

    // Fetch the project evaluation by its ID, including answers to questions
    project = await prisma.evaluation.findFirst({
      where: { id: parseInt(pid) },
      include: { answers: { include: { question: true } } },
    });

    // Return project data including answers and questions
    return res.status(200).send({ project: project });
  } catch (e) {
    return res.status(500).send({ error: e });
  }
};

// Get questions for a project, optionally filtered by layer ID
const getQuestions = async (req, res) => {
  try {
    const { id } = req.query;
    let questions = [];
    
    // If a layer ID is provided, fetch questions related to that layer
    if (id) {
      questions = await prisma.question.findMany({
        where: { layerId: parseInt(id) },
        include: { subquestions: true },
        orderBy: [{ number: "asc" }],
      });
    } else {
      // Fetch all questions if no layer ID is provided
      questions = await prisma.question.findMany({
        include: { subquestions: true },
      });
    }

    return res.status(200).send({ questions: questions });
  } catch (e) {
    return res.status(500).send({ error: e });
  }
};

// Create a new project for the user
const createProject = async (req, res) => {
  try {
    const { projectName } = req.body;
    let user = req.user;
    
    // Check if the project already exists for the user
    let project = await prisma.project.findFirst({
      where: { name: projectName, userId: user.id },
      include: { evaluations: true },
    });

    // If the project does not exist, create it
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: projectName,
          userId: user.id,
        },
      });
    }

    // Check if an evaluation exists for the project and create one if needed
    let evaluation = await prisma.evaluation.findFirst({
      where: { projectId: project.id, completedLayers: 0 },
    });
    if (!evaluation) {
      evaluation = await prisma.evaluation.create({
        data: { projectId: project.id, score: [0, 0, 0, 0] },
      });
      return res.status(200).send({ message: "Project created.", data: project });
    }
    
    return res.status(200).send({ message: `Let's proceed with ${projectName}.`, data: project });
  } catch (e) {
    
  console.log('error project',e);
    return res.status(500).send({ message: "Something went wrong." });
  }
};

// Get all projects for the user
const getProjects = async (req, res) => {
  try {
    let user = req.user;
    let { simple } = req.query;
    let projects = [];

    simple = (simple === 'true');
    projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: { evaluations: true },
    });

    // Calculate and update scores for each project using the utility function
    await Promise.all(
      projects.map(async (project) => {
        const evaluation = await prisma.evaluation.findFirst({
          where: { projectId: project.id },
        });

        const answers = await prisma.answer.findMany({
          where: { evaluationId: evaluation.id },
          include: { question: true },
        });

        // Calculate the average score for the answers and update the evaluation
        const { principleScores, layerScores, overallScore } = await calculateScores(answers);
        await prisma.evaluation.update({
          where: { id: evaluation.id },
          data: { score: overallScore },
        });
      })
    );

    let sortedProjects;
    if (simple === true) {
      sortedProjects = await prisma.project.findMany({
        where: { userId: user.id },
        select: { name: true },
      });
    } else {
      sortedProjects = await prisma.project.findMany({
        where: { userId: user.id },
        include: {
          evaluations: {
            orderBy: { timeStarted: "desc" },
          },
        },
      });
    }

    return res.status(200).send({ data: sortedProjects });
  } catch (e) {
    return res.status(500).send({ message: "Something went wrong." });
  }
};

// Submit answers for a project evaluation
const submitAnswers = async (req, res) => {
  try {
    const { answers, projectId } = req.body;
    const user = req.user;

    // Fetch the evaluation for the project
    const evaluation = await prisma.evaluation.findFirst({
      where: { projectId: parseInt(projectId), completedLayers: 0 },
    });
    if (!evaluation) {
      return res.status(404).send({ message: "Project evaluation not found." });
    }

    // Ensure at least one answer is provided
    if (answers.length < 1) {
      return res.status(401).send({ message: "You need to submit answers." });
    }

    // Process each answer and store it in the database
    answers.forEach(async (userAnswer) => {
      const question = await prisma.subQuestion.findFirst({
        where: { id: userAnswer.id },
      });
      if (question) {
        let answer = await prisma.answer.findFirst({
          where: { questionId: userAnswer.id, evaluationId: evaluation.id },
        });

        // Handle text-type questions differently by assigning a default score
        if (question.type === "text") {
          if (answer) {
            answer.answer = userAnswer.answer;
          } else {
            await prisma.answer.create({
              data: {
                score: 10,
                answer: userAnswer.answer,
                questionId: question.id,
                evaluationId: evaluation.id,
              },
            });
          }
        } else {
          if (answer) {
            answer.score = userAnswer.score;
          } else {
            await prisma.answer.create({
              data: {
                score: userAnswer.score,
                questionId: question.id,
                evaluationId: evaluation.id,
              },
            });
          }
        }
      }
    });

    // Calculate scores after submission
    const evaluationAnswers = await prisma.answer.findMany({
      where: { evaluationId: evaluation.id },
      include: { question: true },
    });

    const { principleScores, layerScores, overallScore } = await calculateScores(evaluationAnswers);
    
    // Mark the evaluation as complete and update the score
    const updatedEvaluation = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: { score: overallScore, completedLayers: 1 },
    });

    return res.status(200).send({
      message: "Submitted successfully",
      evaluation: updatedEvaluation,
    });
  } catch (e) {
    return res.status(500).send({ message: e });
  }
};

// Get all evaluations for the user, optionally filtered by projectId
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

    return res.status(200).send({ evaluations: evaluations });
  } catch (e) {
    return res.status(500).send({ message: e });
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
};
