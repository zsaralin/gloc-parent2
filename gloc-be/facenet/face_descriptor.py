import sys
import json
import cv2
import numpy as np
import base64
import io
from PIL import Image
from keras_facenet import FaceNet
from mtcnn import MTCNN

# Suppress TensorFlow and Keras warnings
import os
import tensorflow as tf
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import logging
tf.get_logger().setLevel(logging.ERROR)
logging.getLogger("tensorflow").setLevel(logging.ERROR)
logging.getLogger("tensorflow").disabled = True
logging.getLogger().setLevel(logging.ERROR)
# ✅ Suppress Keras Progress Bars

logging.getLogger("tensorflow").setLevel(logging.ERROR)
logging.getLogger("keras").setLevel(logging.ERROR)
logging.getLogger("mtcnn").setLevel(logging.ERROR)
tf.config.set_visible_devices([], 'GPU')
class FaceDescriptor:
    def __init__(self):
        """Initialize FaceNet model and MTCNN detector."""
        self.embedder = FaceNet()
        self.detector = MTCNN()
        self._disable_facenet_logs()
    def _disable_facenet_logs(self):
        """Suppresses FaceNet logs that may appear during embedding."""
        import absl.logging
        logging.root.removeHandler(absl.logging._absl_handler)
        absl.logging._warn_preinit_stderr = False
        logging.getLogger('absl').setLevel(logging.ERROR)
    def preprocess_image(self, image_data_url):
        """Decodes base64 image data URL, extracts the face, and preprocesses it for FaceNet."""
        try:
            header, encoded = image_data_url.split(',', 1) if ',' in image_data_url else (None, image_data_url)
            image_bytes = base64.b64decode(encoded)

            # Convert to image
            image = np.array(Image.open(io.BytesIO(image_bytes)))

            # Convert RGB to BGR for OpenCV
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            # Detect face
            faces = self.detector.detect_faces(image)
            if not faces:
                return None

            # Extract face bounding box
            x, y, width, height = faces[0]['box']
            face = image[y:y+height, x:x+width]

            # Resize and normalize
            face = cv2.resize(face, (160, 160))
            face = face.astype('float32') / 255.0
            face = np.expand_dims(face, axis=0)

            return face

        except Exception:
            return None

    def get_descriptor(self, image_data_url):
        face_pixels = self.preprocess_image(image_data_url)
        if face_pixels is None:
            return None

        # Bypass `self.embedder.embeddings(...)` and call model directly
        model = self.embedder.model  # Keras model
        preds = model.predict(face_pixels, verbose=None)
        return preds[0].tolist()


if __name__ == "__main__":
    try:
        # Read base64 data from stdin
        image_data_url = sys.stdin.read().strip()

        # Get face descriptor
        face_descriptor = FaceDescriptor()
        descriptor = face_descriptor.get_descriptor(image_data_url)

        # ✅ PRINT JSON OUTPUT ONLY (No extra logs)
        print("BEGIN_JSON")  # Sentinel start
        print(json.dumps(descriptor))
        print("END_JSON")    # Sentinel end


    except Exception:
        print(json.dumps(None))  # Ensure JSON format even on errors
