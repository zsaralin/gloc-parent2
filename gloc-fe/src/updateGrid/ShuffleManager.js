// ShuffleManager.js
import { SERVER_URL } from '../config.js';
import { loadImages } from './ImageLoader.jsx';
import { fillGridItems } from './updateGrid.jsx';
import { numTotalGridItems } from '../grid/gridLayout.jsx';
class ShuffleManager {
    #randomImageArr = null; // Private property
    #isFetching = false;
    #isShuffling = false;
    #shuffleTimeout = null;

    constructor() {
        if (ShuffleManager.instance) {
            return ShuffleManager.instance;
        }

        ShuffleManager.instance = this;
    }

    async getRandomImages() {
        if (!this.#randomImageArr) {
            if (!this.#isFetching) {
                this.#isFetching = true;
                try {
                    const startTime = performance.now(); // Record start time

                    const response = await fetch(`${SERVER_URL}/random`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ numTotalGridItems }) // Send numTotalGridItems in the body
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    this.#randomImageArr = await response.json();
                
                    const elapsedTime = performance.now() - startTime; // Calculate elapsed time
                    console.log(`Await took ${elapsedTime.toFixed(2)} ms`);
                    
                    this.#randomImageArr = await loadImages(this.#randomImageArr);
                } catch (error) {
                    console.error('Error fetching random images:', error);
                } finally {
                    this.#isFetching = false;
                }
            }
            // Wait for the ongoing fetch
            await new Promise((resolve) => {
                const checkFetch = () => {
                    if (!this.#isFetching) {
                        resolve(this.#randomImageArr);
                    } else {
                        setTimeout(checkFetch, 100);
                    }
                };
                checkFetch();
            });
        }
        return this.#randomImageArr;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    startShuffle() {
        // 1. Avoid multiple concurrent shuffles
        if (this.#isShuffling) {
            return;
        }
    
        // 2. Define a function that checks if the images are ready
        const waitForImagesAndShuffle = () => {
            // If images aren't ready yet, wait a bit and check again
            if (!this.#randomImageArr || this.#randomImageArr.length === 0) {
                console.log('No random images yet; waiting...');
                setTimeout(waitForImagesAndShuffle, 100); // check again after 100ms
                return;
            }
    
            // Once random images are ready, actually start shuffling
            this.#isShuffling = true;
            console.log('Starting shuffle...');
    
            const shuffleLoop = () => {
                if (!this.#isShuffling) {
                    return;
                }
    
                // If for some reason the array disappears or is empty, stop
                if (!this.#randomImageArr || this.#randomImageArr.length === 0) {
                    this.stopShuffle();
                    return;
                }
    
                this.shuffleArray(this.#randomImageArr);
                fillGridItems(this.#randomImageArr, false, false, true);
    
                // Schedule the next shuffle
                this.#shuffleTimeout = setTimeout(shuffleLoop, 100); // shuffle every second
            };
    
            shuffleLoop();
        };
    
        // 3. Start the check
        waitForImagesAndShuffle();
    }

    stopShuffle() {
        if (!this.#isShuffling) {
            return;
        }

        if (this.#shuffleTimeout) {
            clearTimeout(this.#shuffleTimeout);
            this.#shuffleTimeout = null;
        }

        this.#isShuffling = false;
        console.log('Shuffling stopped.');
    }

    isShuffling() {
        return this.#isShuffling;
    }

    clearImages() {
        this.#randomImageArr = null;
    }
}

const instance = new ShuffleManager();
Object.freeze(instance); // Freeze only the instance

export default instance;
