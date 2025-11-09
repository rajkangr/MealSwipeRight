import { useState, useEffect } from 'react';
import './GymPage.css';

function GymPage({ onWorkoutUpdate, workouts: parentWorkouts }) {
  const [workouts, setWorkouts] = useState(parentWorkouts || []);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutTitle, setWorkoutTitle] = useState('');

  // Sync with parent workouts if provided
  useEffect(() => {
    if (parentWorkouts) {
      setWorkouts(parentWorkouts);
    }
  }, [parentWorkouts]);

  const startNewWorkout = () => {
    if (!workoutTitle.trim()) {
      alert('Please enter a workout title');
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
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    const exerciseName = prompt('Enter exercise name (e.g., Bench Press, Squat):');
    if (!exerciseName) return;

    const updatedWorkout = {
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          id: Date.now(),
          name: exerciseName,
          sets: []
        }
      ]
    };

    updateWorkout(updatedWorkout);
  };

  const addSet = (workoutId, exerciseId) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    const exercise = workout.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const weight = prompt('Enter weight (lbs):');
    const reps = prompt('Enter reps:');

    if (!weight || !reps) return;

    const newSet = {
      id: Date.now(),
      weight: parseFloat(weight),
      reps: parseInt(reps)
    };

    const updatedExercise = {
      ...exercise,
      sets: [...exercise.sets, newSet]
    };

    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map(e => e.id === exerciseId ? updatedExercise : e)
    };

    updateWorkout(updatedWorkout);
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

  return (
    <div className="gym-page">
      <div className="gym-header">
        <h1>Gym</h1>
      </div>

      <div className="gym-content">
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
                          🗑️
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
    </div>
  );
}

export default GymPage;

