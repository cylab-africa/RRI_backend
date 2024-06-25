const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createQuestions = async () => {
  let questions = [
    {
      id: 1,
      layerId: 1,
      question:
        "What societal problem does your innovation address, and how does it positively impact the local community or society as a whole?",
      subquestions: [
        {
          id: 1,
          type: "text",
          weight: 5,
          questionText:
            "Briefly describe the societal problem that your innovation or research project addresses and how it positively impacts the local community or society as a whole.",
        },
        {
          id: 2,
          type: "scale",
          weight: 5,
          questionText:
            "How well does your research or innovation project positively impact the local community or society as a whole?",
        },
      ],
    },
    {
      id: 2,
      layerId: 1,
      question:
        "How do you involve the local community in the design and implementation of your innovation to ensure their needs and perspectives are considered?",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 10,
          questionText:
            "You involve the local community in the design and implementation of your innovation to ensure their needs and perspectives are considered.",
        },
      ],
    },
    {
      id: 3,
      layerId: 1,
      question:
        "Can you provide insights into the ethical considerations that have guided the development and deployment of your innovation?",
      subquestions: [
        {
          id: 1,
          type: "scale",
          weight: 7,
          questionText:
            "How well do you consider ethical concerns in the development of your innovation?",
        },
        {
          id: 2,
          type: "scale",
          weight: 3,
          questionText:
            "How well do you consider ethical concerns in the deployment of your innovation?.",
        },
      ],
    },
    {
      id: 4,
      layerId: 1,
      question:
        "What governance mechanisms are in place to ensure responsible decision-making and compliance with relevant regulations and ethical guidelines?",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 10,
          questionText:
            "We have implemented governance mechanisms to ensure responsible decision-making and compliance with relevant regulations and ethical guidelines.",
        },
      ],
    },
    {
      id: 5,
      layerId: 1,
      question:
        "How do you protect the privacy and security of individuals' data collected by your innovation, including obtaining consent and preventing unauthorized access?",
      subquestions: [
        {
          id: 1,
          type: "scale",
          weight: 2.5,
          questionText:
            "How well do you protect the privacy of individuals’ data collected by your innovation or research project?",
        },
        {
          id: 2,
          type: "choice",
          weight: 2.5,
          questionText:
            "You ensure that you obtain informed consent before collecting data from individuals.",
        },
        {
          id: 3,
          type: "choice",
          weight: 2.5,
          questionText:
            "You implement security mechanisms to prevent unauthorized access to data.",
        },
        {
          id: 4,
          type: "choice",
          weight: 2.5,
          questionText:
            "You implement security mechanisms to protect individuals’ data at rest and on transit.",
        },
      ],
    },
    {
      id: 6,
      layerId: 1,
      question:
        "In case of security incidents or breaches, how do you handle and communicate such events transparently to affected parties and stakeholders?",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 5,
          questionText:
            "You transparently communicate security incidents and breaches  to affected parties and stakeholders.",
        },
        {
          id: 2,
          type: "choice",
          weight: 5,
          questionText:
            "You transparently handle security incidents and breaches  with affected parties and stakeholders.",
        },
      ],
    },

    {
      id: 7,
      layerId: 2,
      question:
        "What steps do you take to identify and address biases in data collection, analysis, and interpretation to ensure fair and equitable outcomes?",
      subquestions: [
        {
          id: 1,
          type: "scale",
          weight: 10,
          questionText:
            "How well do you take steps to identify and address biases in data collection, analysis, and interpretation to ensure fair and equitable outcomes?",
        },
      ],
    },
    {
      id: 8,
      layerId: 2,
      question:
        "What is your long-term vision for the innovation, and how do you plan to scale it up or replicate it across different regions in sub-Saharan Africa while maintaining its sustainability?",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 10,
          questionText:
            "We plan to scale up or replicate our innovation or research project across different regions in sub-Saharan Africa while maintaining its sustainability.",
        },
      ],
    },
    {
      id: 9,
      layerId: 2,
      question:
        "How do you ensure that your innovation is accessible and affordable to individuals and communities, especially those in remote or underserved areas?",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 10,
          questionText:
            "We plan to ensure that your innovation or research project is accessible and affordable to individuals and communities, especially those in remote or underserved areas.",
        },
      ],
    },
    {
      id: 10,
      layerId: 2,
      question:
        "In what ways does your innovation incorporate inclusivity, considering the needs and perspectives of individuals with disabilities or those from different cultural backgrounds?",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 10,
          questionText:
            "Your  innovation or research project incorporates inclusivity and considers the needs and perspectives of individuals with disabilities or those from different cultural backgrounds.",
        },
      ],
    },
    {
      id: 11,
      layerId: 2,
      question:
        "What accountability mechanisms are in place to ensure that your innovation's outcomes and consequences are tracked, evaluated, and communicated to relevant stakeholders?",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 10,
          questionText:
            "You have put in place accountability mechanisms to ensure that your innovation or research project's outcomes and consequences are tracked, evaluated, and communicated to relevant stakeholders.",
        },
      ],
    },
    {
      id: 12,
      layerId: 2,
      question:
        "How do you ensure that your innovation's data and findings are accessible and understandable to individuals from diverse educational and linguistic backgrounds?",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 10,
          questionText:
            "You ensure that your innovation or research project's data and findings are accessible and understandable to individuals from diverse educational and linguistic backgrounds.",
        },
      ],
    },

    {
      id: 13,
      layerId: 3,
      question:
        "How do you ensure that individuals and communities have the necessary information and autonomy to make informed decisions about their participation in and interactions with your innovation.",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 10,
          questionText:
            "You ensure that individuals and communities have the necessary information and autonomy to make informed decisions about their participation in and interactions with your innovation or research project.",
        },
      ],
    },
    {
      id: 14,
      layerId: 3,
      question:
        "How do you ensure that human values and ethical considerations are integrated into the development and deployment of the innovation, and that these values guide its decision-making processes?",
      subquestions: [
        {
          id: 1,
          type: "choice",
          weight: 10,
          questionText:
            "You ensure that human values and ethical considerations are integrated into the development and deployment of the innovation, and that these values guide its decision-making processes.",
        },
      ],
    },
  ];

  questions.forEach(async (question) => {
    let layers = await prisma.layer.findMany({});
    let layerId = layers[0].id;
    if (question.layerId === 2) {
      layerId = layers[1].id;
    } else if (question.layerId === 3) {
      layerId = layers[2].id;
    }
    const que = await prisma.question.create({
      data: {
        number: question.id,
        question: question.question,
        layerId: layerId,
      },
    });

    question.subquestions.forEach(async (subQuestion) => {
      await prisma.subQuestion.create({
        data: {
          questionId: que.id,
          questionText: subQuestion.questionText,
          type: subQuestion.type,
          weight: subQuestion.weight,
        },
      });
    });
  });
};

const addLayers = async () => {
  const layer1 = await prisma.layer.create({
    data: { name: "LAYER 1", value: 1 },
  });
  const layer2 = await prisma.layer.create({
    data: { name: "LAYER 2", value: 2 },
  });
  const layer3 = await prisma.layer.create({
    data: { name: "LAYER 3", value: 3 },
  });
};

const deleteBD = async () => {
  await prisma.answer.deleteMany({});
  await prisma.subQuestion.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.layer.deleteMany({});
  await prisma.evaluation.updateMany({ data: { layersDone: 0 } });
};

const reInitBD = async () => {
  console.info("Re initializing the DB .....");
  // Delete questions and layers
  await deleteBD();
  // Add layers
  await addLayers();
  // Add questions
  await createQuestions();
  console.info("DB Init Finished .....");
};

// Re init the DB ...
reInitBD();
