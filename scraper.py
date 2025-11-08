import requests
from bs4 import BeautifulSoup
import pandas as pd
import time


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
                'healthfulness_score': link.get('data-healthfulness', ''),
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


def save_to_csv(data, filename='um_dining.csv'):
    if not data:
        print("No data")
        return None

    df = pd.DataFrame(data)

    numeric_cols = ['calories', 'calories_from_fat', 'total_fat_g', 'saturated_fat_g',
                    'trans_fat_g', 'cholesterol_mg', 'sodium_mg', 'total_carb_g',
                    'dietary_fiber_g', 'sugars_g', 'protein_g', 'healthfulness_score']

    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    df.to_csv(filename, index=False)
    print(f"\n Saved {len(df)} items to {filename}")

    return df


def main():
    hamp_data = scrape_umass_dining('hampshire')
    data = scrape_all_locations()

    if data:
        df = save_to_csv(data)


if __name__ == "__main__":
    main()