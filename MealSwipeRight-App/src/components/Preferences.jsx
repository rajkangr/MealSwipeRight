import { useState } from 'react';
import './Preferences.css';

function Preferences({ onPreferencesSubmit }) {
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [selectedDiningHall, setSelectedDiningHall] = useState('');

  const diningHalls = [
    { value: 'hampshire', label: 'Hampshire' },
    { value: 'worcester', label: 'Worcester' },
    { value: 'franklin', label: 'Franklin' },
    { value: 'berkshire', label: 'Berkshire' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDiningHall) {
      alert('Please select a dining hall');
      return;
    }
    onPreferencesSubmit({
      isVegetarian,
      diningHall: selectedDiningHall
    });
  };

  return (
    <div className="preferences-container">
      <div className="preferences-card">
        <h1>🍽️ MealSwipeRight</h1>
        <p className="preferences-subtitle">Let's set up your preferences!</p>
        
        <form onSubmit={handleSubmit} className="preferences-form">
          <div className="preference-section">
            <h2>Dietary Preference</h2>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isVegetarian}
                  onChange={(e) => setIsVegetarian(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">I am vegetarian</span>
              </label>
            </div>
          </div>

          <div className="preference-section">
            <h2>Select Dining Hall</h2>
            <div className="dining-hall-grid">
              {diningHalls.map((hall) => (
                <button
                  key={hall.value}
                  type="button"
                  className={`dining-hall-button ${
                    selectedDiningHall === hall.value ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedDiningHall(hall.value)}
                >
                  {hall.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="submit-button">
            Start Swiping! 🎉
          </button>
        </form>
      </div>
    </div>
  );
}

export default Preferences;

