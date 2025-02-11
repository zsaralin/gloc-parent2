import json
import unicodedata
import re

def sanitize_string(s):
    """Remove spaces and apostrophes but keep existing underscores."""
    # Normalize unicode characters to their ASCII equivalent
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
    # Remove spaces and apostrophes while keeping underscores
    s = re.sub(r"[ '\-]", "", s)  # Removes spaces, apostrophes, and hyphens
    # Keep only alphanumeric characters and underscores
    s = re.sub(r"[^a-zA-Z0-9_]", "", s)
    return s

def sanitize_dict(d):
    """Recursively sanitize keys and labels in a dictionary."""
    if isinstance(d, dict):
        new_dict = {}
        for key, value in d.items():
            new_key = sanitize_string(key)
            if isinstance(value, dict):
                new_dict[new_key] = sanitize_dict(value)
            elif isinstance(value, list):
                new_dict[new_key] = [sanitize_dict(item) if isinstance(item, dict) else item for item in value]
            elif key == "label" and isinstance(value, str):
                new_dict[new_key] = sanitize_string(value)
            else:
                new_dict[new_key] = value
        return new_dict
    return d

# Load the JSON file
with open("descriptors/descriptors_arg.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Sanitize the JSON data
cleaned_data = sanitize_dict(data)

# Save the cleaned JSON
with open("cleaned_output.json", "w", encoding="utf-8") as f:
    json.dump(cleaned_data, f, indent=4, ensure_ascii=False)

print("JSON cleaned and saved as cleaned_output.json")
