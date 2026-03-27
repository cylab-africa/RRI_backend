/**
 * Tests for the calculateScores pipeline.
 *
 * BUG FIX: Previously imported from '../src/utilities/score' — wrong path
 * (this file is already inside src/utilities/tests/). Corrected to '../score'.
 *
 * Mocks the shared Prisma singleton instead of creating a new PrismaClient.
 */

// Mock the shared Prisma singleton before importing score.js
jest.mock('../../db/prismaClient', () => {
  return {
    question: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    principle: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    layer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };
});

const prisma = require('../../db/prismaClient');
const { calculateScores } = require('../score');

// ── Test data ─────────────────────────────────────────────────────
const mockLayer1 = { id: 1, name: "LAYER 1", order: 1, weight: 0.346 };
const mockLayer2 = { id: 2, name: "LAYER 2", order: 2, weight: 0.331 };
const mockLayer3 = { id: 3, name: "LAYER 3", order: 3, weight: 0.323 };

const mockPrinciples = [
  { id: 1, name: "Benefits to Society & Public Engagement", weight: 0.319, layerId: 1, layer: mockLayer1 },
  { id: 2, name: "Ethics & Governance", weight: 0.339, layerId: 1, layer: mockLayer1 },
  { id: 3, name: "Privacy & Security", weight: 0.342, layerId: 1, layer: mockLayer1 },
  { id: 4, name: "Fairness, Gender Equality & Inclusivity", weight: 0.488, layerId: 2, layer: mockLayer2 },
  { id: 5, name: "Responsiveness, Transparency & Accountability", weight: 0.512, layerId: 2, layer: mockLayer2 },
  { id: 6, name: "Human Agency & Oversight", weight: 0.7, layerId: 3, layer: mockLayer3 },
  { id: 7, name: "Open Access", weight: 0.3, layerId: 3, layer: mockLayer3 },
];

const mockQuestions = [
  {
    id: 1, number: 1, text: "What societal problem does your innovation address?",
    principleId: 1, principle: mockPrinciples[0],
    subQuestions: [{ id: 1 }, { id: 2 }],
  },
  {
    id: 2, number: 3, text: "Can you provide insights into the ethical considerations?",
    principleId: 2, principle: mockPrinciples[1],
    subQuestions: [{ id: 3 }, { id: 4 }],
  },
];

describe('calculateScores', () => {
  beforeEach(() => {
    // loadReferenceData makes two parallel queries
    prisma.question.findMany.mockResolvedValue(mockQuestions);
    prisma.principle.findMany.mockResolvedValue(mockPrinciples);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return null for null input', async () => {
    const result = await calculateScores(null);
    expect(result).toBeNull();
  });

  it('should return null for empty array', async () => {
    const result = await calculateScores([]);
    expect(result).toBeNull();
  });

  it('should return scores object with correct structure', async () => {
    const subquestionScores = [
      { score: 8, subQuestion: { id: 1, questionId: 1 } },
      { score: 7, subQuestion: { id: 2, questionId: 1 } },
      { score: 9, subQuestion: { id: 3, questionId: 2 } },
      { score: 6, subQuestion: { id: 4, questionId: 2 } },
    ];

    const result = await calculateScores(subquestionScores);

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('questionScores');
    expect(result).toHaveProperty('principleScores');
    expect(result).toHaveProperty('layerScores');
    expect(result).toHaveProperty('overallScore');
  });

  it('should calculate correct question averages', async () => {
    const subquestionScores = [
      { score: 8, subQuestion: { id: 1, questionId: 1 } },
      { score: 6, subQuestion: { id: 2, questionId: 1 } },
    ];

    const result = await calculateScores(subquestionScores);

    const q1Scores = result.questionScores["What societal problem does your innovation address?"];
    expect(q1Scores.avg).toBe(7); // (8+6)/2
    expect(q1Scores.count).toBe(2);
    expect(q1Scores.totalScore).toBe(14);
  });

  it('should produce a numeric overall score', async () => {
    const subquestionScores = [
      { score: 10, subQuestion: { id: 1, questionId: 1 } },
      { score: 10, subQuestion: { id: 3, questionId: 2 } },
    ];

    const result = await calculateScores(subquestionScores);

    expect(typeof result.overallScore).toBe('number');
    expect(result.overallScore).toBeGreaterThan(0);
    expect(isNaN(result.overallScore)).toBe(false);
  });
});
