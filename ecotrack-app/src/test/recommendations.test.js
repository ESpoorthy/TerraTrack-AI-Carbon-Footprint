import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Recommendation prioritization logic
 * Mirrors the sort used in Dashboard.jsx / gemini fallback
 */
function sortRecommendationsByPriority(recommendations) {
  return [...recommendations].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

function sortRecommendationsBySavings(recommendations) {
  return [...recommendations].sort((a, b) => b.estimatedSavings - a.estimatedSavings);
}

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('recommendation sorting', () => {
  const recs = [
    { category: 'water', action: 'Shorter showers', estimatedSavings: 10, difficulty: 'easy', priority: 1 },
    { category: 'transport', action: 'Take the bus', estimatedSavings: 50, difficulty: 'medium', priority: 5 },
    { category: 'food', action: 'Less meat', estimatedSavings: 40, difficulty: 'medium', priority: 3 },
  ];

  it('sortByPriority puts highest priority first', () => {
    const sorted = sortRecommendationsByPriority(recs);
    expect(sorted[0].priority).toBe(5);
    expect(sorted[sorted.length - 1].priority).toBe(1);
  });

  it('sortBySavings puts highest savings first', () => {
    const sorted = sortRecommendationsBySavings(recs);
    expect(sorted[0].estimatedSavings).toBe(50);
    expect(sorted[sorted.length - 1].estimatedSavings).toBe(10);
  });

  it('does not mutate original array', () => {
    const original = [...recs];
    sortRecommendationsByPriority(recs);
    expect(recs).toEqual(original);
  });

  it('handles empty array', () => {
    expect(sortRecommendationsByPriority([])).toHaveLength(0);
    expect(sortRecommendationsBySavings([])).toHaveLength(0);
  });

  it('handles single item', () => {
    const single = [recs[0]];
    expect(sortRecommendationsByPriority(single)).toHaveLength(1);
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 12: recommendation prioritization', () => {
  const recArb = fc.record({
    category: fc.constantFrom('transport', 'electricity', 'food', 'shopping', 'water'),
    action: fc.string({ minLength: 5, maxLength: 50 }),
    estimatedSavings: fc.float({ min: 0, max: 200, noNaN: true }),
    difficulty: fc.constantFrom('easy', 'medium', 'hard'),
    priority: fc.integer({ min: 1, max: 5 }),
  });

  it('sorted list is always in descending priority order', () => {
    fc.assert(
      fc.property(fc.array(recArb, { minLength: 0, maxLength: 20 }), (recs) => {
        const sorted = sortRecommendationsByPriority(recs);
        for (let i = 0; i < sorted.length - 1; i++) {
          if ((sorted[i].priority || 0) < (sorted[i + 1].priority || 0)) return false;
        }
        return true;
      })
    );
  });

  it('sorted list contains same number of items as input', () => {
    fc.assert(
      fc.property(fc.array(recArb, { minLength: 0, maxLength: 20 }), (recs) => {
        return sortRecommendationsByPriority(recs).length === recs.length;
      })
    );
  });

  it('sorted list contains same items (just reordered)', () => {
    fc.assert(
      fc.property(fc.array(recArb, { minLength: 0, maxLength: 10 }), (recs) => {
        const sorted = sortRecommendationsByPriority(recs);
        const originalActions = recs.map(r => r.action).sort();
        const sortedActions = sorted.map(r => r.action).sort();
        return JSON.stringify(originalActions) === JSON.stringify(sortedActions);
      })
    );
  });

  it('savings-sorted list is always in descending savings order', () => {
    fc.assert(
      fc.property(fc.array(recArb, { minLength: 0, maxLength: 20 }), (recs) => {
        const sorted = sortRecommendationsBySavings(recs);
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].estimatedSavings < sorted[i + 1].estimatedSavings) return false;
        }
        return true;
      })
    );
  });
});
