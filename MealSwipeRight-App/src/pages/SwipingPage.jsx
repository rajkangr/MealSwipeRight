import { useState, useEffect } from 'react';
import FoodCard from '../components/FoodCard';
import Settings from '../components/Settings';
import foodData from '../data/foodData.json';
import './SwipingPage.css';

function SwipingPage({ preferences, onPreferencesChange, userInfo, onUserInfoChange, onLikedFoodsChange }) {
  const [allFoods, setAllFoods] = useState([]);
  const [foods, setFoods] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedFoods, setLikedFoods] = useState([]);
  const [dislikedFoods, setDislikedFoods] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Convert numeric values to strings for consistency and handle NaN/null
    const processedFoods = foodData.map(food => ({
      ...food,
      calories: String(food.calories && !isNaN(food.calories) ? food.calories : ''),
      calories_from_fat: String(food.calories_from_fat && !isNaN(food.calories_from_fat) ? food.calories_from_fat : ''),
      total_fat_g: String(food.total_fat_g && !isNaN(food.total_fat_g) ? food.total_fat_g : ''),
      saturated_fat_g: String(food.saturated_fat_g && !isNaN(food.saturated_fat_g) ? food.saturated_fat_g : ''),
      trans_fat_g: String(food.trans_fat_g && !isNaN(food.trans_fat_g) ? food.trans_fat_g : ''),
      cholesterol_mg: String(food.cholesterol_mg && !isNaN(food.cholesterol_mg) ? food.cholesterol_mg : ''),
      sodium_mg: String(food.sodium_mg && !isNaN(food.sodium_mg) ? food.sodium_mg : ''),
      total_carb_g: String(food.total_carb_g && !isNaN(food.total_carb_g) ? food.total_carb_g : ''),
      dietary_fiber_g: String(food.dietary_fiber_g && !isNaN(food.dietary_fiber_g) ? food.dietary_fiber_g : ''),
      sugars_g: String(food.sugars_g && !isNaN(food.sugars_g) ? food.sugars_g : ''),
      protein_g: String(food.protein_g && !isNaN(food.protein_g) ? food.protein_g : ''),
      diet_types: food.diet_types || '',
      allergens: food.allergens || '',
      category: food.category || '',
      meal_type: food.meal_type || 'unknown'
    }));
    setAllFoods(processedFoods);
  }, []);

  // Filter foods based on preferences
  useEffect(() => {
    if (!preferences || !preferences.diningHall) {
      setFoods([]);
      return;
    }

    let filtered = [...allFoods];

    // Filter by dining hall
    if (preferences.diningHall) {
      filtered = filtered.filter(food => food.location === preferences.diningHall);
    }

    // Filter by dietary preferences
    if (preferences.isVegetarian || preferences.isVegan) {
      filtered = filtered.filter(food => {
        const dietTypes = (food.diet_types || '').toLowerCase();
        return dietTypes.includes('vegetarian') || dietTypes.includes('vegan');
      });
    }

    if (preferences.isGlutenFree) {
      filtered = filtered.filter(food => {
        const dietTypes = (food.diet_types || '').toLowerCase();
        return dietTypes.includes('gluten free');
      });
    }

    if (preferences.isDairyFree) {
      filtered = filtered.filter(food => {
        const allergens = (food.allergens || '').toLowerCase();
        return !allergens.includes('milk') && !allergens.includes('dairy');
      });
    }

    if (preferences.isKeto) {
      filtered = filtered.filter(food => {
        const dietTypes = (food.diet_types || '').toLowerCase();
        return dietTypes.includes('keto');
      });
    }

    setFoods(filtered);
    setCurrentIndex(0);
  }, [preferences, allFoods]);

  const handleSwipe = (direction) => {
    if (currentIndex >= foods.length) return;

    const currentFood = foods[currentIndex];
    
    if (direction === 'right') {
      const updatedLikedFoods = [...likedFoods, currentFood];
      setLikedFoods(updatedLikedFoods);
      if (onLikedFoodsChange) {
        onLikedFoodsChange(updatedLikedFoods);
      }
    } else {
      setDislikedFoods([...dislikedFoods, currentFood]);
    }

    setCurrentIndex(currentIndex + 1);
  };

  const handleButtonSwipe = (direction) => {
    handleSwipe(direction);
  };

  const hasMoreFoods = currentIndex < foods.length;
  const totalSwiped = likedFoods.length + dislikedFoods.length;

  if (!preferences || !preferences.diningHall) {
    return (
      <div className="swiping-page">
        <div className="settings-bubble-container">
          <button className="settings-bubble" onClick={() => setShowSettings(true)}>
            ⚙️
          </button>
        </div>
        <div className="no-preferences-message">
          <h2>Welcome to MealSwipeRight!</h2>
          <p>Please set your preferences to start swiping.</p>
          <button className="setup-button" onClick={() => setShowSettings(true)}>
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
    <div className="swiping-page">
      <div className="settings-bubble-container">
        <button className="settings-bubble" onClick={() => setShowSettings(true)}>
          ⚙️
        </button>
      </div>

      <div className="swiping-header">
        <div className="preferences-display">
          {preferences.isVegetarian && <span className="pref-badge">🥬 Vegetarian</span>}
          {preferences.isVegan && <span className="pref-badge">🌱 Vegan</span>}
          {preferences.isGlutenFree && <span className="pref-badge">🌾 Gluten Free</span>}
          {preferences.isDairyFree && <span className="pref-badge">🥛 Dairy Free</span>}
          {preferences.isKeto && <span className="pref-badge">🥑 Keto</span>}
          <span className="pref-badge">
            📍 {preferences.diningHall.charAt(0).toUpperCase() + preferences.diningHall.slice(1)}
          </span>
        </div>
        <div className="stats-bar">
          <span className="stat-item">
            <span className="stat-label">Liked:</span>
            <span className="stat-value liked">{likedFoods.length}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Disliked:</span>
            <span className="stat-value disliked">{dislikedFoods.length}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Remaining:</span>
            <span className="stat-value">{foods.length - totalSwiped}</span>
          </span>
        </div>
      </div>

      <main className="swiping-main">
        {foods.length === 0 ? (
          <div className="end-screen">
            <h2>😔 No Foods Found</h2>
            <p>No foods match your preferences. Try adjusting your settings!</p>
            <button className="reset-button" onClick={() => setShowSettings(true)}>
              Change Settings
            </button>
          </div>
        ) : hasMoreFoods ? (
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
                <span className="button-text">Nope</span>
              </button>
              <button
                className="swipe-button like-button"
                onClick={() => handleButtonSwipe('right')}
                aria-label="Like"
              >
                <span className="button-icon">👍</span>
                <span className="button-text">Like</span>
              </button>
            </div>
          </>
        ) : (
          <div className="end-screen">
            <h2>🎉 All Done!</h2>
            <p>You've swiped through all the food options.</p>
            <div className="final-stats">
              <div className="final-stat">
                <span className="final-stat-value liked">{likedFoods.length}</span>
                <span className="final-stat-label">Liked Foods</span>
              </div>
              <div className="final-stat">
                <span className="final-stat-value disliked">{dislikedFoods.length}</span>
                <span className="final-stat-label">Disliked Foods</span>
              </div>
            </div>
            {likedFoods.length > 0 && (
              <div className="liked-list">
                <h3>Your Liked Foods:</h3>
                <ul>
                  {likedFoods.map((food, index) => (
                    <li key={index}>{food.name} - {food.location}</li>
                  ))}
                </ul>
              </div>
            )}
            <button className="reset-button" onClick={() => {
              setCurrentIndex(0);
              setLikedFoods([]);
              setDislikedFoods([]);
            }}>
              Start Over
            </button>
          </div>
        )}
      </main>

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

