import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import './FoodCard.css';

function FoodCard({ food, onSwipe, index }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setDragOffset({ x: eventData.deltaX, y: eventData.deltaY });
      setIsDragging(true);
    },
    onSwipedLeft: () => {
      onSwipe('left');
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    },
    onSwipedRight: () => {
      onSwipe('right');
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    },
    onSwiped: () => {
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    },
    trackMouse: true,
    trackTouch: true,
  });

  const rotation = dragOffset.x * 0.1;
  const opacity = Math.max(0.5, 1 - Math.abs(dragOffset.x) / 300);

  return (
    <div
      {...handlers}
      className={`food-card ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        opacity: opacity,
        zIndex: 100 - index,
      }}
    >
      <div className="swipe-indicator swipe-left" style={{ opacity: dragOffset.x < -50 ? Math.min(1, Math.abs(dragOffset.x) / 200) : 0 }}>
        <span>👎</span>
        <span>NOPE</span>
      </div>
      <div className="swipe-indicator swipe-right" style={{ opacity: dragOffset.x > 50 ? Math.min(1, dragOffset.x / 200) : 0 }}>
        <span>👍</span>
        <span>LIKE</span>
      </div>
      
      <div className="food-card-content">
        <div className="food-header">
          <h2 className="food-name">{food.name}</h2>
          <div className="food-location">{food.location}</div>
        </div>
        
        <div className="food-info">
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">Category:</span>
              <span className="info-value">{food.category || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Meal Type:</span>
              <span className="info-value">{food.meal_type || 'N/A'}</span>
            </div>
          </div>

          <div className="nutrition-section">
            <h3>Nutrition Info</h3>
            <div className="nutrition-grid">
              {food.calories && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{food.calories}</span>
                  <span className="nutrition-label">Calories</span>
                </div>
              )}
              {food.protein_g && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{food.protein_g}g</span>
                  <span className="nutrition-label">Protein</span>
                </div>
              )}
              {food.total_carb_g && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{food.total_carb_g}g</span>
                  <span className="nutrition-label">Carbs</span>
                </div>
              )}
              {food.total_fat_g && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{food.total_fat_g}g</span>
                  <span className="nutrition-label">Fat</span>
                </div>
              )}
            </div>
          </div>

          {food.diet_types && (
            <div className="diet-types">
              <span className="diet-label">Diet Types: </span>
              <span>{food.diet_types}</span>
            </div>
          )}

          {food.allergens && (
            <div className="allergens">
              <span className="allergen-label">Allergens: </span>
              <span>{food.allergens || 'None listed'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoodCard;

