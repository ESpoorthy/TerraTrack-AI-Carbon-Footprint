import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ValidationError,
  sanitizeInput,
  validateNumericRange,
  validateTransportData,
  validateElectricityData,
  validateFoodData,
  validateShoppingData,
  validateWaterData,
  validateActivityData,
} from '../utils/validators';

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('ValidationError', () => {
  it('creates an error with field and message', () => {
    const err = new ValidationError('transport.distance', 'Too large');
    expect(err.field).toBe('transport.distance');
    expect(err.message).toBe('Too large');
  });
});

describe('sanitizeInput', () => {
  it('removes script tags', () => {
    const result = sanitizeInput('<script>alert("xss")</script>hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('hello');
  });

  it('removes single quotes', () => {
    expect(sanitizeInput("O'Brian")).not.toContain("'");
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('passes numbers through unchanged', () => {
    expect(sanitizeInput(42)).toBe(42);
  });
});

describe('validateNumericRange', () => {
  it('returns null for valid value', () => {
    expect(validateNumericRange(50, 0, 100, 'field')).toBeNull();
  });

  it('returns error for value below min', () => {
    const err = validateNumericRange(-1, 0, 100, 'field');
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.field).toBe('field');
  });

  it('returns error for value above max', () => {
    const err = validateNumericRange(101, 0, 100, 'field');
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('returns error for NaN', () => {
    const err = validateNumericRange(NaN, 0, 100, 'field');
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('accepts boundary values', () => {
    expect(validateNumericRange(0, 0, 100, 'field')).toBeNull();
    expect(validateNumericRange(100, 0, 100, 'field')).toBeNull();
  });
});

describe('validateTransportData', () => {
  const valid = { mode: 'car', distance: 500 };

  it('returns no errors for valid data', () => {
    expect(validateTransportData(valid)).toHaveLength(0);
  });

  it('returns error for missing data', () => {
    expect(validateTransportData(null)).toHaveLength(1);
  });

  it('returns error for invalid mode', () => {
    const errors = validateTransportData({ mode: 'rocket', distance: 100 });
    expect(errors.some(e => e.field === 'transport.mode')).toBe(true);
  });

  it('returns error for negative distance', () => {
    const errors = validateTransportData({ mode: 'car', distance: -1 });
    expect(errors.some(e => e.field === 'transport.distance')).toBe(true);
  });

  it('returns error for distance exceeding 10000', () => {
    const errors = validateTransportData({ mode: 'car', distance: 10001 });
    expect(errors.some(e => e.field === 'transport.distance')).toBe(true);
  });

  it.each(['car', 'bus', 'train', 'bike', 'walk', 'flight'])(
    'accepts valid mode: %s',
    (mode) => {
      expect(validateTransportData({ mode, distance: 100 })).toHaveLength(0);
    }
  );
});

describe('validateElectricityData', () => {
  it('returns no errors for valid data', () => {
    expect(validateElectricityData({ usage: 300 })).toHaveLength(0);
  });

  it('returns error for null', () => {
    expect(validateElectricityData(null)).toHaveLength(1);
  });

  it('returns error for usage above 5000', () => {
    expect(validateElectricityData({ usage: 5001 })).toHaveLength(1);
  });

  it('accepts zero usage', () => {
    expect(validateElectricityData({ usage: 0 })).toHaveLength(0);
  });
});

describe('validateFoodData', () => {
  const valid = { meatConsumption: 'medium', localProduce: false, foodWaste: 'low' };

  it('returns no errors for valid data', () => {
    expect(validateFoodData(valid)).toHaveLength(0);
  });

  it('returns error for invalid meatConsumption', () => {
    const errors = validateFoodData({ ...valid, meatConsumption: 'insane' });
    expect(errors.some(e => e.field === 'food.meatConsumption')).toBe(true);
  });

  it('returns error for non-boolean localProduce', () => {
    const errors = validateFoodData({ ...valid, localProduce: 'yes' });
    expect(errors.some(e => e.field === 'food.localProduce')).toBe(true);
  });

  it('returns error for invalid foodWaste', () => {
    const errors = validateFoodData({ ...valid, foodWaste: 'extreme' });
    expect(errors.some(e => e.field === 'food.foodWaste')).toBe(true);
  });
});

describe('validateShoppingData', () => {
  const valid = { newClothes: 3, electronics: 1, recycling: true };

  it('returns no errors for valid data', () => {
    expect(validateShoppingData(valid)).toHaveLength(0);
  });

  it('returns error for newClothes > 100', () => {
    expect(validateShoppingData({ ...valid, newClothes: 101 })).toHaveLength(1);
  });

  it('returns error for electronics > 20', () => {
    expect(validateShoppingData({ ...valid, electronics: 21 })).toHaveLength(1);
  });

  it('returns error for non-boolean recycling', () => {
    const errors = validateShoppingData({ ...valid, recycling: 'yes' });
    expect(errors.some(e => e.field === 'shopping.recycling')).toBe(true);
  });
});

describe('validateWaterData', () => {
  it('returns no errors for valid data', () => {
    expect(validateWaterData({ usage: 150 })).toHaveLength(0);
  });

  it('returns error for usage above 1000', () => {
    expect(validateWaterData({ usage: 1001 })).toHaveLength(1);
  });
});

describe('validateActivityData', () => {
  const valid = {
    transport: { mode: 'car', distance: 500 },
    electricity: { usage: 300 },
    food: { meatConsumption: 'medium', localProduce: false, foodWaste: 'low' },
    shopping: { newClothes: 3, electronics: 1, recycling: false },
    water: { usage: 150 },
  };

  it('returns no errors for fully valid data', () => {
    expect(validateActivityData(valid)).toHaveLength(0);
  });

  it('returns error if top-level data is null', () => {
    expect(validateActivityData(null)).toHaveLength(1);
  });

  it('aggregates errors from all categories', () => {
    const bad = {
      ...valid,
      transport: { mode: 'rocket', distance: -1 },
      electricity: { usage: 9999 },
    };
    const errors = validateActivityData(bad);
    expect(errors.length).toBeGreaterThan(2);
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property: validateNumericRange', () => {
  it('Property 1: any value in [min, max] returns null', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 500, max: 1000 }),
        (value, min, max) => {
          fc.pre(min <= max && value >= min && value <= max);
          return validateNumericRange(value, min, max, 'f') === null;
        }
      )
    );
  });

  it('Property 2: value below min always returns ValidationError', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 101, max: 10000 }),
        (min, max) => {
          const err = validateNumericRange(min - 1, min, max, 'f');
          return err instanceof ValidationError;
        }
      )
    );
  });

  it('Property 3: value above max always returns ValidationError', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 501, max: 1000 }),
        (min, max) => {
          const err = validateNumericRange(max + 1, min, max, 'f');
          return err instanceof ValidationError;
        }
      )
    );
  });

  it('Property 4: transport validation never errors for valid distance [0, 10000] and valid modes', () => {
    const validModes = ['car', 'bus', 'train', 'bike', 'walk', 'flight'];
    fc.assert(
      fc.property(
        fc.constantFrom(...validModes),
        fc.integer({ min: 0, max: 10000 }),
        (mode, distance) => {
          const errors = validateTransportData({ mode, distance });
          return errors.length === 0;
        }
      )
    );
  });
});
