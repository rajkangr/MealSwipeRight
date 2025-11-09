import { useState, useEffect } from 'react';
import { calculateCaloricMaintenance } from '../utils/calorieCalculator';
import './CaloricMaintenance.css';

function CaloricMaintenance({ 
  userInfo, 
  preferences, 
  onUserInfoChange, 
  onPreferencesChange,
  onCaloricMaintenanceSet,
  onShowSettings 
}) {
  const [knowsMaintenance, setKnowsMaintenance] = useState(null);
  const [manualCalories, setManualCalories] = useState('');
  const [calculatedCalories, setCalculatedCalories] = useState(null);
  const [missingData, setMissingData] = useState([]);

  const checkMissingData = () => {
    const missing = [];
    if (!userInfo.weight || userInfo.weight === '') missing.push('weight');
    if (!userInfo.height || userInfo.height === '') missing.push('height');
    if (!userInfo.age || userInfo.age === '') missing.push('age');
    if (!userInfo.sex || userInfo.sex === '') missing.push('sex');
    if (!preferences?.activityLevel || preferences.activityLevel === '') missing.push('activity level');
    return missing;
  };

  const handleCalculate = () => {
    const missing = checkMissingData();
    if (missing.length > 0) {
      setMissingData(missing);
      return;
    }

    const weight = parseFloat(userInfo.weight);
    const height = parseFloat(userInfo.height);
    const age = parseInt(userInfo.age);
    const sex = userInfo.sex;
    const activityLevel = preferences.activityLevel;

    if (isNaN(weight) || isNaN(height) || isNaN(age)) {
      setMissingData(['Please enter valid numbers for weight, height, and age']);
      return;
    }

    const calories = calculateCaloricMaintenance(weight, height, age, sex, activityLevel);
    setCalculatedCalories(calories);
    setMissingData([]);
  };

  const handleSetCalories = (calories) => {
    if (onCaloricMaintenanceSet) {
      onCaloricMaintenanceSet(calories);
    }
  };

  const handleOpenSettings = () => {
    if (onShowSettings) {
      onShowSettings();
    }
  };

  useEffect(() => {
    // If user has all data, auto-calculate when component mounts
    const missing = checkMissingData();
    if (missing.length === 0 && knowsMaintenance === false) {
      handleCalculate();
    }
  }, [userInfo, preferences]);

  return (
    <div className="caloric-maintenance-section">
      <h2>Daily Caloric Maintenance</h2>
      <p className="section-description">
        To create a personalized meal plan, we need to know your daily caloric maintenance.
      </p>

      {knowsMaintenance === null && (
        <div className="maintenance-options">
          <button 
            className="option-button"
            onClick={() => setKnowsMaintenance(true)}
          >
            I know my daily caloric maintenance
          </button>
          <button 
            className="option-button"
            onClick={() => {
              setKnowsMaintenance(false);
              const missing = checkMissingData();
              if (missing.length > 0) {
                setMissingData(missing);
              } else {
                handleCalculate();
              }
            }}
          >
            Calculate it for me
          </button>
        </div>
      )}

      {knowsMaintenance === true && (
        <div className="manual-entry">
          <label>
            Enter your daily caloric maintenance (calories):
            <input
              type="number"
              value={manualCalories}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) {
                  setManualCalories(val);
                }
              }}
              placeholder="e.g., 2000"
              min="0"
            />
          </label>
          <button
            className="set-button"
            onClick={() => {
              const calories = parseInt(manualCalories);
              // Validate reasonable range (1000-10000 calories)
              if (!isNaN(calories) && calories >= 1000 && calories <= 10000) {
                handleSetCalories(calories);
              } else {
                alert('Please enter a valid caloric maintenance between 1000 and 10000 calories.');
              }
            }}
            disabled={!manualCalories || isNaN(parseInt(manualCalories)) || parseInt(manualCalories) <= 0}
          >
            Set Caloric Maintenance
          </button>
        </div>
      )}

      {knowsMaintenance === false && (
        <div className="calculation-section">
          {missingData.length > 0 && (
            <div className="missing-data-warning">
              <p>⚠️ Missing information:</p>
              <ul>
                {missingData.map((item, index) => (
                  <li key={index}>
                    {item === 'activity level' ? 'Activity Level' : 
                     item.charAt(0).toUpperCase() + item.slice(1)}
                  </li>
                ))}
              </ul>
              <p>Please update your settings to provide this information.</p>
              <button className="settings-button" onClick={handleOpenSettings}>
                Open Settings
              </button>
            </div>
          )}

          {missingData.length === 0 && (
            <>
              <div className="user-info-display">
                <p><strong>Weight:</strong> {userInfo.weight} lbs</p>
                <p><strong>Height:</strong> {userInfo.height} inches</p>
                <p><strong>Age:</strong> {userInfo.age} years</p>
                <p><strong>Sex:</strong> {userInfo.sex.charAt(0).toUpperCase() + userInfo.sex.slice(1)}</p>
                <p><strong>Activity Level:</strong> {
                  preferences.activityLevel === 'sedentary' ? 'Sedentary' :
                  preferences.activityLevel === 'lightly' ? 'Lightly Active' :
                  preferences.activityLevel === 'moderately' ? 'Moderately Active' :
                  preferences.activityLevel === 'active' ? 'Active' :
                  preferences.activityLevel === 'very' ? 'Very Active' : ''
                }</p>
              </div>

              {calculatedCalories ? (
                <div className="calculated-result">
                  <h3>Your Daily Caloric Maintenance:</h3>
                  <div className="calories-display">{calculatedCalories} calories</div>
                  <button
                    className="set-button"
                    onClick={() => handleSetCalories(calculatedCalories)}
                  >
                    Use This Value
                  </button>
                </div>
              ) : (
                <button className="calculate-button" onClick={handleCalculate}>
                  Calculate Caloric Maintenance
                </button>
              )}
            </>
          )}
        </div>
      )}

      {knowsMaintenance !== null && (
        <button 
          className="back-button"
          onClick={() => {
            setKnowsMaintenance(null);
            setManualCalories('');
            setCalculatedCalories(null);
            setMissingData([]);
          }}
        >
          Back
        </button>
      )}
    </div>
  );
}

export default CaloricMaintenance;

