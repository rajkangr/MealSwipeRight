import { useState, useEffect, useCallback } from 'react';
import './MealPlan.css';

function MealPlan({ caloricMaintenance, likedFoods, allFoods, preferences, consumedFoods = [], onConsumedFoodsChange }) {
  const [mealPlan, setMealPlan] = useState(null);
  const [targetMacros, setTargetMacros] = useState(null);
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

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
    // Helper function to parse nutrition values
    const parseNutrition = (value) => {
      if (!value || value === '' || value === 'N/A') return 0;
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    // Helper function to get macros from a food
    const getMacros = (food) => {
      return {
        calories: parseNutrition(food.calories),
        carbs: parseNutrition(food.total_carb_g),
        protein: parseNutrition(food.protein_g),
        fat: parseNutrition(food.total_fat_g)
      };
    };

    // ONLY use liked foods - filter to match liked foods from allFoods
    let likedFoodsList = [];
    
    // Match liked foods with foods from allFoods by name and location
    for (const likedFood of liked) {
      const matched = foods.find(f => 
        f.name === likedFood.name && f.location === likedFood.location
      );
      if (matched) {
        likedFoodsList.push(matched);
      }
    }

    // If no liked foods match, return empty plan
    if (likedFoodsList.length === 0) {
      return {
        foods: [],
        totals: { calories: 0, carbs: 0, protein: 0, fat: 0 },
        targets: targets
      };
    }

    // Sort liked foods by priority: calories first, then protein
    // We want foods that help us reach calorie target while maximizing protein
    likedFoodsList.sort((a, b) => {
      const aMacros = getMacros(a);
      const bMacros = getMacros(b);
      
      // Primary: prioritize high protein
      if (Math.abs(bMacros.protein - aMacros.protein) > 5) {
        return bMacros.protein - aMacros.protein;
      }
      
      // Secondary: prioritize calories that help reach target
      // Prefer foods with moderate calories (not too high, not too low)
      const targetCal = targets.calories;
      const idealCalPerFood = targetCal / 4; // Aim for ~4-5 foods per day
      
      const aCalScore = Math.abs(aMacros.calories - idealCalPerFood);
      const bCalScore = Math.abs(bMacros.calories - idealCalPerFood);
      
      return aCalScore - bCalScore;
    });

    // Greedy algorithm: select foods to match target calories and protein
    const selectedFoods = [];
    const foodNameCounts = new Map(); // Track how many times each food NAME is added (regardless of location)
    let currentCalories = 0;
    let currentCarbs = 0;
    let currentProtein = 0;
    let currentFat = 0;

    const targetCalories = targets.calories;
    const targetProtein = targets.protein;
    const minCalories = targetCalories - 300; // Within 300 calories below target
    const maxCalories = targetCalories + 200; // Allow up to 200 calories above target

    // Helper to check if we can add a food (max 1 time per food name)
    const canAddFood = (food) => {
      const foodName = food.name.toLowerCase().trim();
      const currentCount = foodNameCounts.get(foodName) || 0;
      return currentCount < 1; // Max 1 time per food name
    };

    // Helper to add a food to the meal plan
    const addFood = (food) => {
      const macros = getMacros(food);
      const foodName = food.name.toLowerCase().trim();
      
      selectedFoods.push({ ...food, mealType: 'liked' });
      currentCalories += macros.calories;
      currentCarbs += macros.carbs;
      currentProtein += macros.protein;
      currentFat += macros.fat;
      
      // Track count by food name (not location)
      foodNameCounts.set(foodName, (foodNameCounts.get(foodName) || 0) + 1);
    };

    // Helper to check if we should stop adding foods
    const shouldStop = () => {
      // Stop if we're within calorie range AND have good protein
      const caloriesGood = currentCalories >= minCalories && currentCalories <= maxCalories;
      const proteinGood = currentProtein >= targetProtein * 0.8; // At least 80% of protein target
      return caloriesGood && proteinGood;
    };

    // First pass: add foods prioritizing protein and calories
    for (const food of likedFoodsList) {
      if (shouldStop()) break;
      
      // Check if we can add this food (max 3 times per food name)
      if (!canAddFood(food)) continue;
      
      const macros = getMacros(food);
      const newCalories = currentCalories + macros.calories;
      
      // Add if it doesn't exceed max calories
      if (newCalories <= maxCalories) {
        addFood(food);
      }
    }

    // Second pass: if we're still below minimum calories, add more foods (including duplicates)
    if (currentCalories < minCalories) {
      // Sort by how well they help us reach targets (calories first, then protein)
      const sortedFoods = [...likedFoodsList].sort((a, b) => {
        const aMacros = getMacros(a);
        const bMacros = getMacros(b);
        
        // Calculate how much each food helps us reach targets
        const calRemaining = targetCalories - currentCalories;
        const protRemaining = targetProtein - currentProtein;
        
        // Score: how well does this food fill remaining needs?
        const aCalScore = Math.min(aMacros.calories, calRemaining) / calRemaining;
        const aProtScore = Math.min(aMacros.protein, protRemaining) / Math.max(protRemaining, 1);
        const aScore = aCalScore * 0.6 + aProtScore * 0.4; // 60% calories, 40% protein
        
        const bCalScore = Math.min(bMacros.calories, calRemaining) / calRemaining;
        const bProtScore = Math.min(bMacros.protein, protRemaining) / Math.max(protRemaining, 1);
        const bScore = bCalScore * 0.6 + bProtScore * 0.4;
        
        return bScore - aScore;
      });

      let attempts = 0;
      const maxAttempts = 200;
      
      while (currentCalories < minCalories && attempts < maxAttempts) {
        let added = false;
        
        for (const food of sortedFoods) {
          if (shouldStop()) break;
          
          // Check if we can add this food (max 3 times per food name)
          if (!canAddFood(food)) continue;
          
          const macros = getMacros(food);
          const newCalories = currentCalories + macros.calories;
          
          // Add if it helps us get closer to target
          if (newCalories <= maxCalories) {
            addFood(food);
            added = true;
            break;
          }
        }
        
        if (!added) break; // Can't add any more foods
        attempts++;
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
        <div className="meal-plan-foods-header">
          <h3>Recommended Foods ({mealPlan.foods.length} items)</h3>
          {onConsumedFoodsChange && (
            <button
              className="add-custom-food-button"
              onClick={() => setShowCustomFoodModal(true)}
              title="Add custom food"
            >
              +
            </button>
          )}
        </div>
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
              const foodKey = `${food.name}-${food.location}`;
              const consumedCount = consumedFoods.filter(cf => `${cf.name}-${cf.location}` === foodKey).length;
              const isFullyConsumed = consumedCount >= count;
              
              const handleToggleConsumed = () => {
                if (!onConsumedFoodsChange) return;
                
                if (isFullyConsumed) {
                  // Remove all instances from consumed foods
                  const updated = consumedFoods.filter(cf => `${cf.name}-${cf.location}` !== foodKey);
                  onConsumedFoodsChange(updated);
                } else {
                  // Add remaining instances to consumed foods
                  const remaining = count - consumedCount;
                  const toAdd = Array(remaining).fill(null).map(() => ({ ...food }));
                  onConsumedFoodsChange([...consumedFoods, ...toAdd]);
                }
              };
              
              return (
                <div key={index} className={`food-item ${food.mealType === 'liked' ? 'liked-food' : 'recommended-food'} ${isFullyConsumed ? 'consumed' : ''}`}>
                  <div className="food-item-header">
                    <h4>{food.name} {count > 1 && <span className="count-badge">×{count}</span>}</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {food.mealType === 'liked' && <span className="liked-badge">Liked</span>}
                      {onConsumedFoodsChange && (
                        <button
                          className={`consume-button ${isFullyConsumed ? 'consumed' : ''}`}
                          onClick={handleToggleConsumed}
                          title={isFullyConsumed ? 'Remove from daily intake' : 'Add to daily intake'}
                        >
                          {isFullyConsumed ? '✓ Added' : consumedCount > 0 ? `${consumedCount}/${count} Added` : 'Add'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="food-item-meta">
                    {food.location && (
                      <span className="food-location">📍 {food.location}</span>
                    )}
                    {food.meal_type && food.meal_type !== 'unknown' && (
                      <span className="food-meal-type">🍽️ {food.meal_type.charAt(0).toUpperCase() + food.meal_type.slice(1)}</span>
                    )}
                  </div>
                  <div className="food-item-nutrition">
                    <span>Calories: {Math.round(totalCalories)} {count > 1 && `(${Math.round(totalCalories / count)} each)`}</span>
                    <span>Protein: {Math.round(totalProtein)}g {count > 1 && `(${Math.round(totalProtein / count)}g each)`}</span>
                    <span>Carbs: {Math.round(totalCarbs)}g {count > 1 && `(${Math.round(totalCarbs / count)}g each)`}</span>
                    <span>Fat: {Math.round(totalFat)}g {count > 1 && `(${Math.round(totalFat / count)}g each)`}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Custom Food Modal */}
      {showCustomFoodModal && (
        <div className="custom-food-modal-overlay" onClick={() => setShowCustomFoodModal(false)}>
          <div className="custom-food-modal" onClick={(e) => e.stopPropagation()}>
            <div className="custom-food-modal-header">
              <h3>Add Custom Food</h3>
              <button className="close-button" onClick={() => setShowCustomFoodModal(false)}>×</button>
            </div>
            <div className="custom-food-modal-content">
              <div className="custom-food-field">
                <label>Food Name *</label>
                <input
                  type="text"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                  placeholder="e.g., Grilled Chicken Breast"
                />
              </div>
              <div className="custom-food-field">
                <label>Calories *</label>
                <input
                  type="number"
                  value={customFood.calories}
                  onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                  placeholder="e.g., 200"
                  min="0"
                />
              </div>
              <div className="custom-food-field">
                <label>Protein (g)</label>
                <input
                  type="number"
                  value={customFood.protein}
                  onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                  placeholder="e.g., 30"
                  min="0"
                />
              </div>
              <div className="custom-food-field">
                <label>Carbs (g)</label>
                <input
                  type="number"
                  value={customFood.carbs}
                  onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
                  placeholder="e.g., 0"
                  min="0"
                />
              </div>
              <div className="custom-food-field">
                <label>Fat (g)</label>
                <input
                  type="number"
                  value={customFood.fat}
                  onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
                  placeholder="e.g., 5"
                  min="0"
                />
              </div>
            </div>
            <div className="custom-food-modal-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowCustomFoodModal(false);
                  setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
                }}
              >
                Cancel
              </button>
              <button
                className="add-button"
                onClick={() => {
                  if (customFood.name && customFood.calories) {
                    const newFood = {
                      name: customFood.name,
                      calories: parseFloat(customFood.calories) || 0,
                      protein_g: parseFloat(customFood.protein) || 0,
                      total_carb_g: parseFloat(customFood.carbs) || 0,
                      total_fat_g: parseFloat(customFood.fat) || 0,
                      location: 'Custom'
                    };
                    onConsumedFoodsChange([...consumedFoods, newFood]);
                    setShowCustomFoodModal(false);
                    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
                  }
                }}
                disabled={!customFood.name || !customFood.calories}
              >
                Add Food
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealPlan;

