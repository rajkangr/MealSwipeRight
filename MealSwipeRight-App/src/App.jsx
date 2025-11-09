import { useState, useEffect } from 'react';
import FoodCard from './components/FoodCard';
import Preferences from './components/Preferences';
import { sampleFoodData } from './data/sampleFoodData';
import './App.css';

function App() {
  const [allFoods, setAllFoods] = useState([]);
  const [foods, setFoods] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedFoods, setLikedFoods] = useState([]);
  const [dislikedFoods, setDislikedFoods] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Load food data - in production, this would come from an API or CSV
    setAllFoods(sampleFoodData);
  }, []);

  // Filter foods based on preferences
  useEffect(() => {
    if (!preferences) {
      setFoods([]);
      return;
    }

    let filtered = [...allFoods];

    // Filter by dining hall
    if (preferences.diningHall) {
      filtered = filtered.filter(food => food.location === preferences.diningHall);
    }

    // Filter by vegetarian preference
    if (preferences.isVegetarian) {
      filtered = filtered.filter(food => {
        const dietTypes = food.diet_types || '';
        return dietTypes.toLowerCase().includes('vegetarian') || 
               dietTypes.toLowerCase().includes('vegan');
      });
    }

    setFoods(filtered);
    setCurrentIndex(0);
    setLikedFoods([]);
    setDislikedFoods([]);
  }, [preferences, allFoods]);

  const handlePreferencesSubmit = (prefs) => {
    setPreferences(prefs);
  };

  const handleSwipe = (direction) => {
    if (currentIndex >= foods.length) return;

    const currentFood = foods[currentIndex];
    
    if (direction === 'right') {
      setLikedFoods([...likedFoods, currentFood]);
    } else {
      setDislikedFoods([...dislikedFoods, currentFood]);
    }

    setCurrentIndex(currentIndex + 1);
  };

  const handleButtonSwipe = (direction) => {
    handleSwipe(direction);
  };

  const resetApp = () => {
    setCurrentIndex(0);
    setLikedFoods([]);
    setDislikedFoods([]);
    setShowStats(false);
    setPreferences(null);
  };

  const hasMoreFoods = currentIndex < foods.length;
  const totalSwiped = likedFoods.length + dislikedFoods.length;

  // Show preferences if not set
  if (!preferences) {
    return <Preferences onPreferencesSubmit={handlePreferencesSubmit} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍽️ MealSwipeRight</h1>
        <p className="subtitle">Swipe right if you like it, left if you don't!</p>
        <div className="preferences-display">
          <span className="pref-badge">
            {preferences.isVegetarian ? '🥬 Vegetarian' : '🍖 All Foods'}
          </span>
          <span className="pref-badge">
            📍 {preferences.diningHall.charAt(0).toUpperCase() + preferences.diningHall.slice(1)}
          </span>
        </div>
        {totalSwiped > 0 && (
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
        )}
      </header>

      <main className="app-main">
        {foods.length === 0 ? (
          <div className="end-screen">
            <h2>😔 No Foods Found</h2>
            <p>No foods match your preferences. Try adjusting your preferences!</p>
            <button className="reset-button" onClick={resetApp}>
              Change Preferences
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
            <button className="reset-button" onClick={resetApp}>
              Start Over
            </button>
          </div>
        )}
      </main>

      {showStats && (
        <div className="stats-modal">
          <div className="stats-content">
            <h2>Your Stats</h2>
            <p>Liked: {likedFoods.length}</p>
            <p>Disliked: {dislikedFoods.length}</p>
            <button onClick={() => setShowStats(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
