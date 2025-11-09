import { useMemo } from 'react';
import './MetricsPage.css';

function MetricsPage({ consumedFoods, caloricMaintenance, gymData, userInfo }) {
  // Get recent consumed foods (last 5)
  const recentFoods = useMemo(() => {
    return consumedFoods.slice(-5).reverse();
  }, [consumedFoods]);

  // Calculate workout stats from actual data
  const workoutStats = useMemo(() => {
    const workouts = gymData?.workouts || [];
    const benchPress = gymData?.benchPress || [];
    const squat = gymData?.squat || [];
    
    const getMaxWeight = (data) => {
      if (!data || data.length === 0) return 0;
      return Math.max(...data.map(e => e.weight));
    };

    const getRecentMax = (data) => {
      if (!data || data.length === 0) return 0;
      const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
      return sorted[0]?.weight || 0;
    };

    // Get unique workout dates
    const workoutDates = [...new Set(workouts.map(w => {
      const date = new Date(w.date);
      return date.toDateString();
    }))];

    // Calculate workout streak
    const today = new Date().toDateString();
    const sortedDates = workoutDates.sort((a, b) => new Date(b) - new Date(a));
    let workoutStreak = 0;
    
    if (sortedDates.includes(today)) {
      workoutStreak = 1;
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);
      
      while (sortedDates.includes(checkDate.toDateString())) {
        workoutStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculate nutrition streak (simplified - based on today having food)
    const nutritionStreak = consumedFoods.length > 0 ? 1 : 0;
    // For a real streak, we'd need to track dates when foods were consumed
    // This is a simplified version that just checks if they logged today

    // Get total workouts this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const workoutsThisWeek = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= weekAgo;
    }).length;

    // Get total workouts all time
    const totalWorkouts = workouts.length;

    return {
      benchPress: {
        max: getMaxWeight(benchPress),
        recent: getRecentMax(benchPress),
        data: benchPress.slice(-7)
      },
      squat: {
        max: getMaxWeight(squat),
        recent: getRecentMax(squat),
        data: squat.slice(-7)
      },
      workoutStreak,
      nutritionStreak,
      workoutsThisWeek,
      totalWorkouts,
      recentWorkouts: workouts.slice(-5).reverse()
    };
  }, [gymData, consumedFoods]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="metrics-page page-shell">
      <header className="metrics-hero">
        <div className="hero-pill">Your progress</div>
        <h1>Metrics</h1>
        <p>Track your streaks and fitness progress</p>
      </header>

      {/* Streaks Section */}
      <section className="metrics-section">
        <div className="section-header">
          <p className="panel-eyebrow">Streaks</p>
          <h2>Keep It Going</h2>
        </div>
        <div className="streaks-grid">
          <div className="streak-card">
            <div className="streak-icon">🔥</div>
            <div className="streak-content">
              <div className="streak-label">Nutrition Streak</div>
              <div className="streak-value">{workoutStats.nutritionStreak} day{workoutStats.nutritionStreak !== 1 ? 's' : ''}</div>
              <div className="streak-hint">
                {workoutStats.nutritionStreak > 0 
                  ? 'Logged food today!' 
                  : 'Log food to start your streak'}
              </div>
            </div>
          </div>

          <div className="streak-card">
            <div className="streak-icon">💪</div>
            <div className="streak-content">
              <div className="streak-label">Workout Streak</div>
              <div className="streak-value">{workoutStats.workoutStreak} day{workoutStats.workoutStreak !== 1 ? 's' : ''}</div>
              <div className="streak-hint">
                {workoutStats.workoutStreak > 0 
                  ? 'Keep crushing it!' 
                  : 'Start a workout to begin your streak'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Foods */}
      {recentFoods.length > 0 && (
        <section className="metrics-section">
          <div className="section-header">
            <p className="panel-eyebrow">Recent activity</p>
            <h2>Today's Foods</h2>
          </div>
          <div className="recent-foods-grid">
            {recentFoods.map((food, index) => (
              <div key={index} className="recent-food-card">
                <div className="food-card-header">
                  <h4>{food.name}</h4>
                  {food.location && food.location !== 'Custom' && (
                    <span className="food-location-badge">{food.location}</span>
                  )}
                </div>
                <div className="food-macros-mini">
                  <span>{Math.round(parseFloat(food.calories) || 0)} cal</span>
                  <span>{Math.round(parseFloat(food.protein_g) || 0)}g protein</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Workout Stats */}
      {workoutStats.totalWorkouts > 0 && (
        <section className="metrics-section">
          <div className="section-header">
            <p className="panel-eyebrow">Fitness</p>
            <h2>Workout Stats</h2>
          </div>
          
          <div className="workout-overview-grid">
            <div className="workout-stat-card">
              <div className="workout-stat-label">Total Workouts</div>
              <div className="workout-stat-value">{workoutStats.totalWorkouts}</div>
            </div>
            <div className="workout-stat-card">
              <div className="workout-stat-label">This Week</div>
              <div className="workout-stat-value">{workoutStats.workoutsThisWeek}</div>
            </div>
          </div>

          {/* Exercise PRs */}
          {(workoutStats.benchPress.max > 0 || workoutStats.squat.max > 0) && (
            <div className="exercise-prs-grid">
              {workoutStats.benchPress.max > 0 && (
                <div className="pr-card">
                  <div className="pr-header">
                    <span className="pr-exercise">Bench Press</span>
                    <span className="pr-badge">PR</span>
                  </div>
                  <div className="pr-value">{workoutStats.benchPress.max} lbs</div>
                  <div className="pr-label">Personal Best</div>
                  {workoutStats.benchPress.data.length > 1 && (
                    <div className="pr-trend">
                      {workoutStats.benchPress.recent >= workoutStats.benchPress.max * 0.9 ? (
                        <span className="trend-up">↑ Trending up</span>
                      ) : (
                        <span className="trend-neutral">Maintaining</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {workoutStats.squat.max > 0 && (
                <div className="pr-card">
                  <div className="pr-header">
                    <span className="pr-exercise">Squat</span>
                    <span className="pr-badge">PR</span>
                  </div>
                  <div className="pr-value">{workoutStats.squat.max} lbs</div>
                  <div className="pr-label">Personal Best</div>
                  {workoutStats.squat.data.length > 1 && (
                    <div className="pr-trend">
                      {workoutStats.squat.recent >= workoutStats.squat.max * 0.9 ? (
                        <span className="trend-up">↑ Trending up</span>
                      ) : (
                        <span className="trend-neutral">Maintaining</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent Workouts */}
          {workoutStats.recentWorkouts.length > 0 && (
            <div className="recent-workouts-section">
              <h3>Recent Workouts</h3>
              <div className="recent-workouts-list">
                {workoutStats.recentWorkouts.map((workout) => (
                  <div key={workout.id} className="recent-workout-card">
                    <div className="workout-card-header">
                      <h4>{workout.title}</h4>
                      <span className="workout-date">{formatDate(workout.date)}</span>
                    </div>
                    <div className="workout-summary">
                      <span>{workout.exercises.length} exercises</span>
                      <span>{workout.exercises.reduce((sum, e) => sum + e.sets.length, 0)} sets</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Empty State */}
      {consumedFoods.length === 0 && workoutStats.totalWorkouts === 0 && (
        <div className="empty-state-section">
          <h3>Start Tracking</h3>
          <p>Log foods and workouts to see your metrics here.</p>
        </div>
      )}
    </div>
  );
}

export default MetricsPage;
