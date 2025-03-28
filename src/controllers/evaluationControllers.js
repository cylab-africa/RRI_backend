const { PrismaClient } = require("@prisma/client");
const { calculateScores } = require("../utilities/score");
const { createAnonimousAccount } = require("./authController");
const { verifyToken, authenticateCreateUser } = require("../utilities/authUtilities");
const { generateJWTToken, verifyJWTToken } = require("../utilities/tokenGeneretor");

const prisma = new PrismaClient();


const submitAuth = async (req, res) => {
  console.log('submit authentication')
  if (!req.user) {
    const createdUser = await createAnonimousAccount()
    console.log('anonimous user: ', createdUser)
    req.user = createdUser.user;
  }
  try {
    let project = await prisma.project.findFirst({
      where: { name: req.body.projectName }
    });
    let evaluation;
    console.log('user 1: ', req.user)
    // if project doesn't exist we will create a new one
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: req.body.projectName,
          userId: req.user.id, // Associate directly via userId
        },
      });
    }
    project = await prisma.project.update({
      where: { id: project.id },
      data: { owner:{connect:{id:req.user.id}}  },
    });
    evaluation = await prisma.evaluation.create({
      data: {
        projectId: project.id,
        score: [0, 0, 0, 0],
        principleScores: {
          "Benefits to Society & Public Engagement": { totalScore: 0, count: 0, avg: 0 },
          "Ethics & Governance": { totalScore: 0, count: 0, avg: 0 },
          "Privacy & Security": { totalScore: 0, count: 0, avg: 0 },
          "Fairness, Gender Equality & Inclusivity": { totalScore: 0, count: 0, avg: 0 },
          "Responsiveness, Transparency & Accountability": { totalScore: 0, count: 0, avg: 0 },
          "Human Agency & Oversight": { totalScore: 0, count: 0, avg: 0 },
          "Open Access": { totalScore: 0, count: 0, avg: 0 },
        },
        questionScores: {},
        description: req.body.projectAnswers.answers[0].score
      },
    });

    const answers = req.body.projectAnswers.answers;

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

    // Calculate scores based on the answers
    const projectscores = await calculateScores(evaluationAnswers);


    // Check if layerScoresArray and overallScore are valid
    let layerScoresArray = Object.values(projectscores?.layerScores || {}).map(entry => entry.totalScore * 100);
    if (layerScoresArray.some(isNaN)) {
      console.warn("layerScoresArray contains NaN values:", layerScoresArray);
    }

    layerScoresArray.push(projectscores.overallScore);
    const principleScores = projectscores.principleScores;
    const questionScores = projectscores.questionScores;
    if (layerScoresArray.some(isNaN)) {
      console.warn("layerScoresArray contains NaN values after adding overallScore:", layerScoresArray);
    }

    // Mark the evaluation as complete and update the score
    const updatedEvaluation = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        projectId: project.id,
        score: layerScoresArray,
        principleScores: principleScores,
        questionScores: questionScores,
        completedLayers: 1
      },
    });

    return res.status(200).send({
      message: "Submitted successfully",
      evaluation: updatedEvaluation,
      user: req.user
    });

  } catch (e) {
    console.log('error: ', e)
    return res.status(500).send({ error: e });
  }

}
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
      where: {
        id: parseInt(pid),
        project: {
          userId: user.id, // Ensure the user is the owner of the project or has the right role
        },
      },
      include: {
        answers: { include: { subQuestion: true } }
      },
    });

    if (!project) {
      return res.status(404).send({
        message: "Project not found"
      });
    }
    console.log('project1: ', project.description);

    // 1. define returned values
    // 2. checking user if he/she is allowed to request this evaluation
    // Return project data including answers and questions
    return res.status(200).send({
      project: {
        description: project.description,
        score: project.score,
        principleScores: project.principleScores,
        questionScores: project.questionScores,
        answers: project.answers,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
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
    const token = req.headers["authorization"];
    let user;

    // Check if the user exists, otherwise create an anonymous account
    if (!token) {
      const userAccount = await createAnonimousAccount();
      console.log("userAccount: ", userAccount);
      user = userAccount.user; // Get the user object
    } else {
      user = await verifyJWTToken(token);
    }

    if (!user || !user.id) {
      throw new Error("Failed to resolve a valid user for the project.");
    }

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
          userId: user?.id, // Associate directly via userId
        },
      });
    }

    // Check if an evaluation exists for the project and create one if needed
    let evaluation = await prisma.evaluation.findFirst({
      where: { projectId: project.id, completedLayers: 0 },
    });

    if (!evaluation) {
      const principleScores = {
        "Benefits to Society & Public Engagement": { totalScore: 0, count: 0, avg: 0 },
        "Ethics & Governance": { totalScore: 0, count: 0, avg: 0 },
        "Privacy & Security": { totalScore: 0, count: 0, avg: 0 },
        "Fairness, Gender Equality & Inclusivity": { totalScore: 0, count: 0, avg: 0 },
        "Responsiveness, Transparency & Accountability": { totalScore: 0, count: 0, avg: 0 },
        "Human Agency & Oversight": { totalScore: 0, count: 0, avg: 0 },
        "Open Access": { totalScore: 0, count: 0, avg: 0 },
      };

      evaluation = await prisma.evaluation.create({
        data: {
          projectId: project.id,
          score: [0, 0, 0, 0],
          principleScores: principleScores,
          questionScores: {},
        },
      });
    }

    return res.status(200).send({ message: `Let's proceed with ${projectName}.`, data: project });
  } catch (e) {
    console.error("Error in createProject:", e);
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
        const principleScores = projectscores?.principleScores ? projectscores.principleScores : {};
        const questionScores = projectscores?.questionScores ? projectscores?.questionScores : {};

        let layerScoresArray = projectscores?.layerScores ? Object.values(projectscores?.layerScores).map(entry => entry.totalScore * 100) : [0, 0, 0];

        layerScoresArray.push(projectscores?.overallScore ? projectscores.overallScore : 0);

        await prisma.evaluation.update({
          where: { id: evaluation?.id },
          data: {
            score: { set: layerScoresArray },
            principleScores: principleScores,
            questionScores: questionScores,
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
        where: { userId: user?.id },
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

// get a scpecific project
const getProject = async (req, res) => {
  try {
    let { pid } = req.params;

    let project;

    // Fetch the project evaluation by its ID, including answers to questions
    project = await prisma.project.findFirst({
      where: {
        id: parseInt(pid),
      },
    });
    if (!project) {
      return res.status(404).send({
        message: "Project not found"
      });
    }
    let evaluation = await prisma.evaluation.findFirst({
      where: {
        projectId: parseInt(pid),
      },
    });

    return res.status(200).send({
      project: {
        name: project.name,
        evaluations: [{
          id: evaluation.id,
          projectId: evaluation.projectId,
          description: evaluation.description,
          score: evaluation.score,
          startTime: evaluation.startTime,
          lastUpdateTime: evaluation.lastUpdateTime,
          completedLayers: evaluation.completedLayers
        }]
      }
    });
  } catch (e) {
    console.log('error in fetching a project: ', e)
    return res.status(500).send({ message: "Something went wrong." });
  }
};

// Submit answers for a project evaluation
const submitAnswers = async (req, res) => {
  try {
    const { answers, projectId } = req.body;
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
    const principleScores = projectscores.principleScores;
    const questionScores = projectscores.questionScores;
    if (layerScoresArray.some(isNaN)) {
      console.warn("layerScoresArray contains NaN values after adding overallScore:", layerScoresArray);
    }

    // Mark the evaluation as complete and update the score
    const updatedEvaluation = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        score: { set: layerScoresArray }, // Use `set` to replace the entire array
        principleScores: principleScores,
        questionScores: questionScores,
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
  submitAuth,
  getProject
};
