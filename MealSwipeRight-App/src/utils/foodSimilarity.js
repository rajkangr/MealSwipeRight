/**
 * Food similarity and recommendation utilities
 */

// Common stop words to ignore when extracting keywords
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
]);

/**
 * Extract keywords from a food name
 * @param {string} foodName - The name of the food
 * @returns {Set<string>} Set of keywords
 */
export function extractKeywords(foodName) {
  if (!foodName) return new Set();
  
  // Convert to lowercase and split by common separators
  const words = foodName
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word)); // Filter short words and stop words
  
  return new Set(words);
}

/**
 * Calculate similarity score between two foods
 * @param {Object} food1 - First food object
 * @param {Object} food2 - Second food object
 * @returns {number} Similarity score (0-1)
 */
export function calculateSimilarity(food1, food2) {
  if (!food1 || !food2) return 0;
  
  let score = 0;
  let maxScore = 0;
  
  // 1. Name similarity (60% weight - increased for exact name matches)
  const name1 = (food1.name || '').toLowerCase().trim();
  const name2 = (food2.name || '').toLowerCase().trim();
  maxScore += 0.6;
  
  if (name1 === name2) {
    // Exact name match - highest priority (same food, different location)
    score += 0.6; // Full score for exact name match
    return 1.0; // Return maximum similarity for same food name
  } else {
    // Keyword matching
    const keywords1 = extractKeywords(name1);
    const keywords2 = extractKeywords(name2);
    
    if (keywords1.size > 0 && keywords2.size > 0) {
      const commonKeywords = [...keywords1].filter(k => keywords2.has(k));
      const totalKeywords = new Set([...keywords1, ...keywords2]).size;
      const keywordScore = commonKeywords.length / totalKeywords;
      score += keywordScore * 0.6;
      
      // Bonus for exact keyword match (e.g., "pizza" in both)
      if (commonKeywords.length > 0) {
        score += Math.min(0.1, commonKeywords.length * 0.05);
      }
    }
    
    // Check if one name contains the other (e.g., "cheese pizza" contains "pizza")
    if (name1.includes(name2) || name2.includes(name1)) {
      score += 0.3;
    }
  }
  
  // 2. Category similarity (15% weight - reduced since name is more important)
  const category1 = (food1.category || '').toLowerCase();
  const category2 = (food2.category || '').toLowerCase();
  maxScore += 0.15;
  
  if (category1 && category2) {
    if (category1 === category2) {
      score += 0.15;
    } else if (category1.includes(category2) || category2.includes(category1)) {
      score += 0.08;
    }
  }
  
  // 3. Meal type similarity (10% weight)
  const mealType1 = (food1.meal_type || '').toLowerCase();
  const mealType2 = (food2.meal_type || '').toLowerCase();
  maxScore += 0.1;
  
  if (mealType1 && mealType2 && mealType1 === mealType2 && mealType1 !== 'unknown') {
    score += 0.1;
  }
  
  // 4. Ingredient/keyword matching in name (15% weight)
  // Look for common food groups/ingredients
  const foodGroups = [
    'chicken', 'beef', 'pork', 'fish', 'egg', 'eggs', 'cheese', 'pizza', 'pasta',
    'rice', 'bread', 'salad', 'soup', 'sandwich', 'burger', 'fries', 'potato',
    'vegetable', 'fruit', 'dessert', 'cake', 'cookie', 'ice cream', 'yogurt',
    'milk', 'cereal', 'oatmeal', 'pancake', 'waffle', 'toast', 'bagel'
  ];
  
  maxScore += 0.15;
  for (const group of foodGroups) {
    const hasGroup1 = name1.includes(group);
    const hasGroup2 = name2.includes(group);
    
    if (hasGroup1 && hasGroup2) {
      score += 0.15;
      break; // Only count once
    }
  }
  
  // Normalize score
  return maxScore > 0 ? Math.min(1, score / maxScore) : 0;
}

/**
 * Find foods that should be auto-liked based on a newly liked food
 * @param {Object} likedFood - The food that was just liked
 * @param {Array} allFoods - Array of all available foods
 * @param {Array} alreadyLikedFoods - Array of foods already liked (to avoid duplicates)
 * @returns {Array} Array of foods that should be auto-liked
 */
