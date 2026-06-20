import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateComparison,
  formatReportData,
} from '../services/reportGenerator';

// ─── Unit Tests ────────────────────────────────────────────────────────────────

const makeFootprint = (total) => ({
  total,
  byCategory: { transport: total * 0.4, electricity: total * 0.3, food: total * 0.2, shopping: total * 0.05, water: total * 0.05 },
});

describe('calculateComparison', () => {
  it('returns zero changes when no previous data', () => {
    const result = calculateComparison(makeFootprint(500), null);
    expect(result.percentChange).toBe(0);
    expect(result.absoluteChange).toBe(0);
    expect(result.improved).toBe(false);
  });

  it('detects improvement when current < previous', () => {
    const result = calculateComparison(makeFootprint(400), makeFootprint(500));
    expect(result.improved).toBe(true);
    expect(result.absoluteChange).toBeLessThan(0);
  });

  it('detects regression when current > previous', () => {
    const result = calculateComparison(makeFootprint(600), makeFootprint(500));
    expect(result.improved).toBe(false);
    expect(result.absoluteChange).toBeGreaterThan(0);
  });

  it('calculates percent change correctly', () => {
    const result = calculateComparison(makeFootprint(400), makeFootprint(500));
    // (400-500)/500 * 100 = -20%
    expect(result.percentChange).toBe(-20);
  });

  it('returns 0 percent change when previous total is 0', () => {
    const result = calculateComparison(makeFootprint(100), makeFootprint(0));
    expect(result.percentChange).toBe(0);
  });
});

describe('formatReportData', () => {
  const sampleReportData = {
    carbonFootprint: makeFootprint(500),
    ecoScore: { score: 75, classification: 'Eco Friendly' },
    recommendations: [
      { action: 'Take the bus', category: 'transport', estimatedSavings: 30, difficulty: 'easy' },
    ],
    progressData: {
      currentLevel: 2,
      levelTitle: 'Eco Learner',
      totalPoints: 150,
      completedChallenges: 3,
      totalCO2Saved: 45,
      achievements: [{ icon: '🌱', title: 'Getting Started', description: 'First challenge done' }],
    },
    comparisonPeriod: null,
    generatedAt: new Date('2026-01-01'),
  };

  it('returns a non-empty string', () => {
    const report = formatReportData(sampleReportData);
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });

  it('includes total emissions in report', () => {
    const report = formatReportData(sampleReportData);
    expect(report).toContain('500');
  });

  it('includes eco score in report', () => {
    const report = formatReportData(sampleReportData);
    expect(report).toContain('75');
    expect(report).toContain('Eco Friendly');
  });

  it('includes recommendation actions', () => {
    const report = formatReportData(sampleReportData);
    expect(report).toContain('Take the bus');
  });

  it('includes progress data', () => {
    const report = formatReportData(sampleReportData);
    expect(report).toContain('Eco Learner');
    expect(report).toContain('150');
  });

  it('includes achievements when present', () => {
    const report = formatReportData(sampleReportData);
    expect(report).toContain('Getting Started');
  });

  it('includes comparison when provided', () => {
    const data = {
      ...sampleReportData,
      comparisonPeriod: { percentChange: -20, absoluteChange: -100, improved: true },
    };
    const report = formatReportData(data);
    expect(report).toContain('decreased');
  });

  it('includes all category names', () => {
    const report = formatReportData(sampleReportData);
    expect(report).toContain('Transport');
    expect(report).toContain('Electricity');
    expect(report).toContain('Food');
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property: report generator', () => {
  it('Property 10: calculateComparison always returns numeric values', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000, noNaN: true }),
        fc.float({ min: 1, max: 10000, noNaN: true }),
        (current, previous) => {
          const curr = makeFootprint(current);
          const prev = makeFootprint(previous);
          const result = calculateComparison(curr, prev);
          return (
            typeof result.percentChange === 'number' &&
            typeof result.absoluteChange === 'number' &&
            typeof result.improved === 'boolean'
          );
        }
      )
    );
  });

  it('Property 16: formatReportData always returns a non-empty string for valid inputs', () => {
    const meatLevels = ['high', 'medium', 'low', 'none'];
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 2000, noNaN: true }),
        fc.integer({ min: 0, max: 100 }),
        (total, score) => {
          const data = {
            carbonFootprint: makeFootprint(total),
            ecoScore: { score, classification: 'Eco Friendly' },
            recommendations: [],
            progressData: {
              currentLevel: 1,
              levelTitle: 'Green Starter',
              totalPoints: 0,
              completedChallenges: 0,
              totalCO2Saved: 0,
              achievements: [],
            },
            comparisonPeriod: null,
            generatedAt: new Date(),
          };
          const report = formatReportData(data);
          return typeof report === 'string' && report.length > 0;
        }
      )
    );
  });
});
