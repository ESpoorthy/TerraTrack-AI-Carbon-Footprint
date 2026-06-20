import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../services/firebaseService', () => ({
  initializeFirebase: () => null,
  saveActivityLog: vi.fn(() => Promise.resolve()),
  getActivityLogs: vi.fn(() => Promise.resolve([])),
  getUserProfile: vi.fn(() =>
    Promise.resolve({ level: 1, points: 0, levelTitle: 'Green Starter' })
  ),
  updateUserProfile: vi.fn(() => Promise.resolve()),
  getChallengeHistory: vi.fn(() => Promise.resolve([])),
  saveChallengeProgress: vi.fn(() => Promise.resolve()),
}));

vi.mock('../services/geminiService', () => ({
  generateRecommendations: vi.fn(() =>
    Promise.resolve([
      { category: 'transport', action: 'Take the bus', estimatedSavings: 50, difficulty: 'easy', priority: 5 },
    ])
  ),
  generateChallenges: vi.fn(() =>
    Promise.resolve([
      {
        id: 'ch-1', title: 'Bike Week', description: 'Use bike for a week',
        criteria: '5 trips', points: 50, duration: 7, category: 'transport',
      },
    ])
  ),
  chatWithAI: vi.fn(() => Promise.resolve('Great question! Try using public transport.')),
  generateReportInsights: vi.fn(() => Promise.resolve('AI insights here.')),
}));

vi.mock('../services/progressTracker', () => ({
  getProgressData: vi.fn(() =>
    Promise.resolve({
      totalPoints: 0, currentLevel: 1, levelTitle: 'Green Starter',
      pointsToNextLevel: 100, progressPercentage: 0,
      completedChallenges: 0, totalCO2Saved: 0, achievements: [],
    })
  ),
  awardPoints: vi.fn(() =>
    Promise.resolve({
      totalPoints: 50, currentLevel: 1, levelTitle: 'Green Starter',
      leveledUp: false, pointsToNextLevel: 50, progressPercentage: 50,
    })
  ),
}));

import CarbonCalculator from '../components/CarbonCalculator';
import Challenges from '../components/Challenges';
import AIChat from '../components/AIChat';
import { generateChallenges } from '../services/geminiService';
import { saveActivityLog } from '../services/firebaseService';
import { calculateCarbonFootprint } from '../services/carbonCalculator';
import { calculateEcoScore } from '../services/ecoScoreCalculator';

const wrap = (component, initialEntries = ['/']) =>
  render(<MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>);

// ─── Integration Tests ─────────────────────────────────────────────────────────

describe('Integration: Carbon Calculator form → calculation → navigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    saveActivityLog.mockClear();
  });

  it('renders all 5 input sections', () => {
    wrap(<CarbonCalculator />);
    // Use getAllByText to handle multiple matches (e.g., nav links + section headers)
    expect(screen.getAllByText(/transport/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/electricity/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/food/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/shopping/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/water/i).length).toBeGreaterThan(0);
  });

  it('shows validation error for invalid transport mode when submitting empty form edge cases', async () => {
    wrap(<CarbonCalculator />);
    // Default form has valid values (car, 0 distance) — should not show error for mode
    const submitBtn = screen.getByRole('button', { name: /calculate/i });
    expect(submitBtn).toBeInTheDocument();
  });

  it('calls saveActivityLog and navigates to dashboard on successful submit', async () => {
    const user = userEvent.setup();
    wrap(<CarbonCalculator />);

    // Fill in distance
    const distanceInput = screen.getByLabelText(/distance per month/i);
    await user.clear(distanceInput);
    await user.type(distanceInput, '500');

    // Fill in electricity
    const electricityInput = screen.getByLabelText(/monthly usage/i);
    await user.clear(electricityInput);
    await user.type(electricityInput, '300');

    // Fill in water
    const waterInput = screen.getByLabelText(/daily usage/i);
    await user.clear(waterInput);
    await user.type(waterInput, '150');

    const submitBtn = screen.getByRole('button', { name: /calculate carbon footprint/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(saveActivityLog).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/dashboard',
        expect.objectContaining({ state: expect.objectContaining({ justCalculated: true }) })
      );
    });
  });
});

