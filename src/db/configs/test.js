const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createEvaluation() {
  try {
    const evaluation = await prisma.evaluation.create({
      data: {
        projectId: 2, // Replace with a valid projectId
        score: [0, 0, 0, 0],
        principleScores: {
          "Benefits to Society & Public Engagement": { totalScore: 0, count: 0, avg: 0 },
          "Ethics & Governance": { totalScore: 0, count: 0, avg: 0 },
          "Privacy & Security": { totalScore: 0, count: 0, avg: 0 },
          "Fairness, Gender Equality & Inclusivity": { totalScore: 0, count: 0, avg: 0 },
          "Responsiveness, Transparency & Accountability": { totalScore: 0, count: 0, avg: 0 },
          "Human Agency & Oversight": { totalScore: 0, count: 0, avg: 0 },
          "Open Access": { totalScore: 0, count: 0, avg: 0 }
        }
      }
    });

    console.log(evaluation); // This should now log the created evaluation object
  } catch (error) {
    console.error('Error creating evaluation:', error);
  }
}

createEvaluation();