export function findAutoLikeFoods(likedFood, allFoods, alreadyLikedFoods = []) {
  if (!likedFood || !allFoods || allFoods.length === 0) {
    return [];
  }
  
  const likedName = (likedFood.name || '').toLowerCase().trim();
  const likedLocation = likedFood.location || '';
  
  // Create a set of already liked food keys
  const alreadyLikedKeys = new Set();
  alreadyLikedFoods.forEach(food => {
    const key = `${food.name}-${food.location}`;
    alreadyLikedKeys.add(key);
  });
  
  const autoLikeFoods = [];
  
  for (const food of allFoods) {
    const foodKey = `${food.name}-${food.location}`;
    
    // Skip if already liked
    if (alreadyLikedKeys.has(foodKey)) {
      continue;
    }
    
    const foodName = (food.name || '').toLowerCase().trim();
    
    // Auto-like if exact name match (same food, different location)
    if (foodName === likedName && food.location !== likedLocation) {
      autoLikeFoods.push(food);
    }
  }
  
  return autoLikeFoods;
}

/**
 * Find similar foods based on liked foods (for sorting/prioritizing)
 * @param {Array} likedFoods - Array of liked food objects
 * @param {Array} allFoods - Array of all available foods
 * @returns {Array} Array of foods sorted by similarity
 */
export function findSimilarFoods(likedFoods, allFoods) {
  if (!likedFoods || likedFoods.length === 0 || !allFoods || allFoods.length === 0) {
    return allFoods;
  }
  
  // Create a map of foods by key (name-location) to avoid duplicates
  const foodMap = new Map();
  allFoods.forEach(food => {
    const key = `${food.name}-${food.location}`;
    if (!foodMap.has(key)) {
      foodMap.set(key, food);
    }
  });
  
  // Check which liked foods are already in the list
  const likedKeys = new Set();
  likedFoods.forEach(liked => {
    const key = `${liked.name}-${liked.location}`;
    likedKeys.add(key);
  });
  
  // Calculate similarity scores for each food
  const foodsWithScores = Array.from(foodMap.values()).map(food => {
    const foodKey = `${food.name}-${food.location}`;
    
    // Skip if already liked
    if (likedKeys.has(foodKey)) {
      return { food, score: -1 }; // Negative score to push to end
    }
    
    // Calculate max similarity across all liked foods
    let maxSimilarity = 0;
    for (const likedFood of likedFoods) {
      const similarity = calculateSimilarity(likedFood, food);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    return { food, score: maxSimilarity };
  });
  
  // Sort by similarity score (highest first), then by name
  foodsWithScores.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.01) {
      return b.score - a.score; // Higher score first
    }
    return a.food.name.localeCompare(b.food.name); // Alphabetical as tiebreaker
  });
  
  // Return just the foods
  return foodsWithScores.map(item => item.food);
}

/**
 * Get recommendation reason for why a food is similar
 * @param {Object} food - The food to explain
 * @param {Array} likedFoods - Array of liked foods
 * @returns {string} Reason why this food is recommended
 */
export function getRecommendationReason(food, likedFoods) {
  if (!likedFoods || likedFoods.length === 0) return '';
  
  const foodName = (food.name || '').toLowerCase();
  const foodKeywords = extractKeywords(foodName);
  
  // Find the most similar liked food
  let bestMatch = null;
  let bestScore = 0;
  
  for (const likedFood of likedFoods) {
    const score = calculateSimilarity(likedFood, food);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = likedFood;
    }
  }
  
  if (!bestMatch || bestScore < 0.3) return '';
  
  const likedName = (bestMatch.name || '').toLowerCase();
  const likedKeywords = extractKeywords(likedName);
  
  // Find common keywords
  const commonKeywords = [...foodKeywords].filter(k => likedKeywords.has(k));
  
  if (commonKeywords.length > 0) {
    const mainKeyword = commonKeywords[0];
    return `Similar to ${bestMatch.name} (${mainKeyword})`;
  }
  
  if (foodName.includes(likedName) || likedName.includes(foodName)) {
    return `Similar to ${bestMatch.name}`;
  }
  
  return `You liked ${bestMatch.name}`;
}

