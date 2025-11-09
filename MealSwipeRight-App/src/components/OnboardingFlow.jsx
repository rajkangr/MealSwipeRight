import { useState } from 'react';
import './OnboardingFlow.css';

const diningHalls = [
  { value: 'hampshire', label: 'Hampshire' },
  { value: 'worcester', label: 'Worcester' },
  { value: 'franklin', label: 'Franklin' },
  { value: 'berkshire', label: 'Berkshire' }
];

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
  { value: 'lightly', label: 'Lightly active (1-3 days/week)' },
  { value: 'moderately', label: 'Moderately active (3-5 days/week)' },
  { value: 'active', label: 'Active (6-7 days/week)' },
  { value: 'very', label: 'Very active (2x per day)' }
];

const defaultPreferences = {
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
  isDairyFree: false,
  isKeto: false,
  diningHall: [],
  activityLevel: ''
};

const defaultUserInfo = {
  name: '',
  weight: '',
  height: '',
  age: '',
  sex: ''
};

function OnboardingFlow({ onComplete }) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [userInfo, setUserInfo] = useState(defaultUserInfo);
  const [error, setError] = useState('');

  const handlePreferenceToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleUserUpdate = (key, value) => {
    setUserInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInfo.name || !preferences.diningHall || preferences.diningHall.length === 0) {
      setError('Please share your name and pick at least one dining hall.');
      return;
    }

    onComplete({
      preferences,
      userInfo
    });
  };

  return (
    <div className="onboarding-flow">
      <div className="onboarding-background" />
      <form className="onboarding-card" onSubmit={handleSubmit}>
        <p className="onboarding-eyebrow">Welcome</p>
        <h1>Let's lock in your preferences.</h1>
        <p className="onboarding-copy">
          We keep things light. Tell us about you and we'll tailor the dining experience just for you.
        </p>

        <div className="onboarding-field">
          <label>Name</label>
          <input
            type="text"
            value={userInfo.name}
            onChange={(e) => handleUserUpdate('name', e.target.value)}
            placeholder="Hack UMass"
          />
        </div>

        <div className="onboarding-grid">
          <div className="onboarding-field">
            <label>Weight (lbs)</label>
            <input
              type="number"
              min="0"
              value={userInfo.weight}
              onChange={(e) => handleUserUpdate('weight', e.target.value)}
              placeholder="170"
            />
          </div>
          <div className="onboarding-field">
            <label>Height (inches)</label>
            <input
              type="number"
              min="0"
              value={userInfo.height}
              onChange={(e) => handleUserUpdate('height', e.target.value)}
              placeholder="70"
            />
          </div>
        </div>

        <div className="onboarding-grid">
          <div className="onboarding-field">
            <label>Age</label>
            <input
              type="number"
              min="13"
              value={userInfo.age}
              onChange={(e) => handleUserUpdate('age', e.target.value)}
            />
          </div>
          <div className="onboarding-field">
            <label>Sex</label>
            <select
              value={userInfo.sex}
              onChange={(e) => handleUserUpdate('sex', e.target.value)}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="onboarding-field">
          <label>Dining Halls (select one or more)</label>
          <div className="dining-options">
            {diningHalls.map((hall) => {
              const isSelected = Array.isArray(preferences.diningHall) 
                ? preferences.diningHall.includes(hall.value)
                : false;
              return (
                <button
                  type="button"
                  key={hall.value}
                  className={`dining-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    const currentHalls = Array.isArray(preferences.diningHall) ? preferences.diningHall : [];
                    if (isSelected) {
                      handleSelectChange('diningHall', currentHalls.filter(h => h !== hall.value));
                    } else {
                      handleSelectChange('diningHall', [...currentHalls, hall.value]);
                    }
                  }}
                >
                  {hall.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="onboarding-field">
          <label>Activity Level</label>
          <select
            value={preferences.activityLevel}
            onChange={(e) => handleSelectChange('activityLevel', e.target.value)}
          >
            <option value="">Select activity</option>
            {activityLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="onboarding-checkbox-grid">
          {['isVegetarian', 'isVegan', 'isGlutenFree', 'isDairyFree', 'isKeto'].map((pref) => (
            <label key={pref} className="onboarding-checkbox">
              <input
                type="checkbox"
                checked={preferences[pref]}
                onChange={() => handlePreferenceToggle(pref)}
              />
              <span>{pref.replace('is', '')}</span>
            </label>
          ))}
        </div>

        {error && <div className="onboarding-error">{error}</div>}

        <button className="onboarding-submit" type="submit">
          Enter the dining hall
        </button>
      </form>
    </div>
  );
}

export default OnboardingFlow;
