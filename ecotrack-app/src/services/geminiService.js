/**
 * Gemini Service
 * API integration for AI-powered features
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Retry API call with exponential backoff
 */
async function retryWithBackoff(apiCall, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      // Don't retry on missing API key — it won't help
      if (error?.message?.includes('API key')) throw error;
      if (isLastAttempt) throw error;
      // Wait before retrying: 1s, 2s
      await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
    }
  }
}

/**
 * Make request to Gemini API
 */
async function makeGeminiRequest(prompt, timeout = 10000) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get fallback recommendations based on footprint data
 */
function getFallbackRecommendations(carbonFootprint) {
  const recommendations = [];
  const { byCategory } = carbonFootprint;
  
  // Sort categories by emissions
  const sortedCategories = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a);
  
  // Generate recommendations for top 3 categories
  const categoryRecommendations = {
    transport: {
      action: 'Use public transportation or carpool instead of driving alone',
      estimatedSavings: 50,
      difficulty: 'medium',
    },
    electricity: {
      action: 'Switch to energy-efficient LED bulbs and unplug devices when not in use',
      estimatedSavings: 30,
      difficulty: 'easy',
    },
    food: {
      action: 'Reduce meat consumption and buy local, seasonal produce',
      estimatedSavings: 40,
      difficulty: 'medium',
    },
    shopping: {
      action: 'Buy secondhand items and recycle packaging materials',
      estimatedSavings: 20,
      difficulty: 'easy',
    },
    water: {
      action: 'Take shorter showers and fix leaky faucets',
      estimatedSavings: 10,
      difficulty: 'easy',
    },
  };
  
  sortedCategories.slice(0, 3).forEach(([category], index) => {
    const rec = categoryRecommendations[category];
    if (rec) {
      recommendations.push({
        category,
        action: rec.action,
        estimatedSavings: rec.estimatedSavings,
        difficulty: rec.difficulty,
        priority: 5 - index,
      });
    }
  });
  
  return recommendations;
}

/**
 * Generate personalized recommendations
 */
export async function generateRecommendations(carbonFootprint) {
  try {
    const prompt = `You are a sustainability expert. Based on the following carbon footprint data, provide 3-5 specific, actionable recommendations to reduce emissions. Format your response as a JSON array.

Carbon Footprint (kg CO2/month):
- Transport: ${carbonFootprint.byCategory.transport}
- Electricity: ${carbonFootprint.byCategory.electricity}
- Food: ${carbonFootprint.byCategory.food}
- Shopping: ${carbonFootprint.byCategory.shopping}
- Water: ${carbonFootprint.byCategory.water}
- Total: ${carbonFootprint.total}

Respond with a JSON array of objects, each with these fields:
- category: string (transport, electricity, food, shopping, or water)
- action: string (specific recommendation)
- estimatedSavings: number (kg CO2 per month)
- difficulty: string (easy, medium, or hard)
- priority: number (1-5, where 5 is highest)

Focus on the highest emission categories first.`;

    const responseText = await retryWithBackoff(
      () => makeGeminiRequest(prompt, 10000),
      3
    );
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0]);
      return recommendations;
    }
    
    // If parsing fails, return fallback
    return getFallbackRecommendations(carbonFootprint);
  } catch (error) {
    console.error('Gemini recommendation error', error);
    return getFallbackRecommendations(carbonFootprint);
  }
}

/**
 * Generate weekly challenges
 */
