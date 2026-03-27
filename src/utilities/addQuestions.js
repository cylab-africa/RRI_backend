const prisma = require("../db/prismaClient");

// Function to add layers and principles to the database
const addLayersAndPrinciples = async () => {
  const layer1 = await prisma.layer.create({
    data: { name: "LAYER 1", order: 1, weight: 0.346 },
  });

  await prisma.principle.createMany({
    data: [
      { name: "Benefits to Society & Public Engagement", weight: 0.319, layerId: layer1.id },
      { name: "Ethics & Governance", weight: 0.339, layerId: layer1.id },
      { name: "Privacy & Security", weight: 0.342, layerId: layer1.id },
    ],
  });

  const layer2 = await prisma.layer.create({
    data: { name: "LAYER 2", order: 2, weight: 0.331 },
  });

  await prisma.principle.createMany({
    data: [
      { name: "Fairness, Gender Equality & Inclusivity", weight: 0.488, layerId: layer2.id },
      { name: "Responsiveness, Transparency & Accountability", weight: 0.512, layerId: layer2.id },
    ],
  });

  const layer3 = await prisma.layer.create({
    data: { name: "LAYER 3", order: 3, weight: 0.323 },
  });

  await prisma.principle.createMany({
    data: [
      { name: "Human Agency & Oversight", weight: 0.7, layerId: layer3.id },
      { name: "Open Access", weight: 0.3, layerId: layer3.id },
    ],
  });
};

