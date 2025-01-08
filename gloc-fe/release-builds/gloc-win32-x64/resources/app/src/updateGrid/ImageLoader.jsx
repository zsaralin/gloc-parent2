import { SERVER_URL } from "../config.js";
import {numTotalGridItems} from '../grid/gridLayout.jsx'
function encodePath(path) {
    return path.split('/').map(decodeURIComponent).map(encodeURIComponent).join('/');
}

export async function loadImages(imageDataArray) {
    try {
        console.log('starting load')
        const startTime = Date.now(); // Capture the start time        
        const batchSize = 20; // Adjusted batch size
        const loadedImages = [];
        const numPhotos = numTotalGridItems
        for (let i = 0; i < numPhotos; i += batchSize) {
            const batchImages = imageDataArray.slice(i, i + batchSize);
            const batchPromises = batchImages.map(async (imageData) => {
                if (typeof imageData !== 'object') {
                    console.error('Invalid imageData structure:', imageData);
                    return null;
                }

                const encodedImagePath = encodePath(imageData.imagePath[0]);
                const srcUrl = `${SERVER_URL}${encodedImagePath}`;

                try {
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
                } catch (err) {
                    console.warn(`Failed to load image: ${srcUrl}`);
                    return null;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            loadedImages.push(...batchResults.filter(img => img !== null));
        }

        const endTime = Date.now(); // Capture the end time
        console.log(`done load - Duration: ${endTime - startTime} ms`);
        return loadedImages.slice(0, numPhotos);
    } catch (error) {
        console.error('Error loading images:', error);
    }
}
