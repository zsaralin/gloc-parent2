import { SERVER_URL } from "../config.js";
import {numTotalGridItems} from '../grid/gridLayout.jsx'
function encodePath(path) {
    return path.split('/').map(decodeURIComponent).map(encodeURIComponent).join('/');
}

export async function loadImages(imageDataArray, maxConcurrent = 10) {
    let currentIndex = 0;
    const loadedImages = [];
  
    // Inner function to load a single image
    const loadSingleImage = async (imageData) => {
      const encodedImagePath = encodePath(imageData.imagePath[0]);
      const srcUrl = `${SERVER_URL}${encodedImagePath}`;
      const imageElement = new Image();
      imageElement.src = srcUrl;
      imageElement.imagePath = imageData.imagePath;
      imageElement.label = imageData.label;
      imageElement.distance = imageData.distance;
      imageElement.jsonData = imageData.jsonData;
  
      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = reject;
      });
  
      return imageElement;
    };
  
    // Main loader function
    async function loadNext() {
      if (currentIndex >= imageDataArray.length) {
        return null; // No more images to load
      }
      const imageData = imageDataArray[currentIndex];
      currentIndex++;
  
      try {
        const result = await loadSingleImage(imageData);
        if (result) {
          loadedImages.push(result);
        }
      } catch (err) {
        console.warn(`Failed to load image: ${imageData?.imagePath}`, err);
      }
  
      // Attempt to load next if there's still any left
      if (currentIndex < imageDataArray.length) {
        return loadNext();
      }
      return null;
    }
  
    // Start all the "slots" in parallel
    const slots = [];
    for (let i = 0; i < maxConcurrent && i < imageDataArray.length; i++) {
      slots.push(loadNext());
    }
  
    // Wait until all are done
    await Promise.all(slots);
  
    return loadedImages;
}