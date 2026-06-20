import { generateReportInsights } from './geminiService.js';
import { getActivityLogs } from './firebaseService.js';

/**
 * Calculate comparison metrics
 */
export function calculateComparison(current, previous) {
  if (!previous) {
    return {
      percentChange: 0,
      absoluteChange: 0,
      improved: false,
    };
  }
  
  const absoluteChange = current.total - previous.total;
  const percentChange = previous.total > 0 
    ? Math.round((absoluteChange / previous.total) * 100)
    : 0;
  const improved = absoluteChange < 0;
  
  return {
    percentChange,
    absoluteChange: Math.round(absoluteChange * 100) / 100,
    improved,
  };
}

/**
 * Format report data for display
 */
export function formatReportData(reportData) {
  const { carbonFootprint, ecoScore, recommendations, progressData, comparisonPeriod } = reportData;
  
  let report = '=== ECOTRACK AI SUSTAINABILITY REPORT ===\n\n';
  report += `Generated: ${reportData.generatedAt.toLocaleString()}\n\n`;
  
  // Carbon Footprint Summary
  report += '--- CARBON FOOTPRINT SUMMARY ---\n';
  report += `Total Monthly Emissions: ${carbonFootprint.total} kg CO2\n`;
  report += `Eco Score: ${ecoScore.score}/100 (${ecoScore.classification})\n\n`;
  
  // Category Breakdown
  report += '--- EMISSIONS BY CATEGORY ---\n';
  const sortedCategories = Object.entries(carbonFootprint.byCategory)
    .sort(([, a], [, b]) => b - a);
  
  sortedCategories.forEach(([category, emissions]) => {
    const percentage = Math.round((emissions / carbonFootprint.total) * 100);
    report += `${category.charAt(0).toUpperCase() + category.slice(1)}: ${emissions} kg CO2 (${percentage}%)\n`;
  });
  report += '\n';
  
  // Comparison
  if (comparisonPeriod) {
    report += '--- PROGRESS COMPARISON ---\n';
    const { percentChange, absoluteChange, improved } = comparisonPeriod;
    const direction = improved ? 'decreased' : 'increased';
    report += `Your emissions ${direction} by ${Math.abs(absoluteChange)} kg CO2 (${Math.abs(percentChange)}%) compared to last month.\n`;
    if (improved) {
      report += '🎉 Great job reducing your carbon footprint!\n';
    }
    report += '\n';
  }
  
  // Recommendations
  if (recommendations && recommendations.length > 0) {
    report += '--- PERSONALIZED RECOMMENDATIONS ---\n';
    recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec.action}\n`;
      report += `   Category: ${rec.category} | Potential Savings: ${rec.estimatedSavings} kg CO2/month\n`;
      report += `   Difficulty: ${rec.difficulty}\n\n`;
    });
  }
  
  // Progress
  report += '--- YOUR PROGRESS ---\n';
  report += `Level: ${progressData.currentLevel} - ${progressData.levelTitle}\n`;
  report += `Total Points: ${progressData.totalPoints}\n`;
  report += `Challenges Completed: ${progressData.completedChallenges}\n`;
  report += `Total CO2 Saved: ${progressData.totalCO2Saved} kg\n\n`;
  
  // Achievements
  if (progressData.achievements && progressData.achievements.length > 0) {
    report += '--- ACHIEVEMENTS UNLOCKED ---\n';
    progressData.achievements.forEach(achievement => {
      report += `${achievement.icon} ${achievement.title}: ${achievement.description}\n`;
    });
    report += '\n';
  }
  
  report += '--- END OF REPORT ---\n';
  report += '\nKeep up the great work! Every small action counts toward a sustainable future.\n';
  
  return report;
}

/**
 * Gather report data
 */
export async function gatherReportData(userId, carbonFootprint, ecoScore, progressData) {
  try {
    // Get historical data for comparison
    const activityLogs = await getActivityLogs(userId, 2);
    
    let comparisonPeriod = null;
    if (activityLogs.length >= 2) {
      const current = activityLogs[0].carbonFootprint;
      const previous = activityLogs[1].carbonFootprint;
      comparisonPeriod = {
        previous,
        ...calculateComparison(current, previous),
      };
    }
    
    // Get highest emission categories
    const sortedCategories = Object.entries(carbonFootprint.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
    
    return {
      userId,
      carbonFootprint,
      ecoScore,
      progressData,
      comparisonPeriod,
      topCategories: sortedCategories,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error gathering report data', error);
    return {
      userId,
      carbonFootprint,
      ecoScore,
      progressData,
      comparisonPeriod: null,
      topCategories: [],
      generatedAt: new Date(),
    };
  }
}

/**
 * Generate sustainability report
 */
export async function generateReport(userId, carbonFootprint, ecoScore, progressData, recommendations, format = 'text') {
  try {
    // Gather report data
    const reportData = await gatherReportData(userId, carbonFootprint, ecoScore, progressData);
    reportData.recommendations = recommendations;
    
    // Generate AI insights
    try {
      const aiInsights = await generateReportInsights(carbonFootprint, progressData);
      reportData.aiInsights = aiInsights;
    } catch (error) {
      console.error('Error generating AI insights', error);
    }
    
    // Format report
    let reportText = formatReportData(reportData);
    
    // Add AI insights if available
    if (reportData.aiInsights) {
      reportText += '\n--- AI INSIGHTS ---\n';
      reportText += reportData.aiInsights + '\n';
    }
    
    if (format === 'text') {
      return reportText;
    } else if (format === 'pdf') {
      // For PDF, we would use jsPDF library
      // For now, return text format with a note
      return reportText + '\n\nNote: PDF generation coming soon!';
    }
    
    return reportText;
  } catch (error) {
    console.error('Error generating report', error);
    throw error;
  }
}

/**
 * Download report as file
 */
export function downloadReport(reportText, format = 'text') {
  const filename = `ecotrack-report-${new Date().toISOString().split('T')[0]}.txt`;
  const blob = new Blob([reportText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
