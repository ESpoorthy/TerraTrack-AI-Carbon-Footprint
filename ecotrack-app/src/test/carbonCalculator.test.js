import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateTransportEmissions,
  calculateElectricityEmissions,
  calculateFoodEmissions,
  calculateShoppingEmissions,
  calculateWaterEmissions,
  calculateCarbonFootprint,
} from '../services/carbonCalculator';
import { EMISSION_FACTORS } from '../utils/emissions';

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('calculateTransportEmissions', () => {
  it('calculates car emissions correctly', () => {
    const result = calculateTransportEmissions({ mode: 'car', distance: 100 });
    expect(result).toBeCloseTo(100 * EMISSION_FACTORS.transport.car, 2);
  });

  it('returns 0 for bike/walk (zero emission modes)', () => {
    expect(calculateTransportEmissions({ mode: 'bike', distance: 500 })).toBe(0);
    expect(calculateTransportEmissions({ mode: 'walk', distance: 500 })).toBe(0);
  });

  it('returns 0 for negative distance', () => {
    expect(calculateTransportEmissions({ mode: 'car', distance: -10 })).toBe(0);
  });

  it('returns 0 for null input', () => {
    expect(calculateTransportEmissions(null)).toBe(0);
  });

  it('returns a number with max 2 decimal places', () => {
    const result = calculateTransportEmissions({ mode: 'car', distance: 333 });
    expect(result.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });

  it('calculates flight emissions correctly', () => {
    const result = calculateTransportEmissions({ mode: 'flight', distance: 1000 });
    expect(result).toBeCloseTo(1000 * EMISSION_FACTORS.transport.flight, 2);
  });
});

describe('calculateElectricityEmissions', () => {
  it('calculates correctly from usage', () => {
    const result = calculateElectricityEmissions({ usage: 200 });
    expect(result).toBeCloseTo(200 * EMISSION_FACTORS.electricity.perKWh, 2);
  });

  it('returns 0 for zero usage', () => {
    expect(calculateElectricityEmissions({ usage: 0 })).toBe(0);
  });

  it('returns 0 for null input', () => {
    expect(calculateElectricityEmissions(null)).toBe(0);
  });

  it('returns 0 for negative usage', () => {
    expect(calculateElectricityEmissions({ usage: -50 })).toBe(0);
  });
});

describe('calculateFoodEmissions', () => {
  it('calculates high meat consumption correctly', () => {
    const result = calculateFoodEmissions({ meatConsumption: 'high', localProduce: false, foodWaste: 'medium' });
    expect(result).toBe(
      EMISSION_FACTORS.food.meat.high + EMISSION_FACTORS.food.foodWaste.medium
    );
  });

  it('applies local produce reduction', () => {
    const withLocal = calculateFoodEmissions({ meatConsumption: 'medium', localProduce: true, foodWaste: 'low' });
    const withoutLocal = calculateFoodEmissions({ meatConsumption: 'medium', localProduce: false, foodWaste: 'low' });
    expect(withLocal).toBeLessThan(withoutLocal);
  });

  it('never returns a negative value', () => {
    const result = calculateFoodEmissions({ meatConsumption: 'none', localProduce: true, foodWaste: 'low' });
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 for null input', () => {
    expect(calculateFoodEmissions(null)).toBe(0);
  });
});

describe('calculateShoppingEmissions', () => {
  it('calculates clothes emissions correctly', () => {
    const result = calculateShoppingEmissions({ newClothes: 2, electronics: 0, recycling: false });
    expect(result).toBeCloseTo(2 * EMISSION_FACTORS.shopping.clothing, 2);
  });

  it('amortizes electronics monthly', () => {
    const result = calculateShoppingEmissions({ newClothes: 0, electronics: 12, recycling: false });
    expect(result).toBeCloseTo(12 * EMISSION_FACTORS.shopping.electronics / 12, 2);
  });

  it('applies recycling reduction', () => {
    const withRecycling = calculateShoppingEmissions({ newClothes: 2, electronics: 0, recycling: true });
    const withoutRecycling = calculateShoppingEmissions({ newClothes: 2, electronics: 0, recycling: false });
    expect(withRecycling).toBeLessThan(withoutRecycling);
  });

  it('never returns a negative value', () => {
    const result = calculateShoppingEmissions({ newClothes: 0, electronics: 0, recycling: true });
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 for null input', () => {
    expect(calculateShoppingEmissions(null)).toBe(0);
  });
});

describe('calculateWaterEmissions', () => {
  it('calculates correctly for daily usage (30-day month)', () => {
    const result = calculateWaterEmissions({ usage: 100 });
    expect(result).toBeCloseTo(100 * 30 * EMISSION_FACTORS.water.perLiter, 2);
  });

  it('returns 0 for zero usage', () => {
    expect(calculateWaterEmissions({ usage: 0 })).toBe(0);
  });

  it('returns 0 for null input', () => {
    expect(calculateWaterEmissions(null)).toBe(0);
  });
});

describe('calculateCarbonFootprint', () => {
  const validData = {
    transport: { mode: 'car', distance: 500 },
    electricity: { usage: 300 },
    food: { meatConsumption: 'medium', localProduce: false, foodWaste: 'medium' },
    shopping: { newClothes: 3, electronics: 2, recycling: false },
    water: { usage: 150 },
  };

  it('returns total and byCategory for valid data', () => {
    const result = calculateCarbonFootprint(validData);
    expect(result).not.toHaveProperty('errors');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('byCategory');
    expect(typeof result.total).toBe('number');
  });

  it('total equals sum of all categories', () => {
    const result = calculateCarbonFootprint(validData);
    const { transport, electricity, food, shopping, water } = result.byCategory;
    const sum = Number((transport + electricity + food + shopping + water).toFixed(2));
    expect(result.total).toBe(sum);
  });

  it('returns errors for invalid data', () => {
    const bad = { ...validData, transport: { mode: 'rocket', distance: -1 } };
    const result = calculateCarbonFootprint(bad);
    expect(result).toHaveProperty('errors');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('all category values are non-negative', () => {
    const result = calculateCarbonFootprint(validData);
    Object.values(result.byCategory).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
    });
  });

  it('includes a timestamp', () => {
    const result = calculateCarbonFootprint(validData);
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property: carbon calculations', () => {
  it('Property 6: transport emissions are non-negative for any valid distance', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('car', 'bus', 'train', 'bike', 'walk', 'flight'),
        fc.float({ min: 0, max: 10000, noNaN: true }),
        (mode, distance) => {
          const result = calculateTransportEmissions({ mode, distance });
          return result >= 0;
        }
      )
    );
  });

  it('Property 7: total footprint always equals sum of categories', () => {
    fc.assert(
      fc.property(
        fc.record({
          transport: fc.record({
            mode: fc.constantFrom('car', 'bus', 'train', 'bike', 'walk', 'flight'),
            distance: fc.integer({ min: 0, max: 10000 }),
          }),
          electricity: fc.record({ usage: fc.integer({ min: 0, max: 5000 }) }),
          food: fc.record({
            meatConsumption: fc.constantFrom('high', 'medium', 'low', 'none'),
            localProduce: fc.boolean(),
            foodWaste: fc.constantFrom('high', 'medium', 'low'),
          }),
          shopping: fc.record({
            newClothes: fc.integer({ min: 0, max: 100 }),
            electronics: fc.integer({ min: 0, max: 20 }),
            recycling: fc.boolean(),
          }),
          water: fc.record({ usage: fc.integer({ min: 0, max: 1000 }) }),
        }),
        (data) => {
          const result = calculateCarbonFootprint(data);
          if (result.errors) return true; // skip invalid
          const { transport, electricity, food, shopping, water } = result.byCategory;
          const sum = Number((transport + electricity + food + shopping + water).toFixed(2));
          return result.total === sum;
        }
      )
    );
  });

  it('Property 8: electricity emissions scale linearly with usage', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (usage) => {
          const single = calculateElectricityEmissions({ usage });
          const double = calculateElectricityEmissions({ usage: usage * 2 });
          // Allow small rounding error from toFixed(2)
          return Math.abs(double - single * 2) < 0.05;
        }
      )
    );
  });
});
