import { useState, useEffect } from 'react';
import './MetricsPage.css';

function MetricsPage({ likedFoods, gymData }) {
  const [totalCalories, setTotalCalories] = useState(0);
  const [recentLikedFoods, setRecentLikedFoods] = useState([]);

  useEffect(() => {
    // Calculate total calories from liked foods
    const calories = likedFoods.reduce((sum, food) => {
      const cal = parseInt(food.calories) || 0;
      return sum + cal;
    }, 0);
    setTotalCalories(calories);

    // Get recent liked foods (last 5)
    setRecentLikedFoods(likedFoods.slice(-5).reverse());
  }, [likedFoods]);

  // Sample gym data - in production this would come from gym workouts
  const sampleGymStats = gymData || {
    benchPress: [
      { date: '2024-01-01', weight: 135, reps: 10 },
      { date: '2024-01-08', weight: 145, reps: 10 },
      { date: '2024-01-15', weight: 155, reps: 8 },
      { date: '2024-01-22', weight: 165, reps: 6 }
    ],
    squat: [
      { date: '2024-01-01', weight: 185, reps: 10 },
      { date: '2024-01-08', weight: 195, reps: 10 },
      { date: '2024-01-15', weight: 205, reps: 8 },
      { date: '2024-01-22', weight: 215, reps: 6 }
    ]
  };

  const getMaxWeight = (exerciseData) => {
    if (!exerciseData || exerciseData.length === 0) return 0;
    return Math.max(...exerciseData.map(e => e.weight));
  };

  return (
    <div className="metrics-page">
      <div className="metrics-header">
        <h1>Metrics</h1>
      </div>

      <div className="metrics-content">
        <section className="metric-section">
          <h2>Food Stats</h2>
          <div className="metric-card">
            <div className="metric-value">{totalCalories}</div>
            <div className="metric-label">Total Calories (Liked Foods)</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{likedFoods.length}</div>
            <div className="metric-label">Total Foods Liked</div>
          </div>
        </section>

        <section className="metric-section">
          <h2>Recently Liked Foods</h2>
          {recentLikedFoods.length > 0 ? (
            <div className="recent-foods-list">
              {recentLikedFoods.map((food, index) => (
                <div key={index} className="recent-food-item">
                  <div className="food-name">{food.name}</div>
                  <div className="food-details">
                    <span>{food.calories} cal</span>
                    <span className="food-location">{food.location}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No liked foods yet. Start swiping to see your favorites here!</p>
            </div>
          )}
        </section>

        <section className="metric-section">
          <h2>Gym Stats</h2>
          <div className="gym-stats-grid">
            <div className="gym-stat-card">
              <div className="gym-stat-title">Bench Press</div>
              <div className="gym-stat-value">{getMaxWeight(sampleGymStats.benchPress)} lbs</div>
              <div className="gym-stat-label">Max Weight</div>
              <div className="gym-stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(getMaxWeight(sampleGymStats.benchPress) / 225) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="gym-stat-card">
              <div className="gym-stat-title">Squat</div>
              <div className="gym-stat-value">{getMaxWeight(sampleGymStats.squat)} lbs</div>
              <div className="gym-stat-label">Max Weight</div>
              <div className="gym-stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(getMaxWeight(sampleGymStats.squat) / 315) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="gym-graph-section">
            <h3>Bench Press Progress</h3>
            <div className="simple-graph">
              {sampleGymStats.benchPress.map((point, index) => (
                <div key={index} className="graph-bar-container">
                  <div 
                    className="graph-bar"
                    style={{ height: `${(point.weight / 200) * 100}%` }}
                    title={`${point.weight}lbs - ${point.reps} reps`}
                  >
                    <span className="graph-value">{point.weight}</span>
                  </div>
                  <div className="graph-label">{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default MetricsPage;

