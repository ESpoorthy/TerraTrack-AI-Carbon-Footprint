import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ─── Mock Firebase ──────────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => null),
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-id' })),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  getDocs: vi.fn(() => Promise.resolve({ forEach: vi.fn() })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => new Date()),
}));

// Force firebase service to use localStorage fallback (db = null)
vi.mock('../services/firebaseService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // re-export but with db forced to null (localStorage path)
    initializeFirebase: () => null,
  };
});

import {
  saveActivityLog,
  getActivityLogs,
  updateUserProfile,
  getUserProfile,
  saveChallengeProgress,
  getChallengeHistory,
} from '../services/firebaseService';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('saveActivityLog (localStorage fallback)', () => {
  it('saves a log without throwing', async () => {
    await expect(
      saveActivityLog('user-1', {
        activityData: {},
        carbonFootprint: { total: 400, byCategory: {} },
        ecoScore: { score: 70 },
      })
    ).resolves.not.toThrow();
  });
});

describe('getActivityLogs (localStorage fallback)', () => {
  it('returns an array', async () => {
    const logs = await getActivityLogs('user-1', 5);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('returns saved log after saving', async () => {
    const userId = 'user-persist';
    await saveActivityLog(userId, {
      carbonFootprint: { total: 300, byCategory: {} },
      ecoScore: { score: 80 },
    });
    const logs = await getActivityLogs(userId, 10);
    expect(logs.length).toBeGreaterThan(0);
  });
});

describe('updateUserProfile (localStorage fallback)', () => {
  it('saves profile without throwing', async () => {
    await expect(
      updateUserProfile('user-2', { level: 2, points: 150 })
    ).resolves.not.toThrow();
  });
});

describe('getUserProfile (localStorage fallback)', () => {
  it('returns a default profile when none exists', async () => {
    const profile = await getUserProfile('brand-new-user');
    expect(profile).toHaveProperty('level');
    expect(profile).toHaveProperty('points');
  });

  it('returns saved profile data', async () => {
    await updateUserProfile('user-3', { level: 3, points: 400 });
    const profile = await getUserProfile('user-3');
    expect(profile.level).toBe(3);
    expect(profile.points).toBe(400);
  });
});

describe('saveChallengeProgress (localStorage fallback)', () => {
  it('saves challenge progress without throwing', async () => {
    await expect(
      saveChallengeProgress('user-4', {
        challengeId: 'ch-1',
        title: 'Bike Week',
        completed: true,
        points: 50,
      })
    ).resolves.not.toThrow();
  });
});

describe('getChallengeHistory (localStorage fallback)', () => {
  it('returns an array', async () => {
    const history = await getChallengeHistory('user-4');
    expect(Array.isArray(history)).toBe(true);
  });

  it('returns saved challenges', async () => {
    const userId = 'user-challenges';
    await saveChallengeProgress(userId, {
      challengeId: 'ch-2',
      title: 'Meatless Week',
      completed: true,
      points: 40,
    });
    const history = await getChallengeHistory(userId);
    expect(history.length).toBeGreaterThan(0);
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property: firebaseService data operations', () => {
  it('Property 5: saveActivityLog never throws for any numeric total', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 10000, noNaN: true }),
        async (total) => {
          await saveActivityLog('prop-user', {
            carbonFootprint: { total, byCategory: {} },
            ecoScore: { score: 50 },
          });
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('Property 18: getUserProfile always returns an object with level and points', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        async (userId) => {
          const profile = await getUserProfile(`prop-${userId}`);
          return (
            typeof profile === 'object' &&
            'level' in profile &&
            'points' in profile
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  it('Property 19: getActivityLogs always returns an array', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 20 }),
        async (userId, limitCount) => {
          const logs = await getActivityLogs(`prop-${userId}`, limitCount);
          return Array.isArray(logs);
        }
      ),
      { numRuns: 10 }
    );
  });
});
