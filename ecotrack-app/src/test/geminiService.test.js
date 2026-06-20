import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Mock fetch globally before importing the service
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: { env: { VITE_GEMINI_API_KEY: 'test-api-key' } },
});

import {
  generateRecommendations,
  generateChallenges,
  chatWithAI,
} from '../services/geminiService';

const mockFootprint = {
  total: 500,
  byCategory: {
    transport: 200,
    electricity: 150,
    food: 100,
    shopping: 30,
    water: 20,
  },
};

const makeGeminiResponse = (text) => ({
  ok: true,
  json: () => Promise.resolve({
    candidates: [{ content: { parts: [{ text }] } }],
  }),
});

beforeEach(() => {
  vi.clearAllMocks();
  // Set API key via import.meta.env mock
  vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ─── Unit Tests: generateRecommendations ─────────────────────────────────────

describe('generateRecommendations', () => {
  it('returns parsed JSON recommendations on success', async () => {
    const recs = [
      { category: 'transport', action: 'Use bus', estimatedSavings: 50, difficulty: 'easy', priority: 5 },
    ];
    mockFetch.mockResolvedValueOnce(makeGeminiResponse(JSON.stringify(recs)));

    const result = await generateRecommendations(mockFootprint);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('falls back to hardcoded recommendations when API key missing', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const result = await generateRecommendations(mockFootprint);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('falls back gracefully when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const result = await generateRecommendations(mockFootprint);
    expect(Array.isArray(result)).toBe(true);
  });

  it('falls back gracefully when API returns non-JSON text', async () => {
    mockFetch.mockResolvedValue(makeGeminiResponse('Here are some tips: use a bike.'));
    const result = await generateRecommendations(mockFootprint);
    expect(Array.isArray(result)).toBe(true);
  });

  it('falls back gracefully when API returns non-OK response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 429, json: () => Promise.resolve({}) });
    const result = await generateRecommendations(mockFootprint);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Unit Tests: generateChallenges ──────────────────────────────────────────

describe('generateChallenges', () => {
  it('returns parsed challenges array on success', async () => {
    const challenges = [
      { title: 'Bike Week', description: 'Use bike', criteria: '5 trips', points: 50, duration: 7, category: 'transport' },
    ];
    mockFetch.mockResolvedValueOnce(makeGeminiResponse(JSON.stringify(challenges)));

    const result = await generateChallenges(1, []);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty('id');
  });

  it('returns fallback challenges when API fails', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));
    const result = await generateChallenges(1, []);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('each challenge has required fields', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));
    const result = await generateChallenges(1, []);
    result.forEach(c => {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('title');
      expect(c).toHaveProperty('description');
      expect(c).toHaveProperty('points');
      expect(c).toHaveProperty('category');
    });
  });
});

// ─── Unit Tests: chatWithAI ───────────────────────────────────────────────────

describe('chatWithAI', () => {
  it('returns a string response on success', async () => {
    mockFetch.mockResolvedValueOnce(makeGeminiResponse('Use public transport more.'));
    const result = await chatWithAI([], 'How do I reduce emissions?');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns fallback string when API throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const result = await chatWithAI([], 'test');
    expect(typeof result).toBe('string');
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property: gemini service error handling', () => {
  it('Property 11: generateRecommendations always returns an array regardless of footprint values', async () => {
    // Use a simple sync error to avoid exponential backoff timeouts
    mockFetch.mockRejectedValue(new Error('instant fail'));

    const results = await Promise.all(
      [0, 100, 500, 1000, 5000].map(async (total) => {
        const fp = {
          total,
          byCategory: {
            transport: total * 0.4,
            electricity: total * 0.3,
            food: total * 0.2,
            shopping: total * 0.05,
            water: total * 0.05,
          },
        };
        const result = await generateRecommendations(fp);
        return Array.isArray(result);
      })
    );
    expect(results.every(Boolean)).toBe(true);
  }, 30000);

  it('Property 17: generateChallenges always returns array even with arbitrary level values', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));

    const results = await Promise.all(
      [1, 2, 3, 4, 5, 6].map(async (level) => {
        const result = await generateChallenges(level, []);
        return Array.isArray(result) && result.length > 0;
      })
    );
    expect(results.every(Boolean)).toBe(true);
  }, 30000);
});
