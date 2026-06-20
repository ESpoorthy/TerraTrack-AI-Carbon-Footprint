import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

// Mock Chart.js to avoid canvas errors in jsdom
vi.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="pie-chart" aria-label="Pie chart" />,
  Line: () => <div data-testid="line-chart" aria-label="Line chart" />,
}));

// Mock services to prevent real API calls
vi.mock('../services/firebaseService', () => ({
  initializeFirebase: () => null,
  getActivityLogs: () => Promise.resolve([]),
  saveActivityLog: () => Promise.resolve(),
  getUserProfile: () => Promise.resolve({ level: 1, points: 0, levelTitle: 'Green Starter' }),
  updateUserProfile: () => Promise.resolve(),
  getChallengeHistory: () => Promise.resolve([]),
  saveChallengeProgress: () => Promise.resolve(),
}));

vi.mock('../services/geminiService', () => ({
  generateRecommendations: () => Promise.resolve([]),
  generateChallenges: () => Promise.resolve([]),
  chatWithAI: () => Promise.resolve('Hello!'),
}));

vi.mock('../services/progressTracker', () => ({
  getProgressData: () => Promise.resolve({
    totalPoints: 0, currentLevel: 1, levelTitle: 'Green Starter',
    pointsToNextLevel: 100, progressPercentage: 0,
    completedChallenges: 0, totalCO2Saved: 0, achievements: [],
  }),
  awardPoints: () => Promise.resolve({ totalPoints: 50, currentLevel: 1 }),
}));

vi.mock('../services/reportGenerator', () => ({
  generateReport: () => Promise.resolve('Report text'),
  downloadReport: () => {},
}));

// ─── Components ────────────────────────────────────────────────────────────────

import Home from '../components/Home';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarbonCalculator from '../components/CarbonCalculator';
import AIChat from '../components/AIChat';
import Report from '../components/Report';

const wrap = (component) => (
  <MemoryRouter>{component}</MemoryRouter>
);

// ─── Accessibility Tests ───────────────────────────────────────────────────────

describe('Accessibility: Home', () => {
  it('has no axe violations', async () => {
    const { container } = render(wrap(<Home />));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: Navbar', () => {
  it('has no axe violations', async () => {
    const { container } = render(wrap(<Navbar />));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: Footer', () => {
  it('has no axe violations', async () => {
    const { container } = render(wrap(<Footer />));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: CarbonCalculator', () => {
  it('has no axe violations', async () => {
    const { container } = render(wrap(<CarbonCalculator />));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: AIChat', () => {
  it('has no axe violations', async () => {
    const { container } = render(wrap(<AIChat />));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility: Report', () => {
  it('has no axe violations', async () => {
    const { container } = render(wrap(<Report />));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
