import { useState, useEffect, useRef, useMemo } from 'react';
import FoodCard from '../components/FoodCard';
import Settings from '../components/Settings';
import MealPlan from '../components/MealPlan';
import { loadFoodData } from '../utils/foodDataLoader';
import { findSimilarFoods, findAutoLikeFoods } from '../utils/foodSimilarity';
import { getDiningBriefOneLiner } from '../utils/geminiClient';
import './SwipingPage.css';

function SwipingPage({
  preferences,
  onPreferencesChange,
  userInfo,
  onUserInfoChange,
  onLikedFoodsChange,
  swipingState,
  onSwipingStateChange,
  caloricMaintenance,
  onCaloricMaintenanceChange,
  experienceMode = 'dashboard',
  onboardingTarget = 5,
  onAllSwipesComplete,
  consumedFoods = [],
  onConsumedFoodsChange
}) {
  const [allFoods, setAllFoods] = useState([]);
  const [foods, setFoods] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedFoods, setLikedFoods] = useState([]);
  const [dislikedFoods, setDislikedFoods] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isInitialMount = useRef(true);
  const prevPreferencesRef = useRef(null);
  const hasNotifiedCompletion = useRef(false);

  const targetSwipes = Math.max(1, onboardingTarget);
  const totalSwiped = likedFoods.length + dislikedFoods.length;
  const hasTasteProfile = totalSwiped >= targetSwipes;
  const showImmersive = experienceMode === 'onboarding' && !hasTasteProfile;
  const isOnboardingMode = experienceMode === 'onboarding';
  const diningHallLabel = preferences?.diningHall && Array.isArray(preferences.diningHall) && preferences.diningHall.length > 0
    ? preferences.diningHall.length === 1
      ? `${preferences.diningHall[0].charAt(0).toUpperCase()}${preferences.diningHall[0].slice(1)}`
      : `${preferences.diningHall.length} dining halls`
    : preferences?.diningHall && !Array.isArray(preferences.diningHall)
    ? `${preferences.diningHall.charAt(0).toUpperCase()}${preferences.diningHall.slice(1)}`
    : 'your dining hall';
  const userName = (userInfo?.name || '').split(' ')[0] || 'Athlete';
  const mealWindow = getMealWindowDetails();
  const heroTitle = showImmersive ? "You're almost there!" : "Today's dining brief";
  const [heroSubtitle, setHeroSubtitle] = useState(
    showImmersive
      ? `Swipe ${Math.max(targetSwipes - totalSwiped, 0)} more dishes to unlock your personalized dashboard.`
      : `Powered by ${totalSwiped || 'fresh'} swipes from ${diningHallLabel}.`
  );
  const progressPercent = Math.min(100, Math.round((totalSwiped / targetSwipes) * 100));
  const remainingFoods = Math.max(foods.length - currentIndex, 0);

  // Restore state from parent only on initial mount
  useEffect(() => {
    if (isInitialMount.current && swipingState) {
      const prevDiningHall = swipingState.preferences?.diningHall;
      const prevDiningHallStr = Array.isArray(prevDiningHall) ? prevDiningHall.sort().join(',') : prevDiningHall;
      const currentDiningHallStr = Array.isArray(preferences?.diningHall) ? preferences.diningHall.sort().join(',') : preferences?.diningHall;
      if (prevDiningHallStr === currentDiningHallStr) {
        setCurrentIndex(swipingState.currentIndex || 0);
        setLikedFoods(swipingState.likedFoods || []);
        setDislikedFoods(swipingState.dislikedFoods || []);
      }
      isInitialMount.current = false;
      prevPreferencesRef.current = Array.isArray(preferences?.diningHall) ? preferences.diningHall.sort().join(',') : preferences?.diningHall;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle preferences changes separately
  useEffect(() => {
    if (!isInitialMount.current) {
      const prevDiningHall = prevPreferencesRef.current;
      const currentDiningHall = Array.isArray(preferences?.diningHall) ? preferences.diningHall.sort().join(',') : preferences?.diningHall;

      if (prevDiningHall !== currentDiningHall) {
        setCurrentIndex(0);
        setLikedFoods([]);
        setDislikedFoods([]);
        hasNotifiedCompletion.current = false;
        prevPreferencesRef.current = currentDiningHall;
      }
    }
  }, [preferences?.diningHall]);

  // Load food data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const foodData = await loadFoodData();
        const foodsArray = Array.isArray(foodData) ? foodData : (foodData.foods || []);
        const processedFoods = foodsArray.map((food) => ({
          ...food,
          calories: safeString(food.calories),
          calories_from_fat: safeString(food.calories_from_fat),
          total_fat_g: safeString(food.total_fat_g),
          saturated_fat_g: safeString(food.saturated_fat_g),
          trans_fat_g: safeString(food.trans_fat_g),
          cholesterol_mg: safeString(food.cholesterol_mg),
          sodium_mg: safeString(food.sodium_mg),
          total_carb_g: safeString(food.total_carb_g),
          dietary_fiber_g: safeString(food.dietary_fiber_g),
          sugars_g: safeString(food.sugars_g),
          protein_g: safeString(food.protein_g),
          diet_types: food.diet_types || '',
          allergens: food.allergens || '',
          category: food.category || '',
          meal_type: food.meal_type || 'unknown'
        }));
        setAllFoods(processedFoods);
      } catch (error) {
        console.error('Error loading food data:', error);
        setAllFoods([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Persist swiping state
  useEffect(() => {
    if (!isInitialMount.current && onSwipingStateChange) {
      const allComplete = foods.length > 0 && currentIndex >= foods.length;
      onSwipingStateChange({
        currentIndex,
        likedFoods,
        dislikedFoods,
        preferences,
        totalFoodsAvailable: foods.length,
        allSwipesComplete: allComplete
      });
    }
  }, [currentIndex, likedFoods, dislikedFoods, preferences, foods.length, onSwipingStateChange]);

  // Filter foods based on preferences and prioritize similar foods
  useEffect(() => {
    const diningHalls = Array.isArray(preferences?.diningHall) 
      ? preferences.diningHall 
      : (preferences?.diningHall ? [preferences.diningHall] : []);
    
    if (!preferences || diningHalls.length === 0 || isLoading) {
      setFoods([]);
      return;
    }

    let filtered = [...allFoods];

    if (diningHalls.length > 0) {
      filtered = filtered.filter((food) => diningHalls.includes(food.location));
    }

    if (preferences.isVegetarian || preferences.isVegan) {
      filtered = filtered.filter((food) => {
        const dietTypes = (food.diet_types || '').toLowerCase();
        return dietTypes.includes('vegetarian') || dietTypes.includes('vegan');
      });
    }

    if (preferences.isGlutenFree) {
      filtered = filtered.filter((food) => {
        const dietTypes = (food.diet_types || '').toLowerCase();
        return dietTypes.includes('gluten free');
      });
    }

    if (preferences.isDairyFree) {
      filtered = filtered.filter((food) => {
        const allergens = (food.allergens || '').toLowerCase();
        return !allergens.includes('milk') && !allergens.includes('dairy');
      });
    }

    if (preferences.isKeto) {
      filtered = filtered.filter((food) => {
        const dietTypes = (food.diet_types || '').toLowerCase();
        return dietTypes.includes('keto');
      });
    }

    // Remove foods that are already liked (including auto-liked similar foods)
    const likedKeys = new Set();
    likedFoods.forEach(food => {
      const key = `${food.name}-${food.location}`;
      likedKeys.add(key);
    });
    
    filtered = filtered.filter(food => {
      const key = `${food.name}-${food.location}`;
      return !likedKeys.has(key);
    });

    // If user has liked foods, prioritize similar foods for remaining items
    if (likedFoods.length > 0 && filtered.length > 0) {
      filtered = findSimilarFoods(likedFoods, filtered);
    }

    setFoods(filtered);
  }, [preferences, allFoods, isLoading, likedFoods]);

  // Check if all swipes are complete and notify parent
  useEffect(() => {
    if (onAllSwipesComplete && !isLoading && foods.length > 0 && currentIndex >= foods.length && !hasNotifiedCompletion.current) {
      hasNotifiedCompletion.current = true;
      onAllSwipesComplete();
    }
  }, [currentIndex, foods.length, isLoading, onAllSwipesComplete]);

  // Reset completion notification when callback changes (e.g., new swiping session)
  useEffect(() => {
    if (onAllSwipesComplete) {
      hasNotifiedCompletion.current = false;
    }
  }, [onAllSwipesComplete]);

  // Get Gemini-powered dining brief one-liner (only for dashboard mode, not onboarding)
  useEffect(() => {
    if (!showImmersive && experienceMode === 'dashboard' && !isLoading) {
      const fetchDiningBrief = async () => {
        try {
          const oneLiner = await getDiningBriefOneLiner({
            preferences,
            userInfo,
            likedFoods,
            consumedFoods,
            caloricMaintenance,
            totalSwiped,
            diningHallLabel
          });
          setHeroSubtitle(oneLiner);
        } catch (error) {
          console.error('Error fetching dining brief:', error);
          // Fallback to default
          setHeroSubtitle(`Powered by ${totalSwiped || 'fresh'} swipes from ${diningHallLabel}.`);
        }
      };
      fetchDiningBrief();
    }
  }, [showImmersive, experienceMode, isLoading, preferences, userInfo, likedFoods, consumedFoods, caloricMaintenance, totalSwiped, diningHallLabel]);

  const handleSwipe = (direction) => {
    if (currentIndex >= foods.length) return;

    const currentFood = foods[currentIndex];
    let autoLikeFoods = [];
    let newIndex = currentIndex + 1;

    if (direction === 'right') {
      // Find similar foods that should be auto-liked (especially same name from different locations)
      autoLikeFoods = findAutoLikeFoods(currentFood, allFoods, likedFoods);
      
      // Add current food and all auto-liked similar foods
      const updatedLikedFoods = [...likedFoods, currentFood, ...autoLikeFoods];
      setLikedFoods(updatedLikedFoods);
      onLikedFoodsChange?.(updatedLikedFoods);
      
      // Skip over auto-liked foods in the queue
      const autoLikeKeys = new Set(autoLikeFoods.map(f => `${f.name}-${f.location}`));
      
      // Skip any foods that were auto-liked
      while (newIndex < foods.length) {
        const nextFood = foods[newIndex];
        const nextFoodKey = `${nextFood.name}-${nextFood.location}`;
        if (!autoLikeKeys.has(nextFoodKey)) {
          break;
        }
        newIndex++;
      }
      
      setCurrentIndex(newIndex);
    } else {
      setDislikedFoods([...dislikedFoods, currentFood]);
      setCurrentIndex(newIndex);
    }

    // If this was the last food, trigger smooth transition
    if (newIndex >= foods.length) {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  };

  const handleButtonSwipe = (direction) => {
    handleSwipe(direction);
  };

  const stats = [
    { label: 'Liked', value: likedFoods.length, tone: 'liked' },
    { label: 'Passed', value: dislikedFoods.length, tone: 'disliked' },
    { label: 'Remaining', value: remainingFoods, tone: 'neutral' }
  ];

  const hasDiningHalls = Array.isArray(preferences?.diningHall) 
    ? preferences.diningHall.length > 0
    : (preferences?.diningHall ? true : false);
  
  if (!preferences || !hasDiningHalls) {
    return (
      <div className="swiping-page swiping-page--empty">
        <div className="swiping-hero">
          <div className="hero-pill">{mealWindow.label} · {mealWindow.time}</div>
          <h1>Let's personalize your dining pass</h1>
          <p>Choose your dining hall, goals, and allergens so we can curate the perfect menu.</p>
          <button className="setup-button primary" onClick={() => setShowSettings(true)}>
            Set Preferences
          </button>
        </div>
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          preferences={preferences}
          onPreferencesChange={onPreferencesChange}
          userInfo={userInfo}
          onUserInfoChange={onUserInfoChange}
        />
      </div>
    );
  }

  // If in onboarding mode, wrap in onboarding-style container
  if (isOnboardingMode) {
    return (
      <div className="swiping-onboarding-container">
        <div className="swiping-onboarding-background" />
        <div className="swiping-onboarding-card">
          <div className="swiping-onboarding-header">
            <h1>Let's build your taste profile</h1>
            <p>Swipe through dishes to help us understand your preferences</p>
            <div className="swiping-onboarding-progress">
              <div className="swiping-onboarding-progress-track">
                <div 
                  className="swiping-onboarding-progress-fill" 
                  style={{ width: `${foods.length > 0 ? Math.min(100, Math.round((totalSwiped / foods.length) * 100)) : 0}%` }} 
                />
              </div>
              <div className="swiping-onboarding-progress-text">
                {totalSwiped} of {foods.length || '...'} dishes reviewed
              </div>
            </div>
          </div>

          <div className="swiping-onboarding-content">
            {isLoading ? (
              <div className="swiping-onboarding-loading">
                <h2>Loading...</h2>
                <p>Pulling the latest dining options.</p>
              </div>
            ) : foods.length === 0 ? (
              <div className="swiping-onboarding-loading">
                <h2>No Foods Found</h2>
                <p>No foods match your preferences. Try adjusting your settings!</p>
                <button className="swiping-onboarding-button" onClick={() => setShowSettings(true)}>
                  Change Settings
                </button>
              </div>
            ) : currentIndex < foods.length || isTransitioning ? (
              <>
                <div className={`swiping-onboarding-card-stack ${isTransitioning ? 'fade-out' : ''}`}>
                  {currentIndex < foods.length && foods.slice(currentIndex, currentIndex + 3).map((food, index) => (
                    <FoodCard
                      key={`${food.name}-${currentIndex + index}`}
                      food={food}
                      onSwipe={handleSwipe}
                      index={index}
                    />
                  ))}
                </div>

                {!isTransitioning && (
                  <div className="swiping-onboarding-actions">
                    <button
                      className="swiping-onboarding-action-button dislike"
                      onClick={() => handleButtonSwipe('left')}
                      aria-label="Dislike"
                    >
                      <span className="button-icon">👎</span>
                      <span>Pass</span>
                    </button>
                    <button
                      className="swiping-onboarding-action-button like"
                      onClick={() => handleButtonSwipe('right')}
                      aria-label="Like"
                    >
                      <span className="button-icon">❤️</span>
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="swiping-onboarding-complete fade-in">
                <h2>All Done!</h2>
                <p>You've swiped through all the food options.</p>
                <div className="swiping-onboarding-stats">
                  <div className="swiping-onboarding-stat">
                    <span className="stat-value liked">{likedFoods.length}</span>
                    <span className="stat-label">Liked Foods</span>
                  </div>
                  <div className="swiping-onboarding-stat">
                    <span className="stat-value disliked">{dislikedFoods.length}</span>
                    <span className="stat-label">Passed Foods</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Settings
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            preferences={preferences}
            onPreferencesChange={onPreferencesChange}
            userInfo={userInfo}
            onUserInfoChange={onUserInfoChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`swiping-page ${showImmersive ? 'swiping-page--immersive' : 'swiping-page--profile-ready'}`}>
      <div className="swiping-content">
        {/* Only show swipe panel if there are still foods to swipe - appears first */}
        {currentIndex < foods.length && (
          <section className="swipe-panel">
            <div className="swipe-panel-header">
              <div>
                <p className="panel-eyebrow">Swipe & refine</p>
                <h2>{showImmersive ? 'Teach us your taste' : 'Keep tuning your picks'}</h2>
                <p className="panel-subtitle">Dining at {diningHallLabel}</p>
              </div>
              <div className="stats-bar">
                {stats.map((stat) => (
                  <span key={stat.label} className={`stat-item ${stat.tone}`}>
                    <span className="stat-label">{stat.label}</span>
                    <span className={`stat-value ${stat.tone}`}>{stat.value}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="swiping-main">
            {isLoading ? (
              <div className="end-screen glass">
                <h2>Loading...</h2>
                <p>Pulling the latest dining options.</p>
              </div>
            ) : foods.length === 0 ? (
              <div className="end-screen glass">
                <h2>No Foods Found</h2>
                <p>No foods match your preferences. Try adjusting your settings!</p>
                <button className="reset-button" onClick={() => setShowSettings(true)}>
                  Change Settings
                </button>
              </div>
            ) : currentIndex < foods.length || isTransitioning ? (
              <>
                <div className={`card-stack ${isTransitioning ? 'fade-out' : ''}`}>
                  {currentIndex < foods.length && foods.slice(currentIndex, currentIndex + 3).map((food, index) => (
                    <FoodCard
                      key={`${food.name}-${currentIndex + index}`}
                      food={food}
                      onSwipe={handleSwipe}
                      index={index}
                    />
                  ))}
                </div>

                {!isTransitioning && (
                  <div className="action-buttons">
                    <button
                      className="swipe-button dislike-button"
                      onClick={() => handleButtonSwipe('left')}
                      aria-label="Dislike"
                    >
                      <span className="button-icon">👎</span>
                      <span className="button-text">Pass</span>
                    </button>
                    <button
                      className="swipe-button like-button"
                      onClick={() => handleButtonSwipe('right')}
                      aria-label="Like"
                    >
                      <span className="button-icon">❤️</span>
                      <span className="button-text">Save</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="end-screen fade-in">
                <h2>All Done!</h2>
                <p>You've swiped through all the food options.</p>
                <div className="final-stats">
                  <div className="final-stat">
                    <span className="final-stat-value liked">{likedFoods.length}</span>
                    <span className="final-stat-label">Liked Foods</span>
                  </div>
                  <div className="final-stat">
                    <span className="final-stat-value disliked">{dislikedFoods.length}</span>
                    <span className="final-stat-label">Passed Foods</span>
                  </div>
                </div>
                <button
                  className="reset-button"
                  onClick={() => {
                    setCurrentIndex(0);
                    setLikedFoods([]);
                    setDislikedFoods([]);
                  }}
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </section>
        )}
      </div>

      <div className="swiping-hero">
        <div className="hero-top-row">
          <div className="hero-pill">{mealWindow.label} · {mealWindow.time}</div>
          <button className="settings-bubble" onClick={() => setShowSettings(true)}>
            Edit Preferences
          </button>
        </div>
        <p className="hero-eyebrow">Hi {userName}</p>
        <h1>{heroTitle}</h1>
        <p className="hero-copy">{heroSubtitle}</p>
        <div className="hero-progress">
          <div className="hero-progress-track">
            <div className="hero-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="hero-progress-meta">
            <span>{totalSwiped}/{targetSwipes} dishes reviewed</span>
            <span>{hasTasteProfile ? 'Taste profile unlocked' : `${Math.max(targetSwipes - totalSwiped, 0)} more to go`}</span>
          </div>
        </div>
      </div>

      <div className="preferences-display">
        {preferences.isVegetarian && <span className="pref-badge">Vegetarian</span>}
        {preferences.isVegan && <span className="pref-badge">Vegan</span>}
        {preferences.isGlutenFree && <span className="pref-badge">Gluten Free</span>}
        {preferences.isDairyFree && <span className="pref-badge">Dairy Free</span>}
        {preferences.isKeto && <span className="pref-badge">Keto</span>}
        {Array.isArray(preferences.diningHall) && preferences.diningHall.length > 0
          ? preferences.diningHall.map((hall, idx) => (
              <span key={idx} className="pref-badge">
                {hall.charAt(0).toUpperCase() + hall.slice(1)}
              </span>
            ))
          : preferences.diningHall && (
              <span className="pref-badge">{diningHallLabel}</span>
            )}
      </div>

      <div className="swiping-content">
        {/* Next Up Section with Meal Plan */}
        {experienceMode === 'dashboard' && caloricMaintenance && likedFoods.length > 0 && (
          <section className="next-up-section">
            <div className="section-header">
              <p className="panel-eyebrow">Next up</p>
              <h2>Your Personalized Meal Plan</h2>
              <p className="section-subtitle">Based on your daily caloric maintenance of {caloricMaintenance} calories</p>
            </div>
            <MealPlan
              caloricMaintenance={caloricMaintenance}
              likedFoods={likedFoods}
              allFoods={allFoods}
              preferences={preferences}
              consumedFoods={consumedFoods}
              onConsumedFoodsChange={onConsumedFoodsChange}
            />
          </section>
        )}

      </div>

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onPreferencesChange={onPreferencesChange}
        userInfo={userInfo}
        onUserInfoChange={onUserInfoChange}
      />
    </div>
  );
}

export default SwipingPage;

function toNumber(value) {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function buildTasteNotes(preferences = {}, likedCount = 0, diningHallLabel = 'your dining hall', caloricMaintenance) {
  const notes = [];

  if (preferences.isVegetarian) {
    notes.push('Prioritizing plant-forward proteins.');
  } else if (preferences.isVegan) {
    notes.push('100% vegan-friendly lineup engaged.');
  } else {
    notes.push('Balancing lean proteins with complex carbs.');
  }

  if (preferences.isGlutenFree) {
    notes.push('Gluten-free filter is active across selections.');
  } else if (preferences.isDairyFree) {
    notes.push('Dairy-free swaps suggested for creamy dishes.');
  } else {
    notes.push(`Keeping options open inside ${diningHallLabel}.`);
  }

  if (caloricMaintenance) {
    notes.push(`Working toward ${caloricMaintenance} kcal today.`);
  } else if (likedCount > 0) {
    notes.push(`${likedCount} favorites saved so far.`);
  } else {
    notes.push('Swipe to start building your taste profile.');
  }

  return notes.slice(0, 3);
}

function getMealWindowDetails() {
  const now = new Date();
  const hour = now.getHours();
  const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (hour < 11) {
    return {
      label: 'Time for Breakfast',
      cta: 'Lean protein + slow carbs',
      time: timeString
    };
  }

  if (hour < 15) {
    return {
      label: 'Power Lunch',
      cta: 'Fuel up for the afternoon',
      time: timeString
    };
  }

  if (hour < 20) {
    return {
      label: 'Prime Dinner Window',
      cta: 'Balance your macros',
      time: timeString
    };
  }

  return {
    label: 'Late Night Recharge',
    cta: 'Keep it light & satisfying',
    time: timeString
  };
}
