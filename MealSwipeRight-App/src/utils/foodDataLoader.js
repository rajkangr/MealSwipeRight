// Utility to load food data and check if it needs to be re-scraped
export async function loadFoodData() {
  try {
    const response = await fetch('/src/data/foodData.json');
    if (!response.ok) {
      throw new Error('Failed to load food data');
    }
    
    const data = await response.json();
    
    // Check if data has timestamp and if it's from today
    if (data.timestamp) {
      const savedDate = new Date(data.timestamp);
      const today = new Date();
      
      // Check if saved date is before today (menu changes at midnight)
      if (savedDate.toDateString() !== today.toDateString()) {
        console.warn('⚠️ Food data is outdated. Menu changes at midnight. Please run scraper.py to update.');
        // Still return the data, but warn user
      }
    }
    
    // Handle both old format (array) and new format (object with foods array)
    if (Array.isArray(data)) {
      return data;
    } else if (data.foods && Array.isArray(data.foods)) {
      return data.foods;
    } else {
      // Fallback: try to return data as-is
      return data;
    }
  } catch (error) {
    console.error('Error loading food data:', error);
    console.warn('⚠️ Food data file not found. Please run scraper.py to generate foodData.json');
    // Return empty array if file doesn't exist
    return [];
  }
}

