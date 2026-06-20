import { EMISSION_FACTORS } from '../utils/emissions.js';
import { validateActivityData } from '../utils/validators.js';

/**
 * Calculate emissions for transport category
 * @param {Object} transport - Transport activity data
 * @returns {number} CO2 in kg
 */
export function calculateTransportEmissions(transport) {
  try {
    if (!transport || transport.distance < 0) {
      return 0;
    }
    const factor = EMISSION_FACTORS.transport[transport.mode] || 0;
    return Number((transport.distance * factor).toFixed(2));
  } catch (error) {
    console.error('Transport calculation error', { error, transport });
    return 0;
  }
}

/**
 * Calculate emissions for electricity category
 * @param {Object} electricity - Electricity usage data
 * @returns {number} CO2 in kg
 */
export function calculateElectricityEmissions(electricity) {
  try {
    if (!electricity || electricity.usage < 0) {
      return 0;
    }
    return Number((electricity.usage * EMISSION_FACTORS.electricity.perKWh).toFixed(2));
  } catch (error) {
    console.error('Electricity calculation error', { error, electricity });
    return 0;
  }
}

/**
 * Calculate emissions for food category
 * @param {Object} food - Food consumption data
 * @returns {number} CO2 in kg
 */
export function calculateFoodEmissions(food) {
  try {
    if (!food) {
      return 0;
    }
    
    let emissions = 0;
    
    // Add meat consumption emissions
    emissions += EMISSION_FACTORS.food.meat[food.meatConsumption] || 0;
    
    // Subtract emissions if using local produce
    if (food.localProduce) {
      emissions += EMISSION_FACTORS.food.localProduce;
    }
    
    // Add food waste emissions
    emissions += EMISSION_FACTORS.food.foodWaste[food.foodWaste] || 0;
    
    return Number(Math.max(0, emissions).toFixed(2));
  } catch (error) {
    console.error('Food calculation error', { error, food });
    return 0;
  }
}

/**
 * Calculate emissions for shopping category
 * @param {Object} shopping - Shopping habits data
 * @returns {number} CO2 in kg
 */
export function calculateShoppingEmissions(shopping) {
  try {
    if (!shopping) {
      return 0;
    }
    
    let emissions = 0;
    
    // Add clothing emissions
    emissions += (shopping.newClothes || 0) * EMISSION_FACTORS.shopping.clothing;
    
    // Add electronics emissions (amortized monthly)
    emissions += (shopping.electronics || 0) * EMISSION_FACTORS.shopping.electronics / 12;
    
    // Subtract emissions if recycling
    if (shopping.recycling) {
      emissions += EMISSION_FACTORS.shopping.recycling;
    }
    
    return Number(Math.max(0, emissions).toFixed(2));
  } catch (error) {
    console.error('Shopping calculation error', { error, shopping });
    return 0;
  }
}

/**
 * Calculate emissions for water category
 * @param {Object} water - Water usage data
 * @returns {number} CO2 in kg
 */
export function calculateWaterEmissions(water) {
  try {
    if (!water || water.usage < 0) {
      return 0;
    }
    // Convert daily usage to monthly (30 days)
    const monthlyUsage = water.usage * 30;
    return Number((monthlyUsage * EMISSION_FACTORS.water.perLiter).toFixed(2));
  } catch (error) {
    console.error('Water calculation error', { error, water });
    return 0;
  }
}

/**
 * Calculate total carbon footprint from activity data
 * @param {Object} data - User activity data across all categories
 * @returns {Object} CarbonFootprint or validation errors
 */
export function calculateCarbonFootprint(data) {
  // Validate inputs
  const validationErrors = validateActivityData(data);
  if (validationErrors.length > 0) {
    return { errors: validationErrors };
  }
  
  try {
    // Calculate emissions for each category
    const transport = calculateTransportEmissions(data.transport);
    const electricity = calculateElectricityEmissions(data.electricity);
    const food = calculateFoodEmissions(data.food);
    const shopping = calculateShoppingEmissions(data.shopping);
    const water = calculateWaterEmissions(data.water);
    
    // Calculate total
    const total = Number((transport + electricity + food + shopping + water).toFixed(2));
    
    return {
      total,
      byCategory: {
        transport,
        electricity,
        food,
        shopping,
        water,
      },
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Carbon footprint calculation error', { error, data });
    return {
      errors: [{ field: 'calculation', message: 'Error calculating carbon footprint' }]
    };
  }
}
