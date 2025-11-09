import { useState, useEffect, useRef, useMemo } from 'react';
import FoodCard from '../components/FoodCard';
import Settings from '../components/Settings';
import CaloricMaintenance from '../components/CaloricMaintenance';
import MealPlan from '../components/MealPlan';
import { loadFoodData } from '../utils/foodDataLoader';
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
  onboardingTarget = 5
}) {
  const [allFoods, setAllFoods] = useState([]);
  const [foods, setFoods] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedFoods, setLikedFoods] = useState([]);
  const [dislikedFoods, setDislikedFoods] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);
  const prevPreferencesRef = useRef(null);

  const targetSwipes = Math.max(1, onboardingTarget);
  const totalSwiped = likedFoods.length + dislikedFoods.length;
  const hasTasteProfile = totalSwiped >= targetSwipes;
  const showImmersive = experienceMode === 'onboarding' && !hasTasteProfile;
  const diningHallLabel = preferences?.diningHall
    ? `${preferences.diningHall.charAt(0).toUpperCase()}${preferences.diningHall.slice(1)}`
    : 'your dining hall';
  const userName = (userInfo?.name || '').split(' ')[0] || 'Athlete';
  const mealWindow = getMealWindowDetails();
  const heroTitle = showImmersive ? "You're almost there!" : "Today's dining brief";
  const heroSubtitle = showImmersive
    ? `Swipe ${Math.max(targetSwipes - totalSwiped, 0)} more dishes to unlock your personalized dashboard.`
    : `Powered by ${totalSwiped || 'fresh'} swipes from ${diningHallLabel}.`;
  const progressPercent = Math.min(100, Math.round((totalSwiped / targetSwipes) * 100));
  const highlightFoods = likedFoods.slice(-3).reverse();
  const calorieTarget = caloricMaintenance || 2200;
  const macroTotals = useMemo(() => {
    return likedFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + toNumber(food.calories),
        protein: acc.protein + toNumber(food.protein_g),
        carbs: acc.carbs + toNumber(food.total_carb_g),
        fat: acc.fat + toNumber(food.total_fat_g)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [likedFoods]);
  const macroTargets = useMemo(() => ({
    calories: calorieTarget,
    protein: Math.round((calorieTarget * 0.3) / 4),
    carbs: Math.round((calorieTarget * 0.45) / 4),
    fat: Math.round((calorieTarget * 0.25) / 9)
  }), [calorieTarget]);
  const macroPercent = (key) => {
    const target = macroTargets[key];
    if (!target) return 0;
    return Math.min(100, Math.round(((macroTotals[key] || 0) / target) * 100));
  };
  const remainingFoods = Math.max(foods.length - currentIndex, 0);
  const showInsights = hasTasteProfile || experienceMode === 'dashboard';
  const tasteNotes = buildTasteNotes(preferences || {}, likedFoods.length, diningHallLabel, caloricMaintenance);

  // Restore state from parent only on initial mount
  useEffect(() => {
    if (isInitialMount.current && swipingState) {
      const prevDiningHall = swipingState.preferences?.diningHall;
      if (prevDiningHall === preferences?.diningHall) {
        setCurrentIndex(swipingState.currentIndex || 0);
        setLikedFoods(swipingState.likedFoods || []);
        setDislikedFoods(swipingState.dislikedFoods || []);
      }
      isInitialMount.current = false;
      prevPreferencesRef.current = preferences?.diningHall;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle preferences changes separately
  useEffect(() => {
    if (!isInitialMount.current) {
      const prevDiningHall = prevPreferencesRef.current;
      const currentDiningHall = preferences?.diningHall;

      if (prevDiningHall !== currentDiningHall) {
        setCurrentIndex(0);
        setLikedFoods([]);
        setDislikedFoods([]);
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
      onSwipingStateChange({
        currentIndex,
        likedFoods,
        dislikedFoods,
        preferences
      });
    }
  }, [currentIndex, likedFoods, dislikedFoods, preferences, onSwipingStateChange]);

  // Filter foods based on preferences
  useEffect(() => {
    if (!preferences || !preferences.diningHall || isLoading) {
      setFoods([]);
      return;
    }

    let filtered = [...allFoods];

    if (preferences.diningHall) {
      filtered = filtered.filter((food) => food.location === preferences.diningHall);
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

    setFoods(filtered);
  }, [preferences, allFoods, isLoading]);

  const handleSwipe = (direction) => {
    if (currentIndex >= foods.length) return;

    const currentFood = foods[currentIndex];

    if (direction === 'right') {
      const updatedLikedFoods = [...likedFoods, currentFood];
      setLikedFoods(updatedLikedFoods);
      onLikedFoodsChange?.(updatedLikedFoods);
    } else {
      setDislikedFoods([...dislikedFoods, currentFood]);
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleButtonSwipe = (direction) => {
    handleSwipe(direction);
  };

  const stats = [
    { label: 'Liked', value: likedFoods.length, tone: 'liked' },
    { label: 'Passed', value: dislikedFoods.length, tone: 'disliked' },
    { label: 'Remaining', value: remainingFoods, tone: 'neutral' }
  ];

  if (!preferences || !preferences.diningHall) {
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

  return (
    <div className={`swiping-page ${showImmersive ? 'swiping-page--immersive' : 'swiping-page--profile-ready'}`}>
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
        <span className="pref-badge">{diningHallLabel}</span>
      </div>

      <div className="swiping-content">
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
            ) : currentIndex < foods.length ? (
              <>
                <div className="card-stack">
                  {foods.slice(currentIndex, currentIndex + 3).map((food, index) => (
                    <FoodCard
                      key={`${food.name}-${currentIndex + index}`}
                      food={food}
                      onSwipe={handleSwipe}
                      index={index}
                    />
                  ))}
                </div>

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
              </>
            ) : (
              <div className="end-screen">
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
                {likedFoods.length > 0 && (
                  <div className="liked-list">
                    <h3>Your Liked Foods:</h3>
                    <ul>
                      {likedFoods.map((food, index) => (
                        <li key={index}>
                          {food.name} — {food.location}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

        {showInsights && (
          <>
            <section className="insight-grid">
              <article className="insight-card">
                <div className="panel-eyebrow">Macro pulse</div>
                <h3>Today's Intake</h3>
                <div className="macro-grid">
                  {['calories', 'protein', 'carbs', 'fat'].map((key) => (
                    <div key={key} className="macro-pill">
                      <div className="macro-pill-header">
                        <span className="macro-label">{key}</span>
                        <span className="macro-value">
                          {Math.round(macroTotals[key])}
                          {key === 'calories' ? ' kcal' : 'g'}
                        </span>
                      </div>
                      <div className="macro-bar">
                        <div
                          className="macro-bar-fill"
                          style={{ width: `${macroPercent(key)}%` }}
                        />
                      </div>
                      <span className="macro-target">
                        Goal: {macroTargets[key]}
                        {key === 'calories' ? ' kcal' : 'g'}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="insight-card accent">
                <div className="panel-eyebrow">Next up</div>
                <h3>{mealWindow.cta}</h3>
                <ul className="taste-notes">
                  {tasteNotes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </article>
            </section>

            {highlightFoods.length > 0 && (
              <section className="spotlight-section">
                <div className="section-heading">
                  <div>
                    <p className="panel-eyebrow">Your favorites</p>
                    <h3>Latest matches</h3>
                  </div>
                </div>
                <div className="spotlight-grid">
                  {highlightFoods.map((food, index) => (
                    <article key={`${food.name}-${index}`} className="spotlight-card">
                      <span className="spotlight-location">{food.location}</span>
                      <h4>{food.name}</h4>
                      <div className="spotlight-macros">
                        <span>{food.calories || '—'} cal</span>
                        <span>{food.protein_g || '—'}g protein</span>
                        <span>{food.total_carb_g || '—'}g carbs</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="plan-stack">
              {!caloricMaintenance && (
                <div className="plan-card glass">
                  <CaloricMaintenance
                    userInfo={userInfo}
                    preferences={preferences}
                    onUserInfoChange={onUserInfoChange}
                    onPreferencesChange={onPreferencesChange}
                    onCaloricMaintenanceSet={onCaloricMaintenanceChange}
                    onShowSettings={() => setShowSettings(true)}
                  />
                </div>
              )}

              {caloricMaintenance && (
                <div className="plan-card glass">
                  <MealPlan
                    caloricMaintenance={caloricMaintenance}
                    likedFoods={likedFoods}
                    allFoods={allFoods}
                    preferences={preferences}
                  />
                </div>
              )}
            </section>
          </>
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
