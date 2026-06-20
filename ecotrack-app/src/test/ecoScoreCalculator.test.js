import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateEcoScore,
  classifyEcoScore,
  getScoreMessage,
  getScoreColor,
} from '../services/ecoScoreCalculator';
import { REFERENCE_FOOTPRINTS } from '../utils/emissions';

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('classifyEcoScore', () => {
  it('classifies 95 as Green Hero', () => {
    expect(classifyEcoScore(95)).toBe('Green Hero');
  });

  it('classifies 90 as Green Hero', () => {
    expect(classifyEcoScore(90)).toBe('Green Hero');
  });

  it('classifies 75 as Eco Friendly', () => {
    expect(classifyEcoScore(75)).toBe('Eco Friendly');
  });

  it('classifies 55 as Needs Improvement', () => {
    expect(classifyEcoScore(55)).toBe('Needs Improvement');
  });

  it('classifies 30 as High Impact', () => {
    expect(classifyEcoScore(30)).toBe('High Impact');
  });

  it('classifies 0 as High Impact', () => {
    expect(classifyEcoScore(0)).toBe('High Impact');
  });
});

describe('getScoreMessage', () => {
  it('returns a non-empty string for each classification', () => {
    ['Green Hero', 'Eco Friendly', 'Needs Improvement', 'High Impact'].forEach(c => {
      expect(getScoreMessage(c)).toBeTruthy();
      expect(typeof getScoreMessage(c)).toBe('string');
    });
  });

  it('returns empty string for unknown classification', () => {
    expect(getScoreMessage('Unknown')).toBe('');
  });
});

describe('getScoreColor', () => {
  it('returns a hex color for each classification', () => {
    ['Green Hero', 'Eco Friendly', 'Needs Improvement', 'High Impact'].forEach(c => {
      const color = getScoreColor(c);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('calculateEcoScore', () => {
  it('returns score of 100 for footprint at or below excellent threshold', () => {
    const result = calculateEcoScore(REFERENCE_FOOTPRINTS.excellent);
    expect(result.score).toBe(100);
    expect(result.classification).toBe('Green Hero');
  });

  it('returns score < 100 for footprint significantly above excellent threshold', () => {
    const result = calculateEcoScore(REFERENCE_FOOTPRINTS.excellent + 50);
    expect(result.score).toBeLessThan(100);
  });

  it('score is lower for higher footprint', () => {
    const low = calculateEcoScore(100);
    const high = calculateEcoScore(800);
    expect(low.score).toBeGreaterThan(high.score);
  });

  it('score is always in [0, 100]', () => {
    [0, 100, 500, 1000, 5000, 10000].forEach(fp => {
      const { score } = calculateEcoScore(fp);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it('handles 0 footprint returning score 100', () => {
    expect(calculateEcoScore(0).score).toBe(100);
  });

  it('handles negative footprint gracefully (treats as 0)', () => {
    const result = calculateEcoScore(-100);
    expect(result.score).toBe(100);
  });

  it('returns all required fields', () => {
    const result = calculateEcoScore(400);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('classification');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('color');
  });

  it('color matches classification color', () => {
    const result = calculateEcoScore(100);
    expect(result.color).toBe(getScoreColor(result.classification));
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property: eco score', () => {
  it('Property 9: score is always within [0, 100] for any non-negative footprint', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 50000, noNaN: true }),
        (footprint) => {
          const { score } = calculateEcoScore(footprint);
          return score >= 0 && score <= 100;
        }
      )
    );
  });

  it('Property 9b: higher footprint never produces higher score', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 5000, noNaN: true }),
        fc.float({ min: 0, max: 5000, noNaN: true }),
        (a, b) => {
          if (a > b) {
            return calculateEcoScore(a).score <= calculateEcoScore(b).score;
          }
          return true;
        }
      )
    );
  });

  it('Property 9c: classification is always one of the 4 known tiers', () => {
    const validTiers = new Set(['Green Hero', 'Eco Friendly', 'Needs Improvement', 'High Impact']);
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000, noNaN: true }),
        (fp) => validTiers.has(calculateEcoScore(fp).classification)
      )
    );
  });
});
