import { useState, useEffect } from 'react';
import './GymPage.css';

function GymPage({ onWorkoutUpdate, workouts: parentWorkouts }) {
  // --- State ---
  const [workouts, setWorkouts] = useState(parentWorkouts || []);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [bodyPart, setBodyPart] = useState('Back');
  const [setWeight, setSetWeight] = useState('');
  const [setReps, setSetReps] = useState('');
  const [pendingExerciseWorkoutId, setPendingExerciseWorkoutId] = useState(null);
  const [pendingSetData, setPendingSetData] = useState({ workoutId: null, exerciseId: null });
  const [errorMessage, setErrorMessage] = useState('');

  // --- Initialize local state ---
  useEffect(() => {
    if (parentWorkouts && parentWorkouts.length > 0) {
      setWorkouts(parentWorkouts);
    }
  }, []);

  // --- Workout Handlers ---
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
    if (onWorkoutUpdate) onWorkoutUpdate(updatedWorkouts);
  };

  const updateWorkout = (updatedWorkout) => {
    const updatedWorkouts = workouts.map(w => w.id === updatedWorkout.id ? updatedWorkout : w);
    setWorkouts(updatedWorkouts);
    if (onWorkoutUpdate) onWorkoutUpdate(updatedWorkouts);
  };

  const deleteWorkout = (workoutId) => {
    const updated = workouts.filter(w => w.id !== workoutId);
    setWorkouts(updated);
    if (activeWorkout === workoutId) setActiveWorkout(null);
    if (onWorkoutUpdate) onWorkoutUpdate(updated);
  };

  const finishWorkout = () => setActiveWorkout(null);

  // --- Exercise Handlers ---
  const addExercise = (workoutId) => {
    setPendingExerciseWorkoutId(workoutId);
    setExerciseName('');
    setBodyPart('Back');
    setSetWeight('');
    setSetReps('');
    setShowExerciseModal(true);
  };

  const handleExerciseSubmit = () => {
    const weight = parseFloat(setWeight);
    const reps = parseInt(setReps);

    if (!exerciseName.trim() || !bodyPart || isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
      setErrorMessage('Please enter valid body part, exercise, weight, and reps');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const workout = workouts.find(w => w.id === pendingExerciseWorkoutId);
    if (!workout) return;

    const newExercise = {
      id: Date.now(),
      name: exerciseName.trim(),
      bodyPart,
      sets: [{ id: Date.now(), weight, reps }]
    };

    const updatedWorkout = {
      ...workout,
      exercises: [...workout.exercises, newExercise]
    };

    // **Close modal first**
    setShowExerciseModal(false);

    // **Reset state immediately**
    setExerciseName('');
    setBodyPart('Back');
    setSetWeight('');
    setSetReps('');
    setPendingExerciseWorkoutId(null);

    // Update the workout
    updateWorkout(updatedWorkout);
  };


  // --- Set Handlers ---
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

    const newSet = { id: Date.now(), weight, reps };
    const updatedExercise = { ...exercise, sets: [...exercise.sets, newSet] };

    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map(e => e.id === pendingSetData.exerciseId ? updatedExercise : e)
    };

    // **Close modal first**
    setShowSetModal(false);

    // **Reset state immediately**
    setPendingSetData({ workoutId: null, exerciseId: null });
    setSetWeight('');
    setSetReps('');

    // Update the workout
    updateWorkout(updatedWorkout);
  };

  const currentWorkout = workouts.find(w => w.id === activeWorkout);

  // --- Summary Stats ---
  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
  const totalSets = workouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0);
  const heroStats = [
    { label: 'Workouts logged', value: workouts.length },
    { label: 'Exercises tracked', value: totalExercises },
    { label: 'Total sets', value: totalSets }
  ];

  return (
    <div className="gym-page page-shell">
      {/* Header */}
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

      {/* Content */}
      <div className="gym-content glass">
        {!activeWorkout ? (
          <div className="workout-list-view">
            {/* New Workout */}
            <div className="new-workout-section">
              <h2>Start New Workout</h2>
              <div className="new-workout-form">
                <input
                  type="text"
                  placeholder="Workout title (e.g., Legs, Chest/Triceps)"
                  value={workoutTitle}
                  onChange={e => setWorkoutTitle(e.target.value)}
                  className="workout-title-input"
                  onKeyPress={e => e.key === 'Enter' && startNewWorkout()}
                />
                <button className="start-workout-button" onClick={startNewWorkout}>Start Workout</button>
              </div>
            </div>

            {/* Past Workouts */}
            {workouts.length > 0 && (
              <div className="past-workouts-section">
                <h2>Past Workouts</h2>
                <div className="workouts-list">
                  {workouts.slice().reverse().map(workout => (
                    <div
                      key={workout.id}
                      className="workout-card"
                      onClick={() => setActiveWorkout(workout.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="workout-card-header">
                        <div>
                          <h3>{workout.title}</h3>
                          <p className="workout-date">
                            {new Date(workout.date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          className="delete-workout-button"
                          onClick={e => { e.stopPropagation(); deleteWorkout(workout.id); }}
                        >
                          X
                        </button>
                      </div>
                      <div className="workout-summary">
                        <span>
                          {workout.exercises.length} exercises (
                          {Array.from(new Set(workout.exercises.map(e => e.bodyPart))).join(', ')}
                          )
                        </span>
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
              <button className="finish-workout-button" onClick={finishWorkout}>Finish Workout</button>
            </div>

            <div className="exercises-list">
              {currentWorkout?.exercises.map(exercise => (
                <div key={exercise.id} className="exercise-card">
                  <div className="exercise-header">
                    <h3>{exercise.name} ({exercise.bodyPart})</h3>
                    <button className="add-set-button" onClick={() => addSet(activeWorkout, exercise.id)}>+ Add Set</button>
                  </div>
                  <div className="sets-list">
                    {exercise.sets.map((set, i) => (
                      <div key={set.id} className="set-item">
                        <span className="set-number">Set {i + 1}</span>
                        <span className="set-weight">{set.weight} lbs</span>
                        <span className="set-reps">{set.reps} reps</span>
                      </div>
                    ))}
                    {exercise.sets.length === 0 && <div className="no-sets">No sets added yet</div>}
                  </div>
                </div>
              ))}
              {currentWorkout?.exercises.length === 0 && <div className="no-exercises"><p>No exercises added yet</p></div>}
            </div>

            <button className="add-exercise-button" onClick={() => addExercise(activeWorkout)}>+ Add Exercise</button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && <div className="gym-error-message">{errorMessage}</div>}

      {/* Add Exercise Modal */}
      {showExerciseModal && (
        <div className="gym-modal-overlay" onClick={() => setShowExerciseModal(false)}>
          <div className="gym-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Exercise</h3>
            <p className="gym-modal-subtitle">Enter the details of your exercise</p>
            <div className="gym-modal-form-row">
              <select value={bodyPart} onChange={e => setBodyPart(e.target.value)} className="gym-modal-input small">
                {['Back','Chest','Biceps','Triceps','Quads','Calves','Shoulders','Core'].map(part => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Exercise name"
                value={exerciseName}
                onChange={e => setExerciseName(e.target.value)}
                className="gym-modal-input"
              />
              <input
                type="number"
                placeholder="Weight (lbs)"
                value={setWeight}
                onChange={e => setSetWeight(e.target.value)}
                className="gym-modal-input small"
                min="0"
              />
              <input
                type="number"
                placeholder="Reps"
                value={setReps}
                onChange={e => setSetReps(e.target.value)}
                className="gym-modal-input small"
                min="1"
                onKeyPress={e => e.key === 'Enter' && handleExerciseSubmit()}
              />
            </div>
            <div className="gym-modal-actions">
              <button className="gym-modal-button secondary" onClick={() => setShowExerciseModal(false)}>Cancel</button>
              <button className="gym-modal-button primary" onClick={handleExerciseSubmit}>Add Exercise</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Set Modal */}
      {showSetModal && (
        <div className="gym-modal-overlay" onClick={() => setShowSetModal(false)}>
          <div className="gym-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Set</h3>
            <p className="gym-modal-subtitle">Enter weight and reps</p>
            <div className="gym-modal-form-row">
              <input
                type="number"
                placeholder="Weight (lbs)"
                value={setWeight}
                onChange={e => setSetWeight(e.target.value)}
                className="gym-modal-input small"
                min="0"
              />
              <input
                type="number"
                placeholder="Reps"
                value={setReps}
                onChange={e => setSetReps(e.target.value)}
                className="gym-modal-input small"
                min="1"
                onKeyPress={e => e.key === 'Enter' && handleSetSubmit()}
              />
            </div>
            <div className="gym-modal-actions">
              <button className="gym-modal-button secondary" onClick={() => setShowSetModal(false)}>Cancel</button>
              <button className="gym-modal-button primary" onClick={handleSetSubmit}>Add Set</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GymPage;
