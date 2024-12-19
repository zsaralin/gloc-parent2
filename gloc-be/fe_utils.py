import os
from PIL import Image

def convert_to_jpeg(root_folder):
    for dirpath, dirnames, filenames in os.walk(root_folder):
        if dirpath.endswith("images"):
            converted = False
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                ext = os.path.splitext(filename)[1].lower()
                # Check for non-JPG files
                if ext != '.jpg' and ext in ['.jpeg', '.png', '.bmp', '.tiff', '.webp']:
                    try:
                        # Open the image and save it as .jpg
                        with Image.open(filepath) as img:
                            new_filename = os.path.splitext(filename)[0] + ".jpg"
                            new_filepath = os.path.join(dirpath, new_filename)
                            img.convert("RGB").save(new_filepath, "JPEG")
                        os.remove(filepath)  # Remove the original file
                        print(f"Converted: {filepath}")
                        converted = True
                    except Exception as e:
                        print(f"Error converting {filepath}: {e}")
            # Print the folder name if any conversion happened
            if converted:
                print(f"Folder with conversions: {dirpath}")

# Replace 'db' with your folder path
root_folder = "../db"
convert_to_jpeg(root_folder)
