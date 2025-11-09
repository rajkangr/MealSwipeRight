import { useMemo } from 'react';
import './MacroSidebar.css';

function MacroSidebar({ likedFoods, caloricMaintenance }) {
  const totals = useMemo(() => {
    return likedFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + (parseFloat(food.calories) || 0),
        protein: acc.protein + (parseFloat(food.protein_g) || 0),
        carbs: acc.carbs + (parseFloat(food.total_carb_g) || 0),
        fat: acc.fat + (parseFloat(food.total_fat_g) || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [likedFoods]);

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
    </aside>
  );
}

export default MacroSidebar;

