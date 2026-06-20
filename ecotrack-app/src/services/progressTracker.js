import { LEVEL_THRESHOLDS } from '../utils/emissions.js';
import { getUserProfile, updateUserProfile } from './firebaseService.js';

/**
 * Calculate user level from points
 */
export function calculateLevel(points) {
  // Find the highest level threshold that the points meet
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].minPoints) {
      return LEVEL_THRESHOLDS[i];
    }
  }
  return LEVEL_THRESHOLDS[0];
}

/**
 * Calculate points needed for next level
 */
export function pointsToNextLevel(currentPoints) {
  const currentLevel = calculateLevel(currentPoints);
  const currentLevelIndex = LEVEL_THRESHOLDS.findIndex(
    l => l.level === currentLevel.level
  );
  
  if (currentLevelIndex === LEVEL_THRESHOLDS.length - 1) {
    // Already at max level
    return 0;
  }
  
  const nextLevel = LEVEL_THRESHOLDS[currentLevelIndex + 1];
  return nextLevel.minPoints - currentPoints;
}

/**
 * Calculate progress percentage toward next level
 */
export function calculateProgressPercentage(currentPoints) {
  const currentLevel = calculateLevel(currentPoints);
  const currentLevelIndex = LEVEL_THRESHOLDS.findIndex(
    l => l.level === currentLevel.level
  );
  
  if (currentLevelIndex === LEVEL_THRESHOLDS.length - 1) {
    // Already at max level
    return 100;
  }
  
  const nextLevel = LEVEL_THRESHOLDS[currentLevelIndex + 1];
  const currentLevelMinPoints = currentLevel.minPoints;
  const nextLevelMinPoints = nextLevel.minPoints;
  
  const progress = currentPoints - currentLevelMinPoints;
  const totalNeeded = nextLevelMinPoints - currentLevelMinPoints;
  
  return Math.round((progress / totalNeeded) * 100);
}

/**
 * Check and award achievements
 */
export function checkAchievements(progressData) {
  const newAchievements = [];
  
  // First challenge achievement
  if (progressData.completedChallenges === 1 && 
      !progressData.achievements?.some(a => a.id === 'first-challenge')) {
    newAchievements.push({
      id: 'first-challenge',
      title: 'Getting Started',
      description: 'Completed your first challenge',
      unlockedAt: new Date(),
      icon: '🌱',
    });
  }
  
  // 10 challenges achievement
  if (progressData.completedChallenges >= 10 && 
      !progressData.achievements?.some(a => a.id === 'ten-challenges')) {
    newAchievements.push({
      id: 'ten-challenges',
      title: 'Dedicated Reducer',
      description: 'Completed 10 challenges',
      unlockedAt: new Date(),
      icon: '⭐',
    });
  }
  
  // 100kg CO2 saved achievement
  if (progressData.totalCO2Saved >= 100 && 
      !progressData.achievements?.some(a => a.id === 'hundred-kg-saved')) {
    newAchievements.push({
      id: 'hundred-kg-saved',
      title: 'Carbon Crusher',
      description: 'Saved 100kg of CO2',
      unlockedAt: new Date(),
      icon: '💚',
    });
  }
  
  // Reached level 5 achievement
  if (progressData.currentLevel >= 5 && 
      !progressData.achievements?.some(a => a.id === 'level-five')) {
    newAchievements.push({
      id: 'level-five',
      title: 'Guardian of the Green',
      description: 'Reached level 5',
      unlockedAt: new Date(),
      icon: '🏆',
    });
  }
  
  return newAchievements;
}

/**
 * Award points for completed challenge
 */
export async function awardPoints(userId, points) {
  try {
    // Get current user profile
    const profile = await getUserProfile(userId);
    
    const currentPoints = profile.points || 0;
    const newPoints = currentPoints + points;
    
    // Calculate new level
    const newLevel = calculateLevel(newPoints);
    const oldLevel = calculateLevel(currentPoints);
    
    // Check if level increased
    const leveledUp = newLevel.level > oldLevel.level;
    
    // Update profile
    await updateUserProfile(userId, {
      points: newPoints,
      level: newLevel.level,
      levelTitle: newLevel.title,
    });
    
    // Get updated progress data
    const progressData = {
      totalPoints: newPoints,
      currentLevel: newLevel.level,
      levelTitle: newLevel.title,
      pointsToNextLevel: pointsToNextLevel(newPoints),
      progressPercentage: calculateProgressPercentage(newPoints),
      leveledUp,
      completedChallenges: profile.completedChallenges || 0,
      totalCO2Saved: profile.totalCO2Saved || 0,
      achievements: profile.achievements || [],
    };
    
    // Check for new achievements
    const newAchievements = checkAchievements(progressData);
    if (newAchievements.length > 0) {
      progressData.newAchievements = newAchievements;
      const allAchievements = [...progressData.achievements, ...newAchievements];
      await updateUserProfile(userId, {
        achievements: allAchievements,
      });
    }
    
    return progressData;
  } catch (error) {
    console.error('Error awarding points', error);
    throw error;
  }
}

/**
 * Get progress data for user
 */
export async function getProgressData(userId) {
  try {
    const profile = await getUserProfile(userId);
    
    const points = profile.points || 0;
    const level = calculateLevel(points);
    
    return {
      totalPoints: points,
      currentLevel: level.level,
      levelTitle: level.title,
      pointsToNextLevel: pointsToNextLevel(points),
      progressPercentage: calculateProgressPercentage(points),
      completedChallenges: profile.completedChallenges || 0,
      totalCO2Saved: profile.totalCO2Saved || 0,
      achievements: profile.achievements || [],
    };
  } catch (error) {
    console.error('Error getting progress data', error);
    return {
      totalPoints: 0,
      currentLevel: 1,
      levelTitle: 'Green Starter',
      pointsToNextLevel: 100,
      progressPercentage: 0,
      completedChallenges: 0,
      totalCO2Saved: 0,
      achievements: [],
    };
  }
}
