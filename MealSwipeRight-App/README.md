# MealSwipeRight 🍽️

A Tinder-style React web application for swiping through food options from UMass Dining. Swipe right if you like the food, swipe left if you don't!

## Features

- 🎯 **Tinder-style Swiping**: Swipe cards left or right using touch gestures or mouse drag
- 📊 **Real-time Stats**: Track how many foods you've liked and disliked
- 🍕 **Food Information**: View detailed nutritional information, allergens, and dietary information
- 🎨 **Beautiful UI**: Modern gradient design with smooth animations
- 📱 **Responsive**: Works on both desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the app directory:
```bash
cd MealSwipeRight-App
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Usage

- **Swipe Right** (or click the green Like button): If you like the food
- **Swipe Left** (or click the red Nope button): If you don't like the food
- View your stats in real-time at the top of the screen
- See all your liked foods at the end of the session

## Project Structure

```
MealSwipeRight-App/
├── src/
│   ├── components/
│   │   ├── FoodCard.jsx      # Swipeable food card component
│   │   └── FoodCard.css      # Card styling
│   ├── data/
│   │   └── sampleFoodData.js # Sample food data (matches scraper output)
│   ├── App.jsx               # Main app component
│   ├── App.css               # App styling
│   ├── index.css             # Global styles
│   └── main.jsx              # App entry point
└── package.json
```

## Data Integration

The app currently uses sample food data. To integrate with your scraper:

1. Run the Python scraper to get food data:
```bash
python scraper.py
```

2. Convert the CSV output to JSON or create an API endpoint

3. Update `App.jsx` to fetch data from your API/JSON file instead of using `sampleFoodData`

Example:
```javascript
useEffect(() => {
  // Fetch from API
  fetch('/api/foods')
    .then(res => res.json())
    .then(data => setFoods(data));
}, []);
```

## Technologies Used

- React 19
- Vite
- react-swipeable (for swipe gestures)
- CSS3 (for animations and styling)

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
