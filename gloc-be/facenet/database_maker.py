import os
import sqlite3
import numpy as np
import cv2
from keras_facenet import FaceNet
import gc 
# Load FaceNet model
embedder = FaceNet()
import cv2
import mediapipe as mp
import numpy as np

# Initialize MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
def preprocess_image(image_path):
    """Detects and extracts the largest face using MediaPipe, then preprocesses it for FaceNet."""
    if not os.path.exists(image_path):
        print(f"❌ Error: File does not exist - {image_path}")
        return None

    # Read image
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ Error: Failed to load image - {image_path}")
        return None

    # Convert to RGB (MediaPipe uses RGB input)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # ✅ Use `with` statement to properly handle MediaPipe Face Detection
    with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.2) as face_detector:
        results = face_detector.process(image_rgb)

        if not results.detections:
            print(f"⚠️ Warning: No face detected in {image_path}")
            return None

        # Find the largest face by bounding box area
        h, w, _ = image.shape
        largest_face = None
        max_area = 0

        for detection in results.detections:
            bbox = detection.location_data.relative_bounding_box
            x, y, width, height = int(bbox.xmin * w), int(bbox.ymin * h), int(bbox.width * w), int(bbox.height * h)
            area = width * height

            if area > max_area:
                max_area = area
                largest_face = image_rgb[y:y+height, x:x+width]

        if largest_face is None:
            return image_rgb

        # Resize to 160x160 (FaceNet input size) and normalize
        # face = cv2.resize(largest_face, (160, 160))
        # face = face.astype('float32') / 255.0  # Normalize between 0 and 1

        return largest_face  # Keep as RGB



def get_embedding(image_path):
    """Generates a 512-dimensional embedding for the given face using FaceNet."""
    try:
        face_pixels = preprocess_image(image_path)
        if face_pixels is None:
            return None  # No face detected

        embeddings = embedder.embeddings([face_pixels])  # ✅ Correct input format
        return embeddings[0]  # Return first embedding

    except Exception as e:
        print(f"❌ Error generating embedding for {image_path}: {e}")
        return None

    finally:
        gc.collect()  # ✅ Force garbage collection
def process_images(base_dir, db_path='face_embeddings_.db'):
    """Processes images in all subfolders and stores embeddings in an SQLite DB."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create the embeddings table if it does not exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS embeddings (
            folder TEXT PRIMARY KEY, 
            embeddings BLOB
        )
    """)

    for subfolder in os.listdir(base_dir):
        subfolder_path = os.path.join(base_dir, subfolder, 'images')

        if not os.path.isdir(subfolder_path):
            continue  # Skip if not a directory

        embeddings = []
        for filename in sorted(os.listdir(subfolder_path)):
            if filename.endswith('.jpg') and not filename.endswith('comp.jpg'):
                image_path = os.path.join(subfolder_path, filename)
                
                # Generate embedding
                embedding = get_embedding(image_path)
                if embedding is not None:
                    embeddings.append(embedding)

        if embeddings:
            print(f"✅ Inserting {len(embeddings)} embeddings for {subfolder}")  # Debug print
            # print(embeddings)
            # Convert embeddings to a byte format
            embeddings_blob = np.array(embeddings, dtype=np.float32).tobytes()
            cursor.execute("INSERT OR REPLACE INTO embeddings (folder, embeddings) VALUES (?, ?)", 
                           (subfolder, embeddings_blob))

    conn.commit()
    conn.close()
    print("🎉 Processing complete.")

# Set your base directory here
base_directory = "../db/arg"
process_images(base_directory)
