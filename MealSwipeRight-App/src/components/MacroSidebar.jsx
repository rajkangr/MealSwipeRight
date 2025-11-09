import { useState, useEffect } from 'react';
import './MacroSidebar.css';

function MacroSidebar({ likedFoods, caloricMaintenance }) {
  const [dailyStats, setDailyStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    // Calculate totals from liked foods
    const totals = likedFoods.reduce((acc, food) => {
      return {
        calories: acc.calories + (parseFloat(food.calories) || 0),
        protein: acc.protein + (parseFloat(food.protein_g) || 0),
        carbs: acc.carbs + (parseFloat(food.total_carb_g) || 0),
        fat: acc.fat + (parseFloat(food.total_fat_g) || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    setDailyStats(totals);
  }, [likedFoods]);

  // Calculate target macros (if caloric maintenance is set)
  const targetMacros = caloricMaintenance ? {
    calories: caloricMaintenance,
    protein: Math.round(caloricMaintenance * 0.3 / 4), // 30% of calories from protein
    carbs: Math.round(caloricMaintenance * 0.4 / 4), // 40% of calories from carbs
    fat: Math.round(caloricMaintenance * 0.3 / 9) // 30% of calories from fat
  } : null;

  const getProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const MacroCard = ({ title, current, target, unit = '' }) => {
    const progress = target ? getProgress(current, target) : 0;
    const displayValue = target ? `${Math.round(current)}/${target}${unit}` : `${Math.round(current)}${unit}`;

    return (
      <div className="macro-card">
        <div className="macro-card-header">
          <span className="macro-title">{title}</span>
        </div>
        <div className="macro-value-display">{displayValue}</div>
        {target && (
          <div className="macro-progress-bar">
            <div 
              className="macro-progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        {target && (
          <div className="macro-percentage">{Math.round(progress)}%</div>
        )}
      </div>
    );
  };

  return (
    <div className="macro-sidebar">
      <div className="macro-sidebar-header">
        <h2>Daily Progress</h2>
      </div>
      <div className="macro-cards">
        <MacroCard
          title="Daily Calories"
          current={dailyStats.calories}
          target={targetMacros?.calories}
        />
        <MacroCard
          title="Protein Goal"
          current={dailyStats.protein}
          target={targetMacros?.protein}
          unit="g"
        />
        <MacroCard
          title="Carbs"
          current={dailyStats.carbs}
          target={targetMacros?.carbs}
          unit="g"
        />
        <MacroCard
          title="Fat"
          current={dailyStats.fat}
          target={targetMacros?.fat}
          unit="g"
        />
      </div>
      {!caloricMaintenance && (
        <div className="macro-warning">
          <p>Set your caloric maintenance to see progress goals</p>
        </div>
      )}
    </div>
  );
}

export default MacroSidebar;

