import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import './FoodCard.css';

function FoodCard({ food, onSwipe, index }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
          <h2 
            className="food-name clickable"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(true);
            }}
          >
            {food.name}
          </h2>
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

      {showDetails && (
        <div className="food-details-overlay" onClick={() => setShowDetails(false)}>
          <div className="food-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="food-details-header">
              <h2>{food.name}</h2>
              <button className="close-details-button" onClick={() => setShowDetails(false)}>×</button>
            </div>
            <div className="food-details-content">
              <div className="details-section">
                <h3>Basic Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Serving Size:</span>
                    <span className="detail-value">{food.serving_size || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{food.location ? food.location.charAt(0).toUpperCase() + food.location.slice(1) : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{food.category || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Meal Type:</span>
                    <span className="detail-value">{food.meal_type || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Complete Nutrition Information</h3>
                <div className="nutrition-details-grid">
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Calories</span>
                    <span className="nutrition-detail-value">{food.calories || 'N/A'}</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Calories from Fat</span>
                    <span className="nutrition-detail-value">{food.calories_from_fat || 'N/A'}</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Total Fat</span>
                    <span className="nutrition-detail-value">{food.total_fat_g || 'N/A'}g {food.total_fat_dv ? `(${food.total_fat_dv})` : ''}</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Saturated Fat</span>
                    <span className="nutrition-detail-value">{food.saturated_fat_g || 'N/A'}g</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Trans Fat</span>
                    <span className="nutrition-detail-value">{food.trans_fat_g || 'N/A'}g</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Cholesterol</span>
                    <span className="nutrition-detail-value">{food.cholesterol_mg || 'N/A'}mg</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Sodium</span>
                    <span className="nutrition-detail-value">{food.sodium_mg || 'N/A'}mg {food.sodium_dv ? `(${food.sodium_dv})` : ''}</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Total Carbohydrates</span>
                    <span className="nutrition-detail-value">{food.total_carb_g || 'N/A'}g {food.total_carb_dv ? `(${food.total_carb_dv})` : ''}</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Dietary Fiber</span>
                    <span className="nutrition-detail-value">{food.dietary_fiber_g || 'N/A'}g {food.dietary_fiber_dv ? `(${food.dietary_fiber_dv})` : ''}</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Sugars</span>
                    <span className="nutrition-detail-value">{food.sugars_g || 'N/A'}g</span>
                  </div>
                  <div className="nutrition-detail-item">
                    <span className="nutrition-detail-label">Protein</span>
                    <span className="nutrition-detail-value">{food.protein_g || 'N/A'}g {food.protein_dv ? `(${food.protein_dv})` : ''}</span>
                  </div>
                </div>
              </div>

              {food.diet_types && (
                <div className="details-section">
                  <h3>Diet Types</h3>
                  <p className="details-text">{food.diet_types}</p>
                </div>
              )}

              {food.allergens && (
                <div className="details-section">
                  <h3>Allergens</h3>
                  <p className="details-text">{food.allergens || 'None listed'}</p>
                </div>
              )}

              {food.carbon_rating && (
                <div className="details-section">
                  <h3>Carbon Rating</h3>
                  <p className="details-text">{food.carbon_rating}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodCard;

