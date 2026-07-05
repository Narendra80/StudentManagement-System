import json
import os

# Ensure students.json is located in the same directory as this script
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'students.json')

def load_data():
    """
    Loads student records from the JSON file.
    If the file doesn't exist or is corrupted, returns an empty list.
    """
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except Exception as e:
        print(f"Error loading data from {DATA_FILE}: {e}")
        return []

def save_data(data):
    """
    Saves the list of student dictionaries to the JSON file with pretty indentation.
    """
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving data to {DATA_FILE}: {e}")
        return False
