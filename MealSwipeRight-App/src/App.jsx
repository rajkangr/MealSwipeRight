import { useState, useEffect } from 'react';
import TabNavigation from './components/TabNavigation';
import SwipingPage from './pages/SwipingPage';
import MetricsPage from './pages/MetricsPage';
import GymPage from './pages/GymPage';
import ChatbotPage from './pages/ChatbotPage';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('swiping');
  const [preferences, setPreferences] = useState(null);
  const [userInfo, setUserInfo] = useState({
    weight: '',
    height: '',
    sex: '',
    age: ''
  });
  const [likedFoods, setLikedFoods] = useState([]);
  const [gymData, setGymData] = useState({
    workouts: [],
    benchPress: [],
    squat: []
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('preferences');
    const savedUserInfo = localStorage.getItem('userInfo');
    const savedLikedFoods = localStorage.getItem('likedFoods');
    const savedGymData = localStorage.getItem('gymData');

    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
    if (savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo));
    }
    if (savedLikedFoods) {
      setLikedFoods(JSON.parse(savedLikedFoods));
    }
    if (savedGymData) {
      setGymData(JSON.parse(savedGymData));
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    if (preferences) {
      localStorage.setItem('preferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  // Save user info to localStorage
  useEffect(() => {
    if (userInfo) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }
  }, [userInfo]);

  // Save liked foods to localStorage
  useEffect(() => {
    localStorage.setItem('likedFoods', JSON.stringify(likedFoods));
  }, [likedFoods]);

  // Save gym data to localStorage
  useEffect(() => {
    localStorage.setItem('gymData', JSON.stringify(gymData));
  }, [gymData]);

  const handlePreferencesChange = (newPreferences) => {
    setPreferences(newPreferences);
  };

  const handleUserInfoChange = (newUserInfo) => {
    setUserInfo(newUserInfo);
  };

  const handleWorkoutUpdate = (workout) => {
    // Update gym data with new workout
    const updatedWorkouts = [...gymData.workouts];
    const existingIndex = updatedWorkouts.findIndex(w => w.id === workout.id);
    
    if (existingIndex >= 0) {
      updatedWorkouts[existingIndex] = workout;
    } else {
      updatedWorkouts.push(workout);
    }

    // Extract exercise data for metrics
    const benchPressData = [];
    const squatData = [];

    updatedWorkouts.forEach(w => {
      w.exercises.forEach(ex => {
        if (ex.name.toLowerCase().includes('bench')) {
          ex.sets.forEach(set => {
            benchPressData.push({
              date: w.date,
              weight: set.weight,
              reps: set.reps
            });
          });
        }
        if (ex.name.toLowerCase().includes('squat')) {
          ex.sets.forEach(set => {
            squatData.push({
              date: w.date,
              weight: set.weight,
              reps: set.reps
            });
          });
        }
      });
    });

    setGymData({
      workouts: updatedWorkouts,
      benchPress: benchPressData,
      squat: squatData
    });
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'swiping':
        return (
          <SwipingPage
            preferences={preferences}
            onPreferencesChange={handlePreferencesChange}
            userInfo={userInfo}
            onUserInfoChange={handleUserInfoChange}
            onLikedFoodsChange={setLikedFoods}
          />
        );
      case 'metrics':
        return (
          <MetricsPage
            likedFoods={likedFoods}
            gymData={gymData}
          />
        );
      case 'gym':
        return (
          <GymPage
            onWorkoutUpdate={handleWorkoutUpdate}
            workouts={gymData.workouts}
          />
        );
      case 'chatbot':
        return <ChatbotPage />;
      default:
        return <SwipingPage
          preferences={preferences}
          onPreferencesChange={handlePreferencesChange}
          userInfo={userInfo}
          onUserInfoChange={handleUserInfoChange}
          onLikedFoodsChange={setLikedFoods}
        />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
