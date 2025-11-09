import { useState, useEffect } from 'react';
import './GymPage.css';

function GymPage({ onWorkoutUpdate, workouts: parentWorkouts }) {
  const [workouts, setWorkouts] = useState(parentWorkouts || []);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [setWeight, setSetWeight] = useState('');
  const [setReps, setSetReps] = useState('');
  const [pendingExerciseWorkoutId, setPendingExerciseWorkoutId] = useState(null);
  const [pendingSetData, setPendingSetData] = useState({ workoutId: null, exerciseId: null });
  const [errorMessage, setErrorMessage] = useState('');

  // Sync with parent workouts if provided
  useEffect(() => {
    if (parentWorkouts) {
      setWorkouts(parentWorkouts);
    }
  }, [parentWorkouts]);

  const startNewWorkout = () => {
    if (!workoutTitle.trim()) {
      setErrorMessage('Please enter a workout title');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const newWorkout = {
      id: Date.now(),
      title: workoutTitle,
      date: new Date().toISOString(),
      exercises: []
    };

    const updatedWorkouts = [...workouts, newWorkout];
    setWorkouts(updatedWorkouts);
    setActiveWorkout(newWorkout.id);
    setWorkoutTitle('');
    if (onWorkoutUpdate) {
      onWorkoutUpdate(newWorkout);
    }
  };

  const addExercise = (workoutId) => {
    setPendingExerciseWorkoutId(workoutId);
    setExerciseName('');
    setShowExerciseModal(true);
  };

  const handleExerciseSubmit = () => {
    if (!exerciseName.trim()) {
      setErrorMessage('Please enter an exercise name');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const workout = workouts.find(w => w.id === pendingExerciseWorkoutId);
    if (!workout) return;

    const updatedWorkout = {
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          id: Date.now(),
          name: exerciseName.trim(),
          sets: []
        }
      ]
    };

    updateWorkout(updatedWorkout);
    setShowExerciseModal(false);
    setExerciseName('');
    setPendingExerciseWorkoutId(null);
  };

  const addSet = (workoutId, exerciseId) => {
    setPendingSetData({ workoutId, exerciseId });
    setSetWeight('');
    setSetReps('');
    setShowSetModal(true);
  };

  const handleSetSubmit = () => {
    const weight = parseFloat(setWeight);
    const reps = parseInt(setReps);

    if (!setWeight || !setReps || isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
      setErrorMessage('Please enter valid weight and reps (must be positive numbers)');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const workout = workouts.find(w => w.id === pendingSetData.workoutId);
    if (!workout) return;

    const exercise = workout.exercises.find(e => e.id === pendingSetData.exerciseId);
    if (!exercise) return;

    const newSet = {
      id: Date.now(),
      weight: weight,
      reps: reps
    };

    const updatedExercise = {
      ...exercise,
      sets: [...exercise.sets, newSet]
    };

    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map(e => e.id === pendingSetData.exerciseId ? updatedExercise : e)
    };

    updateWorkout(updatedWorkout);
    setShowSetModal(false);
    setSetWeight('');
    setSetReps('');
    setPendingSetData({ workoutId: null, exerciseId: null });
  };

  const updateWorkout = (updatedWorkout) => {
    const updatedWorkouts = workouts.map(w => 
      w.id === updatedWorkout.id ? updatedWorkout : w
    );
    setWorkouts(updatedWorkouts);
    if (onWorkoutUpdate) {
      onWorkoutUpdate(updatedWorkout);
    }
  };

  const finishWorkout = (workoutId) => {
    setActiveWorkout(null);
  };

  const deleteWorkout = (workoutId) => {
    setWorkouts(workouts.filter(w => w.id !== workoutId));
    if (activeWorkout === workoutId) {
      setActiveWorkout(null);
    }
  };

  const currentWorkout = workouts.find(w => w.id === activeWorkout);
  const totalExercises = workouts.reduce((sum, workout) => sum + workout.exercises.length, 0);
  const totalSets = workouts.reduce(
    (sum, workout) => sum + workout.exercises.reduce((inner, exercise) => inner + exercise.sets.length, 0),
    0
  );
  const heroStats = [
    { label: 'Workouts logged', value: workouts.length },
    { label: 'Exercises tracked', value: totalExercises },
    { label: 'Total sets', value: totalSets }
  ];

  return (
    <div className="gym-page page-shell">
      <header className="gym-header">
        <div className="hero-pill">Training log</div>
        <h1>Gym sessions</h1>
        <p>Keep a lightweight record of every lift so your nutrition plan stays in sync.</p>
        <div className="gym-hero-stats">
          {heroStats.map(stat => (
            <div key={stat.label} className="gym-hero-stat">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="gym-content glass">
        {!activeWorkout ? (
          <div className="workout-list-view">
            <div className="new-workout-section">
              <h2>Start New Workout</h2>
              <div className="new-workout-form">
                <input
                  type="text"
                  placeholder="Workout title (e.g., Legs, Chest/Triceps)"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  className="workout-title-input"
                  onKeyPress={(e) => e.key === 'Enter' && startNewWorkout()}
                />
                <button className="start-workout-button" onClick={startNewWorkout}>
                  Start Workout
                </button>
              </div>
            </div>

            {workouts.length > 0 && (
              <div className="past-workouts-section">
                <h2>Past Workouts</h2>
                <div className="workouts-list">
                  {workouts.slice().reverse().map(workout => (
                    <div key={workout.id} className="workout-card">
                      <div className="workout-card-header">
                        <div>
                          <h3>{workout.title}</h3>
                          <p className="workout-date">
                            {new Date(workout.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button 
                          className="delete-workout-button"
                          onClick={() => deleteWorkout(workout.id)}
                        >
                          ðŸ—‘ï¸
                        </button>
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
          </div>
        ) : (
          <div className="active-workout-view">
            <div className="active-workout-header">
              <h2>{currentWorkout?.title}</h2>
              <button className="finish-workout-button" onClick={() => finishWorkout(activeWorkout)}>
                Finish Workout
              </button>
            </div>

            <div className="exercises-list">
              {currentWorkout?.exercises.map(exercise => (
                <div key={exercise.id} className="exercise-card">
                  <div className="exercise-header">
                    <h3>{exercise.name}</h3>
                    <button 
                      className="add-set-button"
                      onClick={() => addSet(activeWorkout, exercise.id)}
                    >
                      + Add Set
                    </button>
                  </div>
                  <div className="sets-list">
                    {exercise.sets.map((set, index) => (
                      <div key={set.id} className="set-item">
                        <span className="set-number">Set {index + 1}</span>
                        <span className="set-weight">{set.weight} lbs</span>
                        <span className="set-reps">{set.reps} reps</span>
                      </div>
                    ))}
                    {exercise.sets.length === 0 && (
                      <div className="no-sets">No sets added yet</div>
                    )}
                  </div>
                </div>
              ))}

              {currentWorkout?.exercises.length === 0 && (
                <div className="no-exercises">
                  <p>No exercises added yet</p>
                </div>
              )}
            </div>

            <button 
              className="add-exercise-button"
              onClick={() => addExercise(activeWorkout)}
            >
              + Add Exercise
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="gym-error-message">
          {errorMessage}
        </div>
      )}

      {/* Exercise Modal */}
      {showExerciseModal && (
        <div className="gym-modal-overlay" onClick={() => setShowExerciseModal(false)}>
          <div className="gym-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Exercise</h3>
            <p className="gym-modal-subtitle">Enter the name of the exercise</p>
            <input
              type="text"
              placeholder="e.g., Bench Press, Squat, Deadlift"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className="gym-modal-input"
              onKeyPress={(e) => e.key === 'Enter' && handleExerciseSubmit()}
              autoFocus
            />
            <div className="gym-modal-actions">
              <button className="gym-modal-button secondary" onClick={() => setShowExerciseModal(false)}>
                Cancel
              </button>
              <button className="gym-modal-button primary" onClick={handleExerciseSubmit}>
                Add Exercise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Modal */}
      {showSetModal && (
        <div className="gym-modal-overlay" onClick={() => setShowSetModal(false)}>
          <div className="gym-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Set</h3>
            <p className="gym-modal-subtitle">Enter weight and reps for this set</p>
            <div className="gym-modal-form-grid">
              <div>
                <label>Weight (lbs)</label>
                <input
                  type="number"
                  placeholder="e.g., 135"
                  value={setWeight}
                  onChange={(e) => setSetWeight(e.target.value)}
                  className="gym-modal-input"
                  min="0"
                  step="0.5"
                  autoFocus
                />
              </div>
              <div>
                <label>Reps</label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  value={setReps}
                  onChange={(e) => setSetReps(e.target.value)}
                  className="gym-modal-input"
                  min="1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSetSubmit()}
                />
              </div>
            </div>
            <div className="gym-modal-actions">
              <button className="gym-modal-button secondary" onClick={() => setShowSetModal(false)}>
                Cancel
              </button>
              <button className="gym-modal-button primary" onClick={handleSetSubmit}>
                Add Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GymPage;