// Function to create questions and subquestions in the database
const createQuestions = async () => {
  const principles = await prisma.principle.findMany({});

  const questions = [
    {
      number: 1,
      principleName: "Benefits to Society & Public Engagement",
      questionText: "What societal problem does your innovation address, and how does it positively impact the local community or society as a whole?",
      subquestions: [
        { type: "text", questionText: "Briefly describe the societal problem that your innovation or research project addresses." },
        { type: "scale", questionText: "How well does your research or innovation project positively impact the local community or society as a whole?" },
      ],
    },
    {
      number: 2,
      principleName: "Benefits to Society & Public Engagement",
      questionText: "How do you involve the local community in the design and implementation of your innovation to ensure their needs and perspectives are considered?",
      subquestions: [
        { type: "choice", questionText: "You involve the local community in the design and implementation of your innovation to ensure their needs and perspectives are considered." },
      ],
    },
    {
      number: 3,
      principleName: "Ethics & Governance",
      questionText: "Can you provide insights into the ethical considerations that have guided the development and deployment of your innovation?",
      subquestions: [
        { type: "scale", questionText: "How well do you consider ethical concerns in the development of your innovation?" },
        { type: "scale", questionText: "How well do you consider ethical concerns in the deployment of your innovation?" },
      ],
    },
    {
      number: 4,
      principleName: "Ethics & Governance",
      questionText: "What governance mechanisms are in place to ensure responsible decision-making and compliance with relevant regulations and ethical guidelines?",
      subquestions: [
        { type: "choice", questionText: "We have implemented governance mechanisms to ensure responsible decision-making and compliance with relevant regulations and ethical guidelines." },
      ],
    },
    {
      number: 5,
      principleName: "Privacy & Security",
      questionText: "How do you protect the privacy and security of individuals' data collected by your innovation, including obtaining consent and preventing unauthorized access?",
      subquestions: [
        { type: "scale", questionText: "How well do you protect the privacy of individuals' data collected by your innovation or research project?" },
        { type: "choice", questionText: "You ensure that you obtain informed consent before collecting data from individuals." },
        { type: "choice", questionText: "You implement security mechanisms to prevent unauthorized access to data." },
        { type: "choice", questionText: "You implement security mechanisms to protect individuals' data at rest and in transit." },
      ],
    },
    {
      number: 6,
      principleName: "Privacy & Security",
      questionText: "In case of security incidents or breaches, how do you handle and communicate such events transparently to affected parties and stakeholders?",
      subquestions: [
        { type: "choice", questionText: "You transparently communicate security incidents and breaches to affected parties and stakeholders." },
        { type: "choice", questionText: "You transparently handle security incidents and breaches with affected parties and stakeholders." },
      ],
    },
    {
      number: 7,
      principleName: "Fairness, Gender Equality & Inclusivity",
      questionText: "What steps do you take to identify and address biases in data collection, analysis, and interpretation to ensure fair and equitable outcomes?",
      subquestions: [
        { type: "scale", questionText: "How well do you take steps to identify and address biases in data collection, analysis, and interpretation to ensure fair and equitable outcomes?" },
      ],
    },
    {
      number: 8,
      principleName: "Fairness, Gender Equality & Inclusivity",
      questionText: "How do you ensure that your innovation is accessible and affordable to individuals and communities, especially those in remote or underserved areas?",
      subquestions: [
        { type: "choice", questionText: "We plan to ensure that your innovation or research project is accessible and affordable to individuals and communities, especially those in remote or underserved areas." },
      ],
    },
    {
      number: 9,
      principleName: "Fairness, Gender Equality & Inclusivity",
      questionText: "In what ways does your innovation incorporate inclusivity, considering the needs and perspectives of individuals with disabilities or those from different cultural backgrounds?",
      subquestions: [
        { type: "choice", questionText: "Your innovation or research project incorporates inclusivity and considers the needs and perspectives of individuals with disabilities or those from different cultural backgrounds." },
      ],
    },
    {
      number: 10,
      principleName: "Responsiveness, Transparency & Accountability",
      questionText: "What accountability mechanisms are in place to ensure that your innovation's outcomes and consequences are tracked, evaluated, and communicated to relevant stakeholders?",
      subquestions: [
        { type: "choice", questionText: "You have put in place accountability mechanisms to ensure that your innovation or research project's outcomes and consequences are tracked, evaluated, and communicated to relevant stakeholders." },
      ],
    },
    {
      number: 11,
      principleName: "Responsiveness, Transparency & Accountability",
      questionText: "How do you ensure that your innovation's data and findings are accessible and understandable to individuals from diverse educational and linguistic backgrounds?",
      subquestions: [
        { type: "choice", questionText: "You ensure that your innovation or research project's data and findings are accessible and understandable to individuals from diverse educational and linguistic backgrounds." },
      ],
    },
    {
      number: 12,
      principleName: "Human Agency & Oversight",
      questionText: "How do you ensure that individuals and communities have the necessary information and autonomy to make informed decisions about their participation in and interactions with your innovation?",
      subquestions: [
        { type: "choice", questionText: "You ensure that individuals and communities have the necessary information and autonomy to make informed decisions about their participation in and interactions with your innovation or research project." },
      ],
    },
    {
      number: 13,
      principleName: "Human Agency & Oversight",
      questionText: "How do you ensure that human values and ethical considerations are integrated into the development and deployment of the innovation, and that these values guide its decision-making processes?",
      subquestions: [
        { type: "choice", questionText: "You ensure that human values and ethical considerations are integrated into the development and deployment of the innovation, and that these values guide its decision-making processes." },
      ],
    },
    {
      number: 14,
      principleName: "Open Access",
      questionText: "How do you ensure that the data, findings, and outcomes of your innovation are openly accessible to the public, and that they contribute to a broader knowledge base?",
      subquestions: [
        { type: "choice", questionText: "You ensure that the data, findings, and outcomes of your innovation are openly accessible to the public and contribute to a broader knowledge base." },
      ],
    },
  ];

  for (const question of questions) {
    const principle = principles.find((p) => p.name === question.principleName);
    if (principle) {
      const createdQuestion = await prisma.question.create({
        data: {
          number: question.number,
          text: question.questionText,
          principleId: principle.id,
        },
      });

      for (const subquestion of question.subquestions) {
        await prisma.subQuestion.create({
          data: {
            questionId: createdQuestion.id,
            text: subquestion.questionText,
            type: subquestion.type,
          },
        });
      }
    } else {
      console.warn(`Principle not found: ${question.principleName}`);
    }
  }
};

/**
 * Delete all data in the correct FK-safe order.
 *
 * FIX: The old order deleted layers before evaluations/projects,
 * which works by luck but is fragile. This order follows the
 * dependency chain strictly: leaf tables first, root tables last.
 */
const deleteDB = async () => {
  console.info("  Deleting existing data...");
  await prisma.answer.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.subQuestion.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.principle.deleteMany({});
  await prisma.layer.deleteMany({});
  await prisma.project.deleteMany({});
  console.info("  Existing data deleted.");
};

const reInitDB = async () => {
  console.info("Reinitializing the DB...");
  await deleteDB();
  await addLayersAndPrinciples();
  await createQuestions();
  console.info("DB Init Finished.");
};

module.exports = { reInitDB };

// ── Run when called directly (not when imported) ────────────────
// FIX: The old code called reInitDBSH() without error handling.
// If it failed, Node exited silently and the entrypoint script
// thought seeding succeeded.
if (require.main === module) {
  reInitDB()
  .then(() => {
    console.info("Seed completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("SEED FAILED:", err);
    process.exit(1);
  });
}
