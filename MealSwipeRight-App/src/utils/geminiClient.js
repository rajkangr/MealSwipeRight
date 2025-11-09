import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API client
// Note: In production, store API key in environment variable
// The .env file should be in MealSwipeRight-App/ directory (same level as package.json)
// Format: VITE_GEMINI_API_KEY=your_api_key_here
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Debug: Log if API key is found (only in development)
if (import.meta.env.DEV) {
  console.log('Gemini API Key configured:', API_KEY ? 'Yes (hidden)' : 'No - Please set VITE_GEMINI_API_KEY in .env file');
}

let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

/**
 * Build system prompt with user context
 */
function buildSystemPrompt(userData) {
  const { preferences, userInfo, likedFoods, caloricMaintenance, mealPlan } = userData;

  let prompt = `You are a helpful nutrition and meal planning assistant for MealSwipeRight, a dining hall food recommendation app at UMass. 

Your role is to:
- Provide personalized meal suggestions based on user preferences
- Answer questions about nutrition, calories, and macros
- Help users make informed food choices
- Suggest meal combinations that fit their dietary goals

USER CONTEXT:
`;

  // Add user preferences
  if (preferences) {
    prompt += `\nDietary Preferences:\n`;
    if (preferences.diningHall) {
      // Ensure it's a string; if it's an object, use its name property; otherwise default to "None"
      const diningHallStr =
        typeof preferences.diningHall === 'string'
          ? preferences.diningHall
          : preferences.diningHall?.name || 'None';

      prompt += `- Dining Hall: ${diningHallStr.charAt(0).toUpperCase() + diningHallStr.slice(1)}\n`;
    } else {
      // Fallback if diningHall is undefined or null
      prompt += `- Dining Hall: None\n`;
    }

    if (preferences.isVegetarian) prompt += `- Vegetarian\n`;
    if (preferences.isVegan) prompt += `- Vegan\n`;
    if (preferences.isGlutenFree) prompt += `- Gluten-Free\n`;
    if (preferences.isDairyFree) prompt += `- Dairy-Free\n`;
    if (preferences.isKeto) prompt += `- Keto\n`;
    if (preferences.activityLevel) {
      const activityLevels = {
        sedentary: 'Sedentary (little/no exercise)',
        lightly: 'Lightly Active (1-3 days/week)',
        moderately: 'Moderately Active (3-5 days/week)',
        active: 'Active (6-7 days/week)',
        very: 'Very Active (2x per day)'
      };
      prompt += `- Activity Level: ${activityLevels[preferences.activityLevel] || preferences.activityLevel}\n`;
    }
  }

  // Add user info
  if (userInfo) {
    prompt += `\nUser Information:\n`;
    if (userInfo.weight) prompt += `- Weight: ${userInfo.weight} lbs\n`;
    if (userInfo.height) prompt += `- Height: ${userInfo.height} inches\n`;
    if (userInfo.sex) prompt += `- Sex: ${userInfo.sex.charAt(0).toUpperCase() + userInfo.sex.slice(1)}\n`;
    if (userInfo.age) prompt += `- Age: ${userInfo.age} years\n`;
  }

  // Add caloric maintenance
  if (caloricMaintenance) {
    prompt += `\nDaily Caloric Maintenance: ${caloricMaintenance} calories\n`;
  }

  // Add liked foods
  if (likedFoods && likedFoods.length > 0) {
    prompt += `\nLiked Foods (${likedFoods.length} items):\n`;
    likedFoods.slice(0, 20).forEach((food, index) => {
      prompt += `${index + 1}. ${food.name}`;
      if (food.location) prompt += ` (${food.location})`;
      if (food.calories) prompt += ` - ${food.calories} cal`;
      prompt += `\n`;
    });
    if (likedFoods.length > 20) {
      prompt += `... and ${likedFoods.length - 20} more liked foods\n`;
    }
  }

  // Add meal plan info if available
  if (mealPlan && mealPlan.totals) {
    prompt += `\nCurrent Meal Plan:\n`;
    prompt += `- Total Calories: ${mealPlan.totals.calories}\n`;
    prompt += `- Protein: ${mealPlan.totals.protein}g\n`;
    prompt += `- Carbs: ${mealPlan.totals.carbs}g\n`;
    prompt += `- Fat: ${mealPlan.totals.fat}g\n`;
  }

  prompt += `\nINSTRUCTIONS:
- Always consider the user's dietary preferences and restrictions when making suggestions
- Reference their liked foods when suggesting meal combinations
- Be conversational, friendly, and helpful
- If asked about specific foods, provide nutritional information if available
- Suggest meal combinations that help them reach their caloric and macro goals
- Keep responses concise but informative
- If you don't have information about a specific food item, say so honestly
`;

  return prompt;
}

/**
 * Send a message to Gemini API
 */
export async function sendMessage(userMessage, userData, conversationHistory = []) {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }

  try {
    // Use gemini-1.5-flash for faster responses, or gemini-1.5-pro for better quality
    // gemini-pro is deprecated, use gemini-1.5-flash or gemini-1.5-pro instead
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build system prompt with user context
    const systemPrompt = buildSystemPrompt(userData);

    // Build conversation history
    let fullPrompt = systemPrompt + '\n\nCONVERSATION:\n';
    
    // Add conversation history (last 10 messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `Assistant: ${msg.content}\n`;
      }
    });

    // Add current user message
    fullPrompt += `User: ${userMessage}\nAssistant:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error(`Failed to get response: ${error.message}`);
  }
}

/**
 * Check if API key is configured
 */
export function isApiKeyConfigured() {
  return !!API_KEY;
}

