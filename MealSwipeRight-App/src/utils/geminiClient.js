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
  const { preferences, userInfo, likedFoods, consumedFoods, caloricMaintenance, mealPlan, gymData } = userData;

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

  // Add consumed foods (today's intake)
  if (consumedFoods && consumedFoods.length > 0) {
    prompt += `\nToday's Consumed Foods (${consumedFoods.length} items):\n`;
    consumedFoods.slice(0, 10).forEach((food, index) => {
      prompt += `${index + 1}. ${food.name}`;
      if (food.location && food.location !== 'Custom') prompt += ` (${food.location})`;
      if (food.calories) prompt += ` - ${food.calories} cal`;
      if (food.protein_g) prompt += `, ${food.protein_g}g protein`;
      prompt += `\n`;
    });
    if (consumedFoods.length > 10) {
      prompt += `... and ${consumedFoods.length - 10} more foods consumed today\n`;
    }
    
    // Calculate today's totals
    const todayTotals = consumedFoods.reduce((acc, food) => ({
      calories: acc.calories + (parseFloat(food.calories) || 0),
      protein: acc.protein + (parseFloat(food.protein_g) || 0),
      carbs: acc.carbs + (parseFloat(food.total_carb_g) || 0),
      fat: acc.fat + (parseFloat(food.total_fat_g) || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    prompt += `\nToday's Totals:\n`;
    prompt += `- Calories: ${Math.round(todayTotals.calories)}\n`;
    prompt += `- Protein: ${Math.round(todayTotals.protein)}g\n`;
    prompt += `- Carbs: ${Math.round(todayTotals.carbs)}g\n`;
    prompt += `- Fat: ${Math.round(todayTotals.fat)}g\n`;
  }

  // Add meal plan info if available
  if (mealPlan && mealPlan.totals) {
    prompt += `\nCurrent Meal Plan:\n`;
    prompt += `- Total Calories: ${mealPlan.totals.calories}\n`;
    prompt += `- Protein: ${mealPlan.totals.protein}g\n`;
    prompt += `- Carbs: ${mealPlan.totals.carbs}g\n`;
    prompt += `- Fat: ${mealPlan.totals.fat}g\n`;
  }

  // Add gym/workout data if available
  if (gymData) {
    const workouts = gymData.workouts || [];
    if (workouts.length > 0) {
      prompt += `\nWorkout History:\n`;
      prompt += `- Total Workouts: ${workouts.length}\n`;
      
      // Get today's workout
      const today = new Date().toDateString();
      const todaysWorkout = workouts.find(w => {
        const workoutDate = new Date(w.date);
        return workoutDate.toDateString() === today;
      });
      
      if (todaysWorkout) {
        prompt += `- Today's Workout: ${todaysWorkout.title} (${todaysWorkout.exercises.length} exercises)\n`;
      }
      
      // Get recent workouts
      const recentWorkouts = workouts.slice(-3).reverse();
      if (recentWorkouts.length > 0) {
        prompt += `- Recent Workouts:\n`;
        recentWorkouts.forEach(w => {
          const date = new Date(w.date);
          prompt += `  * ${w.title} on ${date.toLocaleDateString()}\n`;
        });
      }
    }
    
    // Add PR data if available
    if (gymData.benchPress && gymData.benchPress.length > 0) {
      const benchMax = Math.max(...gymData.benchPress.map(e => e.weight));
      prompt += `- Bench Press PR: ${benchMax} lbs\n`;
    }
    if (gymData.squat && gymData.squat.length > 0) {
      const squatMax = Math.max(...gymData.squat.map(e => e.weight));
      prompt += `- Squat PR: ${squatMax} lbs\n`;
    }
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

/**
 * Get a one-liner for "Today's Dining Brief" based on user context
 */
export async function getDiningBriefOneLiner(userData) {
  if (!API_KEY) {
    return "Powered by fresh swipes from your dining hall.";
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const { preferences, userInfo, likedFoods, consumedFoods, caloricMaintenance, totalSwiped, diningHallLabel } = userData;
    
    let prompt = `Generate a short, engaging one-liner (max 60 characters) for a dining hall food recommendation app. 
    
Context:
- User has swiped on ${totalSwiped || 0} foods
- Dining hall: ${diningHallLabel || 'your dining hall'}
- Caloric maintenance: ${caloricMaintenance || 'not set'} calories
- Today's consumed foods: ${consumedFoods?.length || 0} items
- Liked foods: ${likedFoods?.length || 0} items

The one-liner should be:
- Short and punchy (max 60 characters)
- Motivating and personalized
- Reference their progress or dining hall
- Be friendly and encouraging

Examples:
- "Powered by 12 fresh swipes from Worcester."
- "Your taste profile is growing! Keep swiping."
- "Ready to discover your next favorite meal?"

Generate ONLY the one-liner, nothing else:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up the response (remove quotes, extra text)
    return text.replace(/^["']|["']$/g, '').split('\n')[0].trim();
  } catch (error) {
    console.error('Error getting dining brief:', error);
    return `Powered by ${totalSwiped || 'fresh'} swipes from ${diningHallLabel || 'your dining hall'}.`;
  }
}

/**
 * Get 3 personalized bullets for "NEXT UP" section based on user context
 */
export async function getNextUpBullets(userData) {
  if (!API_KEY) {
    return [
      'Balancing lean proteins with complex carbs.',
      `Keeping options open inside ${userData.diningHallLabel || 'your dining hall'}.`,
      userData.caloricMaintenance 
        ? `Working toward ${userData.caloricMaintenance} kcal today.`
        : 'Complete your profile to calculate caloric maintenance.'
    ];
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const { preferences, userInfo, likedFoods, consumedFoods, caloricMaintenance, diningHallLabel } = userData;
    
    // Calculate today's totals
    const todayTotals = consumedFoods?.reduce((acc, food) => ({
      calories: acc.calories + (parseFloat(food.calories) || 0),
      protein: acc.protein + (parseFloat(food.protein_g) || 0)
    }), { calories: 0, protein: 0 }) || { calories: 0, protein: 0 };
    
    const now = new Date();
    const hour = now.getHours();
    const mealTime = hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 20 ? 'dinner' : 'evening snack';
    
    let prompt = `Generate exactly 3 short, personalized bullet points (max 50 characters each) for a nutrition sidebar "NEXT UP" section.

Context:
- Current meal time: ${mealTime}
- Dining hall: ${diningHallLabel || 'your dining hall'}
- Caloric maintenance: ${caloricMaintenance || 'not set'} calories
- Today's calories consumed: ${Math.round(todayTotals.calories)} / ${caloricMaintenance || 'N/A'}
- Today's protein consumed: ${Math.round(todayTotals.protein)}g
- Dietary preferences: ${preferences?.isVegetarian ? 'Vegetarian' : preferences?.isVegan ? 'Vegan' : 'None'}, ${preferences?.isGlutenFree ? 'Gluten-Free' : ''}, ${preferences?.isDairyFree ? 'Dairy-Free' : ''}
- Liked foods: ${likedFoods?.length || 0} items

The bullets should:
- Be actionable and personalized
- Reference their current progress or goals
- Be encouraging and motivating
- Be concise (max 50 characters each)
- Focus on nutrition, meal timing, or goals

Format as a JSON array of exactly 3 strings, like: ["bullet 1", "bullet 2", "bullet 3"]
Return ONLY the JSON array, nothing else:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Try to parse JSON from response
    try {
      // Extract JSON array from response (might have markdown code blocks)
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const bullets = JSON.parse(jsonMatch[0]);
        if (Array.isArray(bullets) && bullets.length === 3) {
          return bullets.map(b => String(b).trim());
        }
      }
    } catch (parseError) {
      console.error('Error parsing bullets JSON:', parseError);
    }
    
    // Fallback: try to extract 3 lines
    const lines = text.split('\n').filter(l => l.trim()).slice(0, 3);
    if (lines.length === 3) {
      return lines.map(l => l.replace(/^[-*•]\s*/, '').replace(/^["']|["']$/g, '').trim());
    }
    
    // Final fallback
    return [
      'Balancing lean proteins with complex carbs.',
      `Keeping options open inside ${diningHallLabel || 'your dining hall'}.`,
      caloricMaintenance 
        ? `Working toward ${caloricMaintenance} kcal today.`
        : 'Complete your profile to calculate caloric maintenance.'
    ];
  } catch (error) {
    console.error('Error getting next up bullets:', error);
    return [
      'Balancing lean proteins with complex carbs.',
      `Keeping options open inside ${userData.diningHallLabel || 'your dining hall'}.`,
      userData.caloricMaintenance 
        ? `Working toward ${userData.caloricMaintenance} kcal today.`
        : 'Complete your profile to calculate caloric maintenance.'
    ];
  }
}

