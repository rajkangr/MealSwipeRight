import { useState, useEffect, useCallback } from 'react';
import './MealPlan.css';

function MealPlan({ caloricMaintenance, likedFoods, allFoods, preferences }) {
  const [mealPlan, setMealPlan] = useState(null);
  const [targetMacros, setTargetMacros] = useState(null);

  // Calculate target macros (standard distribution: 40% carbs, 30% protein, 30% fat)
  useEffect(() => {
    if (caloricMaintenance) {
      const carbsCalories = caloricMaintenance * 0.4;
      const proteinCalories = caloricMaintenance * 0.3;
      const fatCalories = caloricMaintenance * 0.3;

      const carbsGrams = Math.round(carbsCalories / 4); // 4 calories per gram
      const proteinGrams = Math.round(proteinCalories / 4); // 4 calories per gram
      const fatGrams = Math.round(fatCalories / 9); // 9 calories per gram

      setTargetMacros({
        calories: caloricMaintenance,
        carbs: carbsGrams,
        protein: proteinGrams,
        fat: fatGrams
      });
    }
  }, [caloricMaintenance]);

  // Helper function to generate meal plan
  const generateMealPlan = useCallback((targets, liked, foods, prefs) => {
    // Filter foods based on preferences
    let availableFoods = [...foods];

    if (prefs?.diningHall) {
      availableFoods = availableFoods.filter(f => f.location === prefs.diningHall);
    }

    if (prefs?.isVegetarian || prefs?.isVegan) {
      availableFoods = availableFoods.filter(f => {
        const dietTypes = (f.diet_types || '').toLowerCase();
        return dietTypes.includes('vegetarian') || dietTypes.includes('vegan');
      });
    }

    if (prefs?.isGlutenFree) {
      availableFoods = availableFoods.filter(f => {
        const dietTypes = (f.diet_types || '').toLowerCase();
        return dietTypes.includes('gluten free');
      });
    }

    if (prefs?.isDairyFree) {
      availableFoods = availableFoods.filter(f => {
        const allergens = (f.allergens || '').toLowerCase();
        return !allergens.includes('milk') && !allergens.includes('dairy');
      });
    }

    if (prefs?.isKeto) {
      availableFoods = availableFoods.filter(f => {
        const dietTypes = (f.diet_types || '').toLowerCase();
        return dietTypes.includes('keto');
      });
    }

    // Prioritize liked foods
    const likedFoodsList = availableFoods.filter(f => 
      liked.some(lf => lf.name === f.name && lf.location === f.location)
    );

    // Helper function to parse nutrition values
    const parseNutrition = (value) => {
      if (!value || value === '' || value === 'N/A') return 0;
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    // Helper function to get calories from a food
    const getCalories = (food) => {
      return parseNutrition(food.calories);
    };

    // Helper function to get macros from a food
    const getMacros = (food) => {
      return {
        calories: getCalories(food),
        carbs: parseNutrition(food.total_carb_g),
        protein: parseNutrition(food.protein_g),
        fat: parseNutrition(food.total_fat_g)
      };
    };

    // Greedy algorithm to select foods - aim for target calories
    const selectedFoods = [];
    const foodCounts = new Map(); // Track how many times each food is added
    let currentCalories = 0;
    let currentCarbs = 0;
    let currentProtein = 0;
    let currentFat = 0;

    const targetCalories = targets.calories;
    const minCalories = targetCalories - 400; // Within 400 calories below target
    const maxCalories = targetCalories + 100; // Allow up to 100 calories above target

    // Helper to add a food to the meal plan
    const addFood = (food, mealType) => {
      const macros = getMacros(food);
      const foodKey = `${food.name}-${food.location}`;
      
      selectedFoods.push({ ...food, mealType });
      currentCalories += macros.calories;
      currentCarbs += macros.carbs;
      currentProtein += macros.protein;
      currentFat += macros.fat;
      
      // Track count
      foodCounts.set(foodKey, (foodCounts.get(foodKey) || 0) + 1);
    };

    // Helper to check if we should stop adding foods
    const shouldStop = () => {
      return currentCalories >= minCalories && currentCalories <= maxCalories;
    };

    // First, add liked foods one by one until we're close to target
    for (const food of likedFoodsList) {
      if (shouldStop()) break;
      
      const macros = getMacros(food);
      const newCalories = currentCalories + macros.calories;
      
      // Only add if it doesn't exceed max by too much
      if (newCalories <= maxCalories + 50) {
        addFood(food, 'liked');
      }
    }

    // If we still need more calories, add from all available foods (unique foods only)
    const remainingFoods = availableFoods.filter(f => {
      const foodKey = `${f.name}-${f.location}`;
      return !foodCounts.has(foodKey); // Only foods we haven't added yet
    });

    // Sort foods by protein content (descending) to prioritize high-protein foods
    remainingFoods.sort((a, b) => {
      const aProtein = parseNutrition(a.protein_g);
      const bProtein = parseNutrition(b.protein_g);
      return bProtein - aProtein;
    });

    // Add unique foods until we're close to target
    for (const food of remainingFoods) {
      if (shouldStop()) break;

      const macros = getMacros(food);
      const newCalories = currentCalories + macros.calories;
      
      // Add food if it helps us get closer to target without exceeding too much
      if (newCalories <= maxCalories + 50) {
        addFood(food, 'recommended');
      }
    }

    // If we're still below the minimum (more than 400 calories away), add duplicates
    if (currentCalories < minCalories && availableFoods.length > 0) {
      // Create a combined list of all foods (liked first, then others)
      const allFoodsCombined = [...likedFoodsList, ...remainingFoods];
      
      // Sort by how well they help us reach the target
      allFoodsCombined.sort((a, b) => {
        const aMacros = getMacros(a);
        const bMacros = getMacros(b);
        const aRemaining = targetCalories - currentCalories;
        const bRemaining = targetCalories - currentCalories;
        
        // Prefer foods that get us closer to target
        const aScore = Math.abs(aRemaining - aMacros.calories);
        const bScore = Math.abs(bRemaining - bMacros.calories);
        return aScore - bScore;
      });

      // Add duplicates until we're within range
      let attempts = 0;
      const maxAttempts = 100; // Prevent infinite loops
      
      while (currentCalories < minCalories && attempts < maxAttempts) {
        let added = false;
        
        for (const food of allFoodsCombined) {
          if (shouldStop()) break;
          
          const macros = getMacros(food);
          const newCalories = currentCalories + macros.calories;
          
          // Add duplicate if it helps us get closer to target
          if (newCalories <= maxCalories + 100) {
            addFood(food, foodCounts.has(`${food.name}-${food.location}`) ? 'recommended' : 'liked');
            added = true;
            break;
          }
        }
        
        if (!added) break; // Can't add any more foods
        attempts++;
      }
    }

    // If we still have no foods, add at least a few
    if (selectedFoods.length === 0 && availableFoods.length > 0) {
      const foodsToAdd = availableFoods.slice(0, Math.min(5, availableFoods.length));
      for (const food of foodsToAdd) {
        addFood(food, 'recommended');
        if (currentCalories >= targetCalories * 0.5) break; // At least get to 50% of target
      }
    }

    return {
      foods: selectedFoods,
      totals: {
        calories: Math.round(currentCalories),
        carbs: Math.round(currentCarbs),
        protein: Math.round(currentProtein),
        fat: Math.round(currentFat)
      },
      targets: targets
    };
  }, []);

  // Generate meal plan
  useEffect(() => {
    if (targetMacros && allFoods.length > 0) {
      const plan = generateMealPlan(targetMacros, likedFoods, allFoods, preferences);
      setMealPlan(plan);
    }
  }, [targetMacros, likedFoods, allFoods, preferences, generateMealPlan]);

  if (!mealPlan || !targetMacros) {
    return (
      <div className="meal-plan-section">
        <p>Generating your personalized meal plan...</p>
      </div>
    );
  }

  return (
    <div className="meal-plan-section">
      <h2>🍽️ Your Personalized Meal Plan</h2>
      <p className="plan-description">
        Based on your daily caloric maintenance of <strong>{caloricMaintenance} calories</strong>
      </p>

      <div className="macros-summary">
        <div className="macro-target">
          <h3>Target Macros</h3>
          <div className="macro-values">
            <div className="macro-item">
              <span className="macro-label">Calories:</span>
              <span className="macro-value">{targetMacros.calories}</span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Carbs:</span>
              <span className="macro-value">{targetMacros.carbs}g</span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Protein:</span>
              <span className="macro-value">{targetMacros.protein}g</span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Fat:</span>
              <span className="macro-value">{targetMacros.fat}g</span>
            </div>
          </div>
        </div>

        <div className="macro-actual">
          <h3>Meal Plan Totals</h3>
          <div className="macro-values">
            <div className="macro-item">
              <span className="macro-label">Calories:</span>
              <span className={`macro-value ${Math.abs(mealPlan.totals.calories - targetMacros.calories) < 100 ? 'on-target' : 'off-target'}`}>
                {mealPlan.totals.calories}
              </span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Carbs:</span>
              <span className={`macro-value ${Math.abs(mealPlan.totals.carbs - targetMacros.carbs) < 20 ? 'on-target' : 'off-target'}`}>
                {mealPlan.totals.carbs}g
              </span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Protein:</span>
              <span className={`macro-value ${Math.abs(mealPlan.totals.protein - targetMacros.protein) < 20 ? 'on-target' : 'off-target'}`}>
                {mealPlan.totals.protein}g
              </span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Fat:</span>
              <span className={`macro-value ${Math.abs(mealPlan.totals.fat - targetMacros.fat) < 15 ? 'on-target' : 'off-target'}`}>
                {mealPlan.totals.fat}g
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="meal-plan-foods">
        <h3>Recommended Foods ({mealPlan.foods.length} items)</h3>
        <div className="foods-list">
          {(() => {
            // Group foods by name and location to show counts
            const foodGroups = new Map();
            mealPlan.foods.forEach((food) => {
              const key = `${food.name}-${food.location}`;
              if (!foodGroups.has(key)) {
                foodGroups.set(key, {
                  food,
                  count: 0,
                  totalCalories: 0,
                  totalCarbs: 0,
                  totalProtein: 0,
                  totalFat: 0
                });
              }
              const group = foodGroups.get(key);
              group.count++;
              const macros = {
                calories: parseFloat(food.calories) || 0,
                carbs: parseFloat(food.total_carb_g) || 0,
                protein: parseFloat(food.protein_g) || 0,
                fat: parseFloat(food.total_fat_g) || 0
              };
              group.totalCalories += macros.calories;
              group.totalCarbs += macros.carbs;
              group.totalProtein += macros.protein;
              group.totalFat += macros.fat;
            });

            const parseNutrition = (value) => {
              if (!value || value === '' || value === 'N/A') return 0;
              const num = parseFloat(value);
              return isNaN(num) ? 0 : num;
            };

            return Array.from(foodGroups.values()).map((group, index) => {
              const { food, count, totalCalories, totalCarbs, totalProtein, totalFat } = group;
              return (
                <div key={index} className={`food-item ${food.mealType === 'liked' ? 'liked-food' : 'recommended-food'}`}>
                  <div className="food-item-header">
                    <h4>{food.name} {count > 1 && <span className="count-badge">×{count}</span>}</h4>
                    {food.mealType === 'liked' && <span className="liked-badge">❤️ Liked</span>}
                  </div>
                  <div className="food-item-nutrition">
                    <span>Calories: {Math.round(totalCalories)} {count > 1 && `(${Math.round(totalCalories / count)} each)`}</span>
                    <span>Protein: {Math.round(totalProtein)}g {count > 1 && `(${Math.round(totalProtein / count)}g each)`}</span>
                    <span>Carbs: {Math.round(totalCarbs)}g {count > 1 && `(${Math.round(totalCarbs / count)}g each)`}</span>
                    <span>Fat: {Math.round(totalFat)}g {count > 1 && `(${Math.round(totalFat / count)}g each)`}</span>
                  </div>
                  {food.meal_type && food.meal_type !== 'unknown' && (
                    <div className="food-item-type">Meal Type: {food.meal_type}</div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}

export default MealPlan;

