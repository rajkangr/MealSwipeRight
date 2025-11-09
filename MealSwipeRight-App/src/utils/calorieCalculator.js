/**
 * Calculate daily caloric maintenance using Mifflin-St Jeor equation
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @param {string} sex - 'male' or 'female'
 * @param {string} activityLevel - 'sedentary', 'lightly', 'moderately', 'active', 'very'
 * @returns {number} Daily caloric maintenance in calories
 */
export function calculateCaloricMaintenance(weight, height, age, sex, activityLevel) {
  // Convert weight from lbs to kg if needed (assuming input is in lbs)
  const weightKg = weight * 0.453592; // Convert lbs to kg
  // Convert height from inches to cm if needed (assuming input is in inches)
  const heightCm = height * 2.54; // Convert inches to cm

  // Base BMR calculation (Mifflin-St Jeor)
  let bmr;
  if (sex === 'female') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  } else {
    // male or other (use male formula)
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  }

  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    lightly: 1.375,
    moderately: 1.55,
    active: 1.725,
    very: 1.9
  };

  const multiplier = activityMultipliers[activityLevel] || 1.2;
  const maintenanceCalories = Math.round(bmr * multiplier);

  return maintenanceCalories;
}

