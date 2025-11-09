import { useState, useEffect } from 'react';
import TabNavigation from './components/TabNavigation';
import MacroSidebar from './components/MacroSidebar';
import SwipingPage from './pages/SwipingPage';
import MetricsPage from './pages/MetricsPage';
import GymPage from './pages/GymPage';
import ChatbotPage from './pages/ChatbotPage';
import OnboardingFlow from './components/OnboardingFlow';
import { calculateCaloricMaintenance } from './utils/calorieCalculator';
import './App.css';

const MIN_BASELINE_SWIPES = 6;
const tabs = [
  { id: 'swiping', label: 'Home' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'gym', label: 'Gym' },
  { id: 'chatbot', label: 'Chat' }
];

function App() {
  const [activeTab, setActiveTab] = useState('swiping');
  const [preferences, setPreferences] = useState(null);
  const [userInfo, setUserInfo] = useState({
    name: '',
    weight: '',
    height: '',
    sex: '',
    age: ''
  });
  const [likedFoods, setLikedFoods] = useState([]);
  const [swipingState, setSwipingState] = useState({
    currentIndex: 0,
    likedFoods: [],
    dislikedFoods: [],
    preferences: null,
    totalFoodsAvailable: 0,
    allSwipesComplete: false
  });
  const [gymData, setGymData] = useState({
    workouts: [],
    benchPress: [],
    squat: []
  });
  const [caloricMaintenance, setCaloricMaintenance] = useState(null);
  const [initialSwipingComplete, setInitialSwipingComplete] = useState(false);
  const [consumedFoods, setConsumedFoods] = useState([]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('preferences');
    const savedUserInfo = localStorage.getItem('userInfo');
    const savedLikedFoods = localStorage.getItem('likedFoods');
    const savedSwipingState = localStorage.getItem('swipingState');
    const savedGymData = localStorage.getItem('gymData');
    const savedCaloricMaintenance = localStorage.getItem('caloricMaintenance');
    const savedInitialSwipingComplete = localStorage.getItem('initialSwipingComplete');
    const savedConsumedFoods = localStorage.getItem('consumedFoods');

    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
    if (savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo));
    }
    if (savedLikedFoods) {
      setLikedFoods(JSON.parse(savedLikedFoods));
    }
    if (savedSwipingState) {
      setSwipingState(JSON.parse(savedSwipingState));
    }
    if (savedGymData) {
      setGymData(JSON.parse(savedGymData));
    }
    if (savedCaloricMaintenance) {
      const parsed = parseInt(savedCaloricMaintenance);
      // Validate that it's a reasonable number (between 1000 and 10000)
      if (!isNaN(parsed) && parsed >= 1000 && parsed <= 10000) {
        setCaloricMaintenance(parsed);
      } else {
        // Clear invalid value
        localStorage.removeItem('caloricMaintenance');
      }
    }
    if (savedConsumedFoods) {
      setConsumedFoods(JSON.parse(savedConsumedFoods));
    }
    // Only restore initialSwipingComplete if we actually have swipes recorded
    // This prevents the issue where it's set to true but user hasn't actually swiped
    if (savedInitialSwipingComplete === 'true') {
      const savedSwipingState = localStorage.getItem('swipingState');
      const savedLikedFoods = localStorage.getItem('likedFoods');
      if (savedSwipingState) {
        const parsedState = JSON.parse(savedSwipingState);
        const likedFoodsArray = savedLikedFoods ? JSON.parse(savedLikedFoods) : [];
        const dislikedFoodsArray = parsedState.dislikedFoods || [];
        const totalSwipes = likedFoodsArray.length + dislikedFoodsArray.length;
        
        // Only set to true if we have actual swipe data AND all swipes are complete
        if (parsedState.allSwipesComplete && totalSwipes > 0 && parsedState.currentIndex >= (parsedState.totalFoodsAvailable || 0)) {
          setInitialSwipingComplete(true);
        } else {
          // Reset if data is inconsistent
          localStorage.setItem('initialSwipingComplete', 'false');
        }
      } else {
        // Reset if no swiping state exists
        localStorage.setItem('initialSwipingComplete', 'false');
      }
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

  // Save swiping state to localStorage
  useEffect(() => {
    localStorage.setItem('swipingState', JSON.stringify(swipingState));
  }, [swipingState]);

  // Save gym data to localStorage
  useEffect(() => {
    localStorage.setItem('gymData', JSON.stringify(gymData));
  }, [gymData]);

  // Save caloric maintenance to localStorage
  useEffect(() => {
    if (caloricMaintenance !== null) {
      localStorage.setItem('caloricMaintenance', caloricMaintenance.toString());
    }
  }, [caloricMaintenance]);

  // Save initial swiping complete status to localStorage
  useEffect(() => {
    localStorage.setItem('initialSwipingComplete', initialSwipingComplete.toString());
  }, [initialSwipingComplete]);

  // Save consumed foods to localStorage
  useEffect(() => {
    localStorage.setItem('consumedFoods', JSON.stringify(consumedFoods));
  }, [consumedFoods]);

  // Auto-calculate caloric maintenance when user info and preferences are available
  useEffect(() => {
    if (!caloricMaintenance && userInfo && preferences) {
      const weight = parseFloat(userInfo.weight);
      const height = parseFloat(userInfo.height);
      const age = parseInt(userInfo.age);
      const sex = userInfo.sex;
      const activityLevel = preferences.activityLevel;

      // Check if all required data is available
      if (
        !isNaN(weight) && weight > 0 &&
        !isNaN(height) && height > 0 &&
        !isNaN(age) && age > 0 &&
        sex &&
        activityLevel
      ) {
        const calculated = calculateCaloricMaintenance(weight, height, age, sex, activityLevel);
        if (calculated >= 1000 && calculated <= 10000) {
          setCaloricMaintenance(calculated);
        }
      }
    }
  }, [userInfo, preferences, caloricMaintenance]);

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

  const signalsFromDislikes = swipingState?.dislikedFoods?.length || 0;
  const swipesRecorded = likedFoods.length + signalsFromDislikes;
  const hasTasteProfile = swipesRecorded >= MIN_BASELINE_SWIPES;
  const hasDiningHalls = Array.isArray(preferences?.diningHall) 
    ? preferences.diningHall.length > 0
    : (preferences?.diningHall ? true : false);
  const shouldShowOnboarding = !preferences || !userInfo?.name || !hasDiningHalls;
  // Show initial swiping session if onboarding is done but initial swiping is not complete
  // Only check initialSwipingComplete flag, not swipesRecorded (that changes as user swipes)
  const showInitialSwiping = !shouldShowOnboarding && !initialSwipingComplete;
  // Check if all swipes are complete (either from initial session or current state)
  const allSwipesComplete = initialSwipingComplete || swipingState?.allSwipesComplete || false;

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
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
            swipingState={swipingState}
            onSwipingStateChange={setSwipingState}
            caloricMaintenance={caloricMaintenance}
            onCaloricMaintenanceChange={setCaloricMaintenance}
            experienceMode="dashboard"
            onboardingTarget={MIN_BASELINE_SWIPES}
            onAllSwipesComplete={undefined}
            consumedFoods={consumedFoods}
            onConsumedFoodsChange={setConsumedFoods}
          />
        );
      case 'metrics':
        return (
          <MetricsPage
            consumedFoods={consumedFoods}
            caloricMaintenance={caloricMaintenance}
            gymData={gymData}
            userInfo={userInfo}
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
        return (
          <ChatbotPage
            preferences={preferences}
            userInfo={userInfo}
            likedFoods={likedFoods}
            caloricMaintenance={caloricMaintenance}
            mealPlan={null}
          />
        );
      default:
        return <SwipingPage
          preferences={preferences}
          onPreferencesChange={handlePreferencesChange}
          userInfo={userInfo}
          onUserInfoChange={handleUserInfoChange}
          onLikedFoodsChange={setLikedFoods}
          swipingState={swipingState}
          onSwipingStateChange={setSwipingState}
        />;
    }
  };

  const handleOnboardingComplete = ({ preferences: newPreferences, userInfo: newUserInfo }) => {
    setPreferences(newPreferences);
    setUserInfo(newUserInfo);
  };

  const handleInitialSwipingComplete = () => {
    setInitialSwipingComplete(true);
  };

  if (shouldShowOnboarding) {
    return (
      <div className="app-onboarding-root">
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Show initial swiping session after onboarding but before home page
  // Only show if we haven't completed initial swiping yet
  if (showInitialSwiping) {
    return (
      <div className="app-onboarding-root">
        <SwipingPage
          preferences={preferences}
          onPreferencesChange={handlePreferencesChange}
          userInfo={userInfo}
          onUserInfoChange={handleUserInfoChange}
          onLikedFoodsChange={setLikedFoods}
          swipingState={swipingState}
          onSwipingStateChange={setSwipingState}
          caloricMaintenance={caloricMaintenance}
          onCaloricMaintenanceChange={setCaloricMaintenance}
          experienceMode="onboarding"
          onboardingTarget={MIN_BASELINE_SWIPES}
          onAllSwipesComplete={handleInitialSwipingComplete}
        />
      </div>
    );
  }

  // If initial swiping is complete, show home page with tabs
  // The swiping tab will show the normal swiping interface

  return (
    <div className="app">
      <header className="app-top-bar">
        <div className="app-brand">
          <span className="brand-title">MealSwipeRight</span>
        </div>
        <nav className="app-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`app-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabSelect(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="app-core">
        {allSwipesComplete && (
          <MacroSidebar
            consumedFoods={consumedFoods}
            caloricMaintenance={caloricMaintenance}
            preferences={preferences}
            userInfo={userInfo}
          />
        )}
        <div className="app-main-content">
          {renderPage()}
        </div>
      </div>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
