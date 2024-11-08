const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  getPrincipleWeightFromDB,
  getLayerWeightFromDB,
  calculateAverageScorePerPrinciple,
  calculateLayerScores,
  calculateOverallScore,
  calculateScores
} = require('../src/utilities/score');

// Mock PrismaClient's methods
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      principle: {
        findUnique: jest.fn()
      },
      layer: {
        findUnique: jest.fn(),
        findMany: jest.fn()
      },
      question: {
        findMany: jest.fn()
      }
    }))
  };
});

describe('Score Functions Tests', () => {
  beforeAll(() => {
    // Mock the Prisma methods
    prisma.principle.findUnique.mockResolvedValue({
      weight: 0.5
    });
    prisma.layer.findUnique.mockResolvedValue({
      weight: 0.8
    });
    prisma.question.findMany.mockResolvedValue([
      {
        id: 1,
        principle: { name: 'Principle 1', id: 1 },
        subQuestions: [{ id: 1, score: 5 }]
      },
      {
        id: 2,
        principle: { name: 'Principle 2', id: 2 },
        subQuestions: [{ id: 2, score: 4 }]
      }
    ]);
    prisma.layer.findMany.mockResolvedValue([
      {
        id: 1,
        order: 1,
        principles: [{ name: 'Principle 1', id: 1 }, { name: 'Principle 2', id: 2 }]
      }
    ]);
  });

  // Test getPrincipleWeightFromDB function
  describe('getPrincipleWeightFromDB', () => {
    it('should return the correct weight for a given principle', async () => {
      const weight = await getPrincipleWeightFromDB(1); // Test with principle ID 1
      expect(weight).toBe(0.5); // Assuming the mocked response has weight 0.5
    });

    it('should return 0 if principle is not found', async () => {
      prisma.principle.findUnique.mockResolvedValue(null); // Simulate not finding the principle
      const weight = await getPrincipleWeightFromDB(999); // Non-existent principle ID
      expect(weight).toBe(0); // Should return 0
    });
  });

  // Test getLayerWeightFromDB function
  describe('getLayerWeightFromDB', () => {
    it('should return the correct weight for a given layer', async () => {
      const weight = await getLayerWeightFromDB(1); // Test with layer ID 1
      expect(weight).toBe(0.8); // Assuming the mocked response has weight 0.8
    });

    it('should return 0 if layer is not found', async () => {
      prisma.layer.findUnique.mockResolvedValue(null); // Simulate not finding the layer
      const weight = await getLayerWeightFromDB(999); // Non-existent layer ID
      expect(weight).toBe(0); // Should return 0
    });
  });

  // Test calculateAverageScorePerPrinciple function
  describe('calculateAverageScorePerPrinciple', () => {
    it('should calculate average score per principle', async () => {
      const subquestionScores = [
        { question: { questionId: 1 }, score: 5 },
        { question: { questionId: 2 }, score: 4 }
      ];

      const avgScores = await calculateAverageScorePerPrinciple(subquestionScores);
      
      // Assuming 5 for Principle 1 and 4 for Principle 2
      expect(avgScores['Principle 1']).toBe(5 * 0.5); // Applying weight of 0.5
      expect(avgScores['Principle 2']).toBe(4 * 0.5); // Applying weight of 0.5
    });
  });

  // Test calculateLayerScores function
  describe('calculateLayerScores', () => {
    it('should calculate scores for each layer', async () => {
      const principleScores = {
        'Principle 1': 2.5,
        'Principle 2': 2.0
      };

      const layerScores = await calculateLayerScores(principleScores);

      // Mocked layer weight = 0.8
      expect(layerScores[1]).toBe((2.5 + 2.0) * 0.8); // Layer score calculation
    });
  });

  // Test calculateOverallScore function
  describe('calculateOverallScore', () => {
    it('should calculate the overall score', async () => {
      const layerScores = { 1: 5 };

      const overallScore = await calculateOverallScore(layerScores);

      expect(overallScore).toBe(5 * 100); // Assuming layer score is 5, final score = 5 * 100
    });
  });

  // Test calculateScores function
  describe('calculateScores', () => {
    it('should calculate all scores correctly', async () => {
      const subquestionScores = [
        { question: { questionId: 1 }, score: 5 },
        { question: { questionId: 2 }, score: 4 }
      ];

      const scores = await calculateScores(subquestionScores);

      // Check the structure of the result
      expect(scores).toHaveProperty('principleScores');
      expect(scores).toHaveProperty('layerScores');
      expect(scores).toHaveProperty('overallScore');
    });
  });
});
