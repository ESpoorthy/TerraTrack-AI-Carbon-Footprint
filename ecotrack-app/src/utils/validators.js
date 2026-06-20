import { VALIDATION_RANGES } from './emissions.js';

/**
 * Validation error structure
 */
export class ValidationError {
  constructor(field, message) {
    this.field = field;
    this.message = message;
  }
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    // Remove potential script tags and SQL injection patterns
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[';\"]/g, '')
      .trim();
  }
  return input;
}

/**
 * Validate numeric value is within range
 */
export function validateNumericRange(value, min, max, fieldName) {
  if (typeof value !== 'number' || isNaN(value)) {
    return new ValidationError(fieldName, `${fieldName} must be a valid number`);
  }
  
  if (value < min) {
    return new ValidationError(fieldName, `${fieldName} must be at least ${min}`);
  }
  
  if (value > max) {
    return new ValidationError(fieldName, `${fieldName} must be at most ${max}`);
  }
  
  return null;
}

/**
 * Validate transport data
 */
export function validateTransportData(transport) {
  const errors = [];
  
  if (!transport) {
    errors.push(new ValidationError('transport', 'Transport data is required'));
    return errors;
  }
  
  // Validate mode
  const validModes = ['car', 'bus', 'train', 'bike', 'walk', 'flight'];
  if (!validModes.includes(transport.mode)) {
    errors.push(new ValidationError('transport.mode', 'Invalid transport mode'));
  }
  
  // Validate distance
  const distanceError = validateNumericRange(
    transport.distance,
    VALIDATION_RANGES.transport.distance.min,
    VALIDATION_RANGES.transport.distance.max,
    'transport.distance'
  );
  if (distanceError) {
    errors.push(distanceError);
  }
  
  return errors;
}

/**
 * Validate electricity data
 */
export function validateElectricityData(electricity) {
  const errors = [];
  
  if (!electricity) {
    errors.push(new ValidationError('electricity', 'Electricity data is required'));
    return errors;
  }
  
  const usageError = validateNumericRange(
    electricity.usage,
    VALIDATION_RANGES.electricity.usage.min,
    VALIDATION_RANGES.electricity.usage.max,
    'electricity.usage'
  );
  if (usageError) {
    errors.push(usageError);
  }
  
  return errors;
}

/**
 * Validate food data
 */
export function validateFoodData(food) {
  const errors = [];
  
  if (!food) {
    errors.push(new ValidationError('food', 'Food data is required'));
    return errors;
  }
  
  // Validate meat consumption
  const validMeatLevels = ['high', 'medium', 'low', 'none'];
  if (!validMeatLevels.includes(food.meatConsumption)) {
    errors.push(new ValidationError('food.meatConsumption', 'Invalid meat consumption level'));
  }
  
  // Validate local produce
  if (typeof food.localProduce !== 'boolean') {
    errors.push(new ValidationError('food.localProduce', 'Local produce must be true or false'));
  }
  
  // Validate food waste
  const validWasteLevels = ['high', 'medium', 'low'];
  if (!validWasteLevels.includes(food.foodWaste)) {
    errors.push(new ValidationError('food.foodWaste', 'Invalid food waste level'));
  }
  
  return errors;
}

/**
 * Validate shopping data
 */
export function validateShoppingData(shopping) {
  const errors = [];
  
  if (!shopping) {
    errors.push(new ValidationError('shopping', 'Shopping data is required'));
    return errors;
  }
  
  // Validate new clothes
  const clothesError = validateNumericRange(
    shopping.newClothes,
    VALIDATION_RANGES.shopping.newClothes.min,
    VALIDATION_RANGES.shopping.newClothes.max,
    'shopping.newClothes'
  );
  if (clothesError) {
    errors.push(clothesError);
  }
  
  // Validate electronics
  const electronicsError = validateNumericRange(
    shopping.electronics,
    VALIDATION_RANGES.shopping.electronics.min,
    VALIDATION_RANGES.shopping.electronics.max,
    'shopping.electronics'
  );
  if (electronicsError) {
    errors.push(electronicsError);
  }
  
  // Validate recycling
  if (typeof shopping.recycling !== 'boolean') {
    errors.push(new ValidationError('shopping.recycling', 'Recycling must be true or false'));
  }
  
  return errors;
}

/**
 * Validate water data
 */
export function validateWaterData(water) {
  const errors = [];
  
  if (!water) {
    errors.push(new ValidationError('water', 'Water data is required'));
    return errors;
  }
  
  const usageError = validateNumericRange(
    water.usage,
    VALIDATION_RANGES.water.usage.min,
    VALIDATION_RANGES.water.usage.max,
    'water.usage'
  );
  if (usageError) {
    errors.push(usageError);
  }
  
  return errors;
}

/**
 * Validate complete activity data
 */
export function validateActivityData(data) {
  if (!data) {
    return [new ValidationError('data', 'Activity data is required')];
  }
  
  const errors = [];
  
  // Validate all categories
  errors.push(...validateTransportData(data.transport));
  errors.push(...validateElectricityData(data.electricity));
  errors.push(...validateFoodData(data.food));
  errors.push(...validateShoppingData(data.shopping));
  errors.push(...validateWaterData(data.water));
  
  return errors;
}