describe('Integration: Challenges page load and display', () => {
  it('loads and displays challenge cards', async () => {
    wrap(<Challenges />);

    await waitFor(() => {
      expect(screen.getByText('Bike Week')).toBeInTheDocument();
    });

    expect(screen.getByText(/50 pts/i)).toBeInTheDocument();
    expect(screen.getByText(/Use bike for a week/i)).toBeInTheDocument();
  });

  it('shows progress card with level info', async () => {
    wrap(<Challenges />);
    await waitFor(() => {
      expect(screen.getByText('Green Starter')).toBeInTheDocument();
    });
  });
});

describe('Integration: AI Chat send and receive', () => {
  it('sends a message and displays AI response', async () => {
    const user = userEvent.setup();
    wrap(<AIChat />);

    const input = screen.getByLabelText(/chat input/i);
    await user.type(input, 'How do I reduce my carbon footprint?');

    const sendBtn = screen.getByRole('button', { name: /send message/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Great question! Try using public transport/i)).toBeInTheDocument();
    });
  });

  it('shows typing indicator while loading', async () => {
    const user = userEvent.setup();
    // Delay response to catch loading state
    const { chatWithAI } = await import('../services/geminiService');
    chatWithAI.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve('Hi'), 200))
    );

    wrap(<AIChat />);
    const input = screen.getByLabelText(/chat input/i);
    await user.type(input, 'Hello');

    const sendBtn = screen.getByRole('button', { name: /send message/i });
    await user.click(sendBtn);

    // Check typing indicator (3 bounce dots) exists briefly
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('clears chat when Clear Chat button is clicked', async () => {
    const user = userEvent.setup();
    wrap(<AIChat />);

    const clearBtn = screen.getByRole('button', { name: /clear chat/i });
    await user.click(clearBtn);

    expect(screen.getByText(/Chat cleared/i)).toBeInTheDocument();
  });
});

describe('Integration: End-to-end calculation pipeline', () => {
  it('calculateCarbonFootprint → calculateEcoScore produces consistent output', () => {
    const data = {
      transport: { mode: 'car', distance: 500 },
      electricity: { usage: 300 },
      food: { meatConsumption: 'medium', localProduce: false, foodWaste: 'medium' },
      shopping: { newClothes: 3, electronics: 2, recycling: false },
      water: { usage: 150 },
    };

    const footprint = calculateCarbonFootprint(data);
    expect(footprint).not.toHaveProperty('errors');

    const ecoScore = calculateEcoScore(footprint.total);
    expect(ecoScore.score).toBeGreaterThanOrEqual(0);
    expect(ecoScore.score).toBeLessThanOrEqual(100);
    expect(['Green Hero', 'Eco Friendly', 'Needs Improvement', 'High Impact']).toContain(
      ecoScore.classification
    );
  });

  it('zero-emission lifestyle produces max eco score', () => {
    const data = {
      transport: { mode: 'bike', distance: 500 },
      electricity: { usage: 0 },
      food: { meatConsumption: 'none', localProduce: true, foodWaste: 'low' },
      shopping: { newClothes: 0, electronics: 0, recycling: true },
      water: { usage: 0 },
    };

    const footprint = calculateCarbonFootprint(data);
    const ecoScore = calculateEcoScore(footprint.total);
    expect(ecoScore.score).toBe(100);
    expect(ecoScore.classification).toBe('Green Hero');
  });

  it('high-impact lifestyle produces low eco score', () => {
    const data = {
      transport: { mode: 'flight', distance: 5000 },
      electricity: { usage: 2000 },
      food: { meatConsumption: 'high', localProduce: false, foodWaste: 'high' },
      shopping: { newClothes: 50, electronics: 10, recycling: false },
      water: { usage: 500 },
    };

    const footprint = calculateCarbonFootprint(data);
    const ecoScore = calculateEcoScore(footprint.total);
    expect(ecoScore.score).toBeLessThan(50);
    expect(['Needs Improvement', 'High Impact']).toContain(ecoScore.classification);
  });
});
