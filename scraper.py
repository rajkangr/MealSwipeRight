import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime


def scrape_umass_dining(location='hampshire', date=None):
    base_url = f'https://umassdining.com/locations-menus/{location}/menu'

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        # Make the request
        print(f"Getting menu from {base_url}")
        response = requests.get(base_url, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        food_items = soup.find_all('li', class_='lightbox-nutrition')

        if not food_items:
            print("No food items found")
            return []

        all_foods = []

        for item in food_items:
            link = item.find('a')
            if not link:
                continue

            food_data = {
                'location': location,
                'name': link.get('data-dish-name', ''),
                'serving_size': link.get('data-serving-size', ''),
                'calories': link.get('data-calories', ''),
                'calories_from_fat': link.get('data-calories-from-fat', ''),
                'total_fat_g': link.get('data-total-fat', '').replace('g', ''),
                'total_fat_dv': link.get('data-total-fat-dv', ''),
                'saturated_fat_g': link.get('data-sat-fat', '').replace('g', ''),
                'trans_fat_g': link.get('data-trans-fat', '').replace('g', ''),
                'cholesterol_mg': link.get('data-cholesterol', '').replace('mg', ''),
                'sodium_mg': link.get('data-sodium', '').replace('mg', ''),
                'sodium_dv': link.get('data-sodium-dv', ''),
                'total_carb_g': link.get('data-total-carb', '').replace('g', ''),
                'total_carb_dv': link.get('data-total-carb-dv', ''),
                'dietary_fiber_g': link.get('data-dietary-fiber', '').replace('g', ''),
                'dietary_fiber_dv': link.get('data-dietary-fiber-dv', ''),
                'sugars_g': link.get('data-sugars', '').replace('g', ''),
                'protein_g': link.get('data-protein', '').replace('g', ''),
                'protein_dv': link.get('data-protein-dv', ''),
                'carbon_rating': link.get('data-carbon-list', ''),
                'diet_types': link.get('data-clean-diet-str', ''),
                'allergens': link.get('data-allergens', '')
            }

            parent_div = item.find_parent('div', id=True)
            if parent_div and 'lunch' in parent_div.get('id', '').lower():
                food_data['meal_type'] = 'lunch'
            elif parent_div and 'dinner' in parent_div.get('id', '').lower():
                food_data['meal_type'] = 'dinner'
            else:
                food_data['meal_type'] = 'unknown'

            category_header = item.find_previous('h2', class_='menu_category_name')
            if category_header:
                food_data['category'] = category_header.text.strip()

            all_foods.append(food_data)

        print(f"Successfully scraped {len(all_foods)} items from {location}")
        return all_foods

    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []


def scrape_all_locations():
    locations = ['hampshire', 'worcester', 'franklin', 'berkshire']
    all_data = []

    for location in locations:
        print(f"\n{'=' * 50}")
        print(f"Scraping {location.upper()}")
        print(f"{'=' * 50}")

        data = scrape_umass_dining(location)
        all_data.extend(data)

        time.sleep(5)

    return all_data


def save_to_json(data, filename='MealSwipeRight-App/src/data/foodData.json'):
    """Save scraped data to JSON file with timestamp"""
    if not data:
        print("No data")
        return None

    # Add timestamp to data
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'date': datetime.now().strftime('%Y-%m-%d'),
        'foods': data
    }

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\n Saved {len(data)} items to {filename}")
    print(f"Timestamp: {output_data['timestamp']}")

    return output_data


def should_rescrape(json_file='MealSwipeRight-App/src/data/foodData.json'):
    """Check if data needs to be re-scraped (after midnight)"""
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'timestamp' not in data:
            return True
        
        # Parse the timestamp
        saved_time = datetime.fromisoformat(data['timestamp'])
        saved_date = saved_time.date()
        current_date = datetime.now().date()
        
        # If saved date is before today, need to re-scrape
        return saved_date < current_date
    except (FileNotFoundError, json.JSONDecodeError, KeyError, ValueError):
        # File doesn't exist or is invalid, need to scrape
        return True

def main():
    json_file = 'MealSwipeRight-App/src/data/foodData.json'
    
    # Check if we need to re-scrape
    if should_rescrape(json_file):
        print("Menu data is outdated or missing. Scraping new data...")
        data = scrape_all_locations()
        
        if data:
            save_to_json(data, json_file)
    else:
        print("Menu data is up to date. No scraping needed.")
        print("To force re-scrape, delete the JSON file or wait until after midnight.")


if __name__ == "__main__":
    main()