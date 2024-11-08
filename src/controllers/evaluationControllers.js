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
      include: { answers: { include: { subQuestion: true } } },
    });

    // Return project data including answers and questions
    return res.status(200).send({ project: project });
  } catch (e) {
    console.log('report error: ', e)
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
        where: {
          principle: {
            layerId: parseInt(id),
          },
        },
        include: { subQuestions: true },
        orderBy: [{ number: "asc" }],
      });
    } else {
      // Fetch all questions if no layer ID is provided
      questions = await prisma.question.findMany({
        include: { subQuestions: true },
      });

    }
    return res.status(200).send({ questions: questions });
  } catch (e) {
    console.log('backend error in retrieve questions : ', e);
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

    console.log('error project', e);
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



        const answers = evaluation ? await prisma.answer.findMany({
          where: { evaluationId: evaluation?.id },
          include: { subQuestion: true },
        }) : null;
        const projectscores = await calculateScores(answers);
        let layerScoresArray = Object.values(projectscores?.layerScores).map(entry => entry.totalScore * 100);

        layerScoresArray.push(projectscores.overallScore);

        // console.log('layer score: ', layerScoresArray)
        await prisma.evaluation.update({
          where: { id: evaluation.id },
          data: {
            score: { set: layerScoresArray },
          },
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
            orderBy: { startTime: "desc" },
          },
        },
      });
    }

    return res.status(200).send({ data: sortedProjects });
  } catch (e) {
    console.log('error in fetching projects: ', e)
    return res.status(500).send({ message: "Something went wrong." });
  }
};

// Submit answers for a project evaluation
const submitAnswers = async (req, res) => {
  try {
    const { answers, projectId } = req.body;
    const user = req.user;
    console.log('answers length:', answers?.length);
    console.log('------------------------------------------------------------------');

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
    for (const userAnswer of answers) {
      const subquestion = await prisma.subQuestion.findFirst({
        where: { id: userAnswer.id },
      });
      if (subquestion) {
        let answer = await prisma.answer.findFirst({
          where: { subQuestionId: userAnswer.id, evaluationId: evaluation.id },
        });

        if (subquestion.type === "text") {
          if (answer) {
            await prisma.answer.update({
              where: { id: answer.id },
              data: { score: 10 }, // Default score for text-type questions
            });
          } else {
            await prisma.answer.create({
              data: {
                score: 10,
                subQuestionId: subquestion.id,
                evaluationId: evaluation.id,
              },
            });
          }
        } else {
          if (answer) {
            await prisma.answer.update({
              where: { id: answer.id },
              data: { score: userAnswer.score },
            });
          } else {
            await prisma.answer.create({
              data: {
                score: userAnswer.score,
                subQuestionId: subquestion.id,
                evaluationId: evaluation.id,
              },
            });
          }
        }
      }
    }

    // Retrieve all answers for the evaluation after processing submissions
    const evaluationAnswers = await prisma.answer.findMany({
      where: { evaluationId: evaluation.id },
      include: { subQuestion: true },
    });
    console.log('evaluationAnswers length:', evaluationAnswers.length);
    console.log('evaluationAnswers data:', evaluationAnswers);

    // Calculate scores based on the answers
    const projectscores = await calculateScores(evaluationAnswers);
    console.log("projectscores:", projectscores);

    // Check if layerScoresArray and overallScore are valid
    let layerScoresArray = Object.values(projectscores?.layerScores || {}).map(entry => entry.totalScore * 100);
    if (layerScoresArray.some(isNaN)) {
      console.warn("layerScoresArray contains NaN values:", layerScoresArray);
    }

    layerScoresArray.push(projectscores.overallScore);

    if (layerScoresArray.some(isNaN)) {
      console.warn("layerScoresArray contains NaN values after adding overallScore:", layerScoresArray);
    }

    // Mark the evaluation as complete and update the score
    const updatedEvaluation = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        score: { set: layerScoresArray }, // Use `set` to replace the entire array
        completedLayers: 1,
      },
    });

    return res.status(200).send({
      message: "Submitted successfully",
      evaluation: updatedEvaluation,
    });

  } catch (e) {
    console.log('submit answer error:', e);
    return res.status(500).send({ message: e.message, stack: e.stack });
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
