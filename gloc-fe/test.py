import os
import json
import re

def replace_grandmothers_case_insensitive(base_dir):
    pattern = re.compile(r"Abuelas case", flags=re.IGNORECASE)

    for root, dirs, files in os.walk(base_dir):
        if "info_en.json" in files:
            path = os.path.join(root, "info_en.json")
            changed = False

            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                def process(obj):
                    nonlocal changed
                    if isinstance(obj, dict):
                        return {k: process(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [process(v) for v in obj]
                    elif isinstance(obj, str):
                        if pattern.search(obj):
                            changed = True
                            return pattern.sub("Caso Abuelas", obj)
                    return obj

                updated_data = process(data)

                if changed:
                    with open(path, 'w', encoding='utf-8') as f:
                        json.dump(updated_data, f, ensure_ascii=False, indent=2)
                    print(f"✔ Replaced in: {path}")

            except Exception as e:
                print(f"⚠ Error processing {path}: {e}")

# Run the function on your base directory
replace_grandmothers_case_insensitive(r"C:\Users\admin\IdeaProjects\gloc-parent2\gloc\db\arg")