export async function generateChallenges(userLevel = 1, completedChallenges = []) {
  try {
    const prompt = `You are a sustainability gamification expert. Create 3 weekly sustainability challenges suitable for a user at level ${userLevel}. Make them specific, measurable, and achievable.

Format your response as a JSON array of objects with these fields:
- title: string (short, catchy title)
- description: string (detailed description)
- criteria: string (specific completion criteria)
- points: number (10-20 for easy, 30-50 for medium, 60-100 for hard)
- duration: number (days, typically 7)
- category: string (transport, electricity, food, shopping, or water)

Vary the difficulty levels and categories.`;

    const responseText = await retryWithBackoff(
      () => makeGeminiRequest(prompt, 10000),
      3
    );
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const challenges = JSON.parse(jsonMatch[0]);
      return challenges.map((challenge, index) => ({
        ...challenge,
        id: `challenge-${Date.now()}-${index}`,
      }));
    }
    
    // Fallback challenges
    return [
      {
        id: `challenge-${Date.now()}-1`,
        title: 'Public Transit Week',
        description: 'Use public transportation for all commutes this week',
        criteria: 'Take bus/train for at least 5 trips',
        points: 50,
        duration: 7,
        category: 'transport',
      },
      {
        id: `challenge-${Date.now()}-2`,
        title: 'Meatless Meals',
        description: 'Try plant-based meals for 3 days this week',
        criteria: 'Eat 3 full days without meat',
        points: 40,
        duration: 7,
        category: 'food',
      },
      {
        id: `challenge-${Date.now()}-3`,
        title: 'Energy Saver',
        description: 'Reduce electricity usage by 10% this week',
        criteria: 'Lower usage compared to last week',
        points: 30,
        duration: 7,
        category: 'electricity',
      },
    ];
  } catch (error) {
    console.error('Gemini challenge error', error);
    // Return fallback challenges
    return [
      {
        id: `challenge-${Date.now()}-1`,
        title: 'Public Transit Week',
        description: 'Use public transportation for all commutes this week',
        criteria: 'Take bus/train for at least 5 trips',
        points: 50,
        duration: 7,
        category: 'transport',
      },
      {
        id: `challenge-${Date.now()}-2`,
        title: 'Meatless Meals',
        description: 'Try plant-based meals for 3 days this week',
        criteria: 'Eat 3 full days without meat',
        points: 40,
        duration: 7,
        category: 'food',
      },
      {
        id: `challenge-${Date.now()}-3`,
        title: 'Energy Saver',
        description: 'Reduce electricity usage by 10% this week',
        criteria: 'Lower usage compared to last week',
        points: 30,
        duration: 7,
        category: 'electricity',
      },
    ];
  }
}

/**
 * Chat with AI about sustainability
 */
export async function chatWithAI(messages, newMessage) {
  try {
    // Build conversation context (last 10 messages to keep prompt size reasonable)
    const recentMessages = messages.slice(-10);
    const conversationHistory = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const prompt = `You are a friendly sustainability advisor called TerraTrack AI. Answer questions about environmental topics, carbon footprints, and eco-friendly practices. Keep responses concise and helpful. If the user asks about something unrelated to sustainability or the environment, politely redirect them to sustainability topics.

${conversationHistory}
user: ${newMessage}
assistant:`;

    // Use 15s timeout — Gemini can be slow on first request
    const responseText = await retryWithBackoff(
      () => makeGeminiRequest(prompt, 15000),
      3
    );
    
    return responseText.trim();
  } catch (error) {
    console.error('Gemini chat error:', error?.message || error);
    if (error?.message?.includes('API key')) {
      return 'The AI service is not configured. Please add a valid Gemini API key.';
    }
    if (error?.name === 'AbortError' || error?.message?.includes('abort')) {
      return 'The response took too long. Please try again.';
    }
    return 'I\'m temporarily unable to respond. Please try again in a moment.';
  }
}

/**
 * Generate report insights
 */
export async function generateReportInsights(carbonFootprint, progressData) {
  try {
    const prompt = `You are a sustainability analyst. Create a brief summary report (2-3 paragraphs) analyzing this user's carbon footprint and progress.

Current Carbon Footprint (kg CO2/month):
- Total: ${carbonFootprint.total}
- Transport: ${carbonFootprint.byCategory.transport}
- Electricity: ${carbonFootprint.byCategory.electricity}
- Food: ${carbonFootprint.byCategory.food}
- Shopping: ${carbonFootprint.byCategory.shopping}
- Water: ${carbonFootprint.byCategory.water}

User Progress:
- Level: ${progressData.currentLevel}
- Total Points: ${progressData.totalPoints}
- Challenges Completed: ${progressData.completedChallenges}
- CO2 Saved: ${progressData.totalCO2Saved} kg

Provide insights on their biggest emission sources and celebrate their achievements.`;

    const responseText = await retryWithBackoff(
      () => makeGeminiRequest(prompt, 10000),
      3
    );
    
    return responseText.trim();
  } catch (error) {
    console.error('Gemini report insights error', error);
    return `Your carbon footprint analysis shows a total of ${carbonFootprint.total} kg CO2 per month. Your highest emission source is ${Object.entries(carbonFootprint.byCategory).sort(([,a], [,b]) => b - a)[0][0]}. You've made great progress with ${progressData.completedChallenges} challenges completed and ${progressData.totalCO2Saved} kg CO2 saved!`;
  }
}
