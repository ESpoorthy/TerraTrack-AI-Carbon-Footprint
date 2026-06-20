import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateLevel,
  pointsToNextLevel,
  calculateProgressPercentage,
  checkAchievements,
} from '../services/progressTracker';
import { LEVEL_THRESHOLDS } from '../utils/emissions';

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('calculateLevel', () => {
  it('returns level 1 for 0 points', () => {
    const level = calculateLevel(0);
    expect(level.level).toBe(1);
    expect(level.title).toBe('Green Starter');
  });

  it('returns level 2 at exactly 100 points', () => {
    expect(calculateLevel(100).level).toBe(2);
  });

  it('returns level 3 at exactly 300 points', () => {
    expect(calculateLevel(300).level).toBe(3);
  });

  it('returns the max level for very high points', () => {
    const maxLevel = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const result = calculateLevel(maxLevel.minPoints + 10000);
    expect(result.level).toBe(maxLevel.level);
  });

  it('returns level 1 for negative points', () => {
    expect(calculateLevel(-50).level).toBe(1);
  });
});

describe('pointsToNextLevel', () => {
  it('returns 100 for 0 points (need 100 for level 2)', () => {
    expect(pointsToNextLevel(0)).toBe(100);
  });

  it('returns 0 at max level', () => {
    const maxPoints = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].minPoints;
    expect(pointsToNextLevel(maxPoints)).toBe(0);
  });

  it('returns correct remaining points mid-level', () => {
    // Level 2 starts at 100, level 3 starts at 300 — at 200 points need 100 more
    expect(pointsToNextLevel(200)).toBe(100);
  });
});

describe('calculateProgressPercentage', () => {
  it('returns 0 at the start of level 1', () => {
    expect(calculateProgressPercentage(0)).toBe(0);
  });

  it('returns 100 at max level', () => {
    const maxPoints = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].minPoints;
    expect(calculateProgressPercentage(maxPoints)).toBe(100);
  });

  it('returns 50 at midpoint of a level', () => {
    // Level 1: 0–100 points — midpoint is 50
    expect(calculateProgressPercentage(50)).toBe(50);
  });

  it('returns a value between 0 and 100', () => {
    [0, 50, 100, 250, 500, 900, 1500].forEach(pts => {
      const pct = calculateProgressPercentage(pts);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    });
  });
});

describe('checkAchievements', () => {
  it('awards first-challenge achievement when completedChallenges is 1', () => {
    const progress = { completedChallenges: 1, totalCO2Saved: 0, currentLevel: 1, achievements: [] };
    const awards = checkAchievements(progress);
    expect(awards.some(a => a.id === 'first-challenge')).toBe(true);
  });

  it('does not re-award first-challenge if already in achievements', () => {
    const progress = {
      completedChallenges: 1,
      totalCO2Saved: 0,
      currentLevel: 1,
      achievements: [{ id: 'first-challenge' }],
    };
    const awards = checkAchievements(progress);
    expect(awards.some(a => a.id === 'first-challenge')).toBe(false);
  });

  it('awards ten-challenges achievement at 10 completions', () => {
    const progress = { completedChallenges: 10, totalCO2Saved: 0, currentLevel: 1, achievements: [] };
    const awards = checkAchievements(progress);
    expect(awards.some(a => a.id === 'ten-challenges')).toBe(true);
  });

  it('awards hundred-kg-saved at 100kg saved', () => {
    const progress = { completedChallenges: 0, totalCO2Saved: 100, currentLevel: 1, achievements: [] };
    const awards = checkAchievements(progress);
    expect(awards.some(a => a.id === 'hundred-kg-saved')).toBe(true);
  });

  it('awards level-five achievement at level 5', () => {
    const progress = { completedChallenges: 0, totalCO2Saved: 0, currentLevel: 5, achievements: [] };
    const awards = checkAchievements(progress);
    expect(awards.some(a => a.id === 'level-five')).toBe(true);
  });

  it('returns empty array when no new achievements', () => {
    const progress = {
      completedChallenges: 0, totalCO2Saved: 0, currentLevel: 1,
      achievements: [],
    };
    expect(checkAchievements(progress)).toHaveLength(0);
  });

  it('returned achievements have required fields', () => {
    const progress = { completedChallenges: 1, totalCO2Saved: 0, currentLevel: 1, achievements: [] };
    const awards = checkAchievements(progress);
    awards.forEach(a => {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('title');
      expect(a).toHaveProperty('description');
      expect(a).toHaveProperty('icon');
    });
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property: progress tracker', () => {
  it('Property 13: calculateLevel always returns a valid level object', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (points) => {
        const level = calculateLevel(points);
        return (
          typeof level.level === 'number' &&
          level.level >= 1 &&
          typeof level.title === 'string' &&
          level.title.length > 0
        );
      })
    );
  });

  it('Property 14: pointsToNextLevel is always >= 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (points) => {
        return pointsToNextLevel(points) >= 0;
      })
    );
  });

  it('Property 15: progress percentage is always in [0, 100]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (points) => {
        const pct = calculateProgressPercentage(points);
        return pct >= 0 && pct <= 100;
      })
    );
  });

  it('Property 15b: more points never leads to lower level', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50000 }),
        fc.integer({ min: 1, max: 5000 }),
        (points, extra) => {
          return calculateLevel(points + extra).level >= calculateLevel(points).level;
        }
      )
    );
  });
});
