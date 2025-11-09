import { useState, useEffect, useMemo } from 'react';
import { getNextUpBullets } from '../utils/geminiClient';
import './MacroSidebar.css';

function MacroSidebar({ consumedFoods, caloricMaintenance, preferences, userInfo, likedFoods }) {
  const [geminiBullets, setGeminiBullets] = useState(null);
  // Get meal window CTA based on current time
  const mealWindowCTA = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();

    if (hour < 11) {
      return 'Lean protein + slow carbs';
    }
    if (hour < 15) {
      return 'Fuel up for the afternoon';
    }
    if (hour < 20) {
      return 'Balance your macros';
    }
    return 'Keep it light & satisfying';
  }, []); // Recalculate every render (time-based)

  // Get dining hall label
  const diningHallLabel = useMemo(() => {
    if (!preferences?.diningHall) return 'your dining hall';
    if (Array.isArray(preferences.diningHall) && preferences.diningHall.length > 0) {
      return preferences.diningHall.length === 1
        ? `${preferences.diningHall[0].charAt(0).toUpperCase()}${preferences.diningHall[0].slice(1)}`
        : `${preferences.diningHall.length} dining halls`;
    }
    return preferences.diningHall.charAt(0).toUpperCase() + preferences.diningHall.slice(1);
  }, [preferences?.diningHall]);

  // Get Gemini-powered bullets for NEXT UP section
  useEffect(() => {
    const fetchBullets = async () => {
      try {
        const bullets = await getNextUpBullets({
          preferences,
          userInfo,
          likedFoods: likedFoods || [],
          consumedFoods,
          caloricMaintenance,
          diningHallLabel
        });
        setGeminiBullets(bullets);
      } catch (error) {
        console.error('Error fetching next up bullets:', error);
        // Fallback to default
        setGeminiBullets(null);
      }
    };
    fetchBullets();
  }, [preferences, userInfo, likedFoods, consumedFoods, caloricMaintenance, diningHallLabel]);

  // Build taste notes - reactive to preferences, likedFoods, and caloricMaintenance
  // Use Gemini bullets if available, otherwise fallback to default
  const tasteNotes = useMemo(() => {
    if (geminiBullets && Array.isArray(geminiBullets) && geminiBullets.length === 3) {
      return geminiBullets;
    }

    // Fallback to default
    const notes = [];

    if (preferences?.isVegetarian) {
      notes.push('Prioritizing plant-forward proteins.');
    } else if (preferences?.isVegan) {
      notes.push('100% vegan-friendly lineup engaged.');
    } else {
      notes.push('Balancing lean proteins with complex carbs.');
    }

    if (preferences?.isGlutenFree) {
      notes.push('Gluten-free filter is active across selections.');
    } else if (preferences?.isDairyFree) {
      notes.push('Dairy-free swaps suggested for creamy dishes.');
    } else {
      notes.push(`Keeping options open inside ${diningHallLabel}.`);
    }

    if (caloricMaintenance) {
      notes.push(`Working toward ${caloricMaintenance} kcal today.`);
    } else {
      notes.push('Complete your profile to calculate caloric maintenance.');
    }

    return notes.slice(0, 3);
  }, [preferences, caloricMaintenance, diningHallLabel, geminiBullets]);
  
  // Calculate totals from CONSUMED foods, not liked foods
  const totals = useMemo(() => {
    return consumedFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + (parseFloat(food.calories) || 0),
        protein: acc.protein + (parseFloat(food.protein_g) || 0),
        carbs: acc.carbs + (parseFloat(food.total_carb_g) || 0),
        fat: acc.fat + (parseFloat(food.total_fat_g) || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [consumedFoods]);

  const targetMacros = useMemo(
    () =>
      caloricMaintenance
        ? {
            calories: caloricMaintenance,
            protein: Math.round((caloricMaintenance * 0.3) / 4),
            carbs: Math.round((caloricMaintenance * 0.4) / 4),
            fat: Math.round((caloricMaintenance * 0.3) / 9)
          }
        : null,
    [caloricMaintenance]
  );

  const getProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const highlightMetrics = [
    {
      title: 'Calories',
      value: totals.calories,
      target: targetMacros?.calories,
      unit: 'kcal'
    },
    {
      title: 'Protein',
      value: totals.protein,
      target: targetMacros?.protein,
      unit: 'g'
    }
  ];

  const secondaryMetrics = [
    {
      title: 'Carbs',
      value: totals.carbs,
      target: targetMacros?.carbs,
      unit: 'g'
    },
    {
      title: 'Fat',
      value: totals.fat,
      target: targetMacros?.fat,
      unit: 'g'
    }
  ];

  return (
    <aside className="macro-sidebar">
      <header className="macro-sidebar-header">
        <p>Daily metrics</p>
        <h2>Nutrition pulse</h2>
      </header>

      <div className="macro-highlight-grid">
        {highlightMetrics.map((metric) => {
          const progress = metric.target ? getProgress(metric.value, metric.target) : 0;
          return (
            <article className="macro-highlight-card" key={metric.title}>
              <span className="macro-highlight-title">{metric.title}</span>
              <div className="macro-highlight-value">
                {Math.round(metric.value)} {metric.unit}
              </div>
              {metric.target && (
                <div className="macro-highlight-progress">
                  <div
                    className="macro-highlight-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              {metric.target && (
                <span className="macro-highlight-meta">
                  {Math.round(progress)}% of {metric.target}
                </span>
              )}
            </article>
          );
        })}
      </div>

      <div className="macro-secondary-grid">
        {secondaryMetrics.map((metric) => {
          const progress = metric.target ? getProgress(metric.value, metric.target) : 0;
          return (
            <article className="macro-secondary-card" key={metric.title}>
              <div className="macro-secondary-title">{metric.title}</div>
              <div className="macro-secondary-value">
                {Math.round(metric.value)} {metric.unit}
              </div>
              {metric.target && (
                <div className="macro-secondary-progress">
                  <div
                    className="macro-secondary-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!caloricMaintenance && (
        <div className="macro-warning">
          <p>Set your caloric maintenance to anchor these goals.</p>
        </div>
      )}

      {/* Next Up Section */}
      <div className="macro-next-up">
        <div className="panel-eyebrow">Next up</div>
        <h3>{mealWindowCTA}</h3>
        <ul className="taste-notes">
          {tasteNotes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default MacroSidebar;

