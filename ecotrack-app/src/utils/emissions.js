/**
 * Emission Factors (kg CO2 per unit)
 * Sources: EPA (Environmental Protection Agency), IPCC (Intergovernmental Panel on Climate Change)
 */

export const EMISSION_FACTORS = {
  transport: {
    car: 0.21,        // kg CO2 per km (EPA: average passenger vehicle)
    bus: 0.089,       // kg CO2 per km (EPA: public transit bus)
    train: 0.041,     // kg CO2 per km (EPA: commuter rail)
    bike: 0,          // kg CO2 per km (zero emissions)
    walk: 0,          // kg CO2 per km (zero emissions)
    flight: 0.255,    // kg CO2 per km (IPCC: short-haul average)
  },
  
  electricity: {
    perKWh: 0.475,    // kg CO2 per kWh (EPA: US grid average)
  },
  
  food: {
    meat: {
      high: 180,      // kg CO2 per month (daily red meat consumption)
      medium: 120,    // kg CO2 per month (4-5x per week)
      low: 60,        // kg CO2 per month (1-2x per week)
      none: 30,       // kg CO2 per month (plant-based diet)
    },
    localProduce: -15,  // kg CO2 reduction per month
    foodWaste: {
      high: 40,       // kg CO2 per month (significant waste)
      medium: 20,     // kg CO2 per month (moderate waste)
      low: 5,         // kg CO2 per month (minimal waste)
    },
  },
  
  shopping: {
    clothing: 25,     // kg CO2 per item (average garment)
    electronics: 200, // kg CO2 per item (amortized yearly)
    recycling: -10,   // kg CO2 reduction per month
  },
  
  water: {
    perLiter: 0.0003, // kg CO2 per liter (treatment + heating)
  },
};

export const VALIDATION_RANGES = {
  transport: {
    distance: { min: 0, max: 10000 }, // km per month
  },
  electricity: {
    usage: { min: 0, max: 5000 }, // kWh per month
  },
  shopping: {
    newClothes: { min: 0, max: 100 }, // items per month
    electronics: { min: 0, max: 20 },  // items per year
  },
  water: {
    usage: { min: 0, max: 1000 }, // liters per day
  },
};

export const ECO_SCORE_THRESHOLDS = {
  greenHero: { min: 90, max: 100 },
  ecoFriendly: { min: 70, max: 89 },
  needsImprovement: { min: 50, max: 69 },
  highImpact: { min: 0, max: 49 },
};

// Reference footprints for scoring (kg CO2 per month)
export const REFERENCE_FOOTPRINTS = {
  excellent: 200,   // Green Hero threshold
  good: 400,        // Eco Friendly threshold
  average: 600,     // Needs Improvement threshold
  poor: 800,        // High Impact threshold
};

export const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Green Starter', minPoints: 0 },
  { level: 2, title: 'Eco Learner', minPoints: 100 },
  { level: 3, title: 'Sustainability Advocate', minPoints: 300 },
  { level: 4, title: 'Climate Warrior', minPoints: 600 },
  { level: 5, title: 'Green Guardian', minPoints: 1000 },
  { level: 6, title: 'Earth Hero', minPoints: 1500 },
];
