import { useState } from 'react';
import './Settings.css';

function Settings({ isOpen, onClose, preferences, onPreferencesChange, userInfo, onUserInfoChange }) {
  const [localPreferences, setLocalPreferences] = useState(preferences || {
    isVegetarian: false,
    isGlutenFree: false,
    isDairyFree: false,
    isVegan: false,
    isKeto: false,
    diningHall: ''
  });

  const [localUserInfo, setLocalUserInfo] = useState(userInfo || {
    weight: '',
    height: '',
    sex: '',
    age: ''
  });

  const diningHalls = [
    { value: 'hampshire', label: 'Hampshire' },
    { value: 'worcester', label: 'Worcester' },
    { value: 'franklin', label: 'Franklin' },
    { value: 'berkshire', label: 'Berkshire' }
  ];

  const handleSave = () => {
    onPreferencesChange(localPreferences);
    onUserInfoChange(localUserInfo);
    onClose();
  };

  const handlePreferenceChange = (key, value) => {
    setLocalPreferences({ ...localPreferences, [key]: value });
  };

  const handleUserInfoChange = (key, value) => {
    setLocalUserInfo({ ...localUserInfo, [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>Dietary Preferences</h3>
            <div className="preferences-grid">
              <label className="preference-checkbox">
                <input
                  type="checkbox"
                  checked={localPreferences.isVegetarian}
                  onChange={(e) => handlePreferenceChange('isVegetarian', e.target.checked)}
                />
                <span>Vegetarian</span>
              </label>
              <label className="preference-checkbox">
                <input
                  type="checkbox"
                  checked={localPreferences.isVegan}
                  onChange={(e) => handlePreferenceChange('isVegan', e.target.checked)}
                />
                <span>Vegan</span>
              </label>
              <label className="preference-checkbox">
                <input
                  type="checkbox"
                  checked={localPreferences.isGlutenFree}
                  onChange={(e) => handlePreferenceChange('isGlutenFree', e.target.checked)}
                />
                <span>Gluten Free</span>
              </label>
              <label className="preference-checkbox">
                <input
                  type="checkbox"
                  checked={localPreferences.isDairyFree}
                  onChange={(e) => handlePreferenceChange('isDairyFree', e.target.checked)}
                />
                <span>Dairy Free</span>
              </label>
              <label className="preference-checkbox">
                <input
                  type="checkbox"
                  checked={localPreferences.isKeto}
                  onChange={(e) => handlePreferenceChange('isKeto', e.target.checked)}
                />
                <span>Keto</span>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <h3>Dining Hall</h3>
            <div className="dining-hall-buttons">
              {diningHalls.map((hall) => (
                <button
                  key={hall.value}
                  className={`dining-hall-btn ${
                    localPreferences.diningHall === hall.value ? 'selected' : ''
                  }`}
                  onClick={() => handlePreferenceChange('diningHall', hall.value)}
                >
                  {hall.label}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3>User Information</h3>
            <div className="user-info-form">
              <div className="form-group">
                <label>Weight (lbs)</label>
                <input
                  type="number"
                  value={localUserInfo.weight}
                  onChange={(e) => handleUserInfoChange('weight', e.target.value)}
                  placeholder="Enter weight"
                />
              </div>
              <div className="form-group">
                <label>Height (inches)</label>
                <input
                  type="number"
                  value={localUserInfo.height}
                  onChange={(e) => handleUserInfoChange('height', e.target.value)}
                  placeholder="Enter height"
                />
              </div>
              <div className="form-group">
                <label>Sex</label>
                <select
                  value={localUserInfo.sex}
                  onChange={(e) => handleUserInfoChange('sex', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  value={localUserInfo.age}
                  onChange={(e) => handleUserInfoChange('age', e.target.value)}
                  placeholder="Enter age"
                />
              </div>
            </div>
          </section>

          <button className="save-button" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;

