import { ECO_SCORE_THRESHOLDS, REFERENCE_FOOTPRINTS } from '../utils/emissions.js';

/**
 * Classify eco score into tier
 * @param {number} score - Numeric score 0-100
 * @returns {string} Classification tier
 */
export function classifyEcoScore(score) {
  if (score >= ECO_SCORE_THRESHOLDS.greenHero.min) {
    return 'Green Hero';
  } else if (score >= ECO_SCORE_THRESHOLDS.ecoFriendly.min) {
    return 'Eco Friendly';
  } else if (score >= ECO_SCORE_THRESHOLDS.needsImprovement.min) {
    return 'Needs Improvement';
  } else {
    return 'High Impact';
  }
}

/**
 * Get motivational message for score
 * @param {string} classification - Eco score classification
 * @returns {string} User-friendly message
 */
export function getScoreMessage(classification) {
  const messages = {
    'Green Hero': 'Outstanding! You\'re a sustainability champion with an excellent carbon footprint.',
    'Eco Friendly': 'Great work! You\'re making positive environmental choices.',
    'Needs Improvement': 'You\'re on the right track. Let\'s work together to reduce your impact.',
    'High Impact': 'Every journey starts with a single step. We\'ll help you make a difference.',
  };
  return messages[classification] || '';
}

/**
 * Get color for score classification
 * @param {string} classification - Eco score classification
 * @returns {string} Hex color for UI display
 */
export function getScoreColor(classification) {
  const colors = {
    'Green Hero': '#10b981',     // Green
    'Eco Friendly': '#3b82f6',   // Blue
    'Needs Improvement': '#f59e0b', // Yellow
    'High Impact': '#ef4444',    // Red
  };
  return colors[classification] || '#6b7280';
}

/**
 * Calculate eco score from carbon footprint
 * Score inversely proportional to emissions
 * @param {number} carbonFootprint - Monthly carbon footprint in kg CO2
 * @returns {Object} EcoScore object
 */
export function calculateEcoScore(carbonFootprint) {
  try {
    // Ensure footprint is non-negative
    const footprint = Math.max(0, carbonFootprint);
    
    // Calculate score using inverse scaling
    // Score of 100 for footprint <= excellent threshold
    // Score decreases as footprint increases
    let score;
    
    if (footprint <= REFERENCE_FOOTPRINTS.excellent) {
      score = 100;
    } else if (footprint <= REFERENCE_FOOTPRINTS.good) {
      // Linear interpolation between 100 and 70
      const range = REFERENCE_FOOTPRINTS.good - REFERENCE_FOOTPRINTS.excellent;
      const position = footprint - REFERENCE_FOOTPRINTS.excellent;
      score = 100 - (position / range) * 30;
    } else if (footprint <= REFERENCE_FOOTPRINTS.average) {
      // Linear interpolation between 70 and 50
      const range = REFERENCE_FOOTPRINTS.average - REFERENCE_FOOTPRINTS.good;
      const position = footprint - REFERENCE_FOOTPRINTS.good;
      score = 70 - (position / range) * 20;
    } else if (footprint <= REFERENCE_FOOTPRINTS.poor) {
      // Linear interpolation between 50 and 30
      const range = REFERENCE_FOOTPRINTS.poor - REFERENCE_FOOTPRINTS.average;
      const position = footprint - REFERENCE_FOOTPRINTS.average;
      score = 50 - (position / range) * 20;
    } else {
      // Exponential decay for very high footprints
      const excess = footprint - REFERENCE_FOOTPRINTS.poor;
      score = Math.max(0, 30 * Math.exp(-excess / 1000));
    }
    
    // Ensure score is within [0, 100]
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    const classification = classifyEcoScore(score);
    const message = getScoreMessage(classification);
    const color = getScoreColor(classification);
    
    return {
      score,
      classification,
      message,
      color,
    };
  } catch (error) {
    console.error('Eco score calculation error', { error, carbonFootprint });
    return {
      score: 0,
      classification: 'High Impact',
      message: 'Error calculating eco score',
      color: '#6b7280',
    };
  }
}
