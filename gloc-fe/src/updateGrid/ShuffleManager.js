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

    async waitForImages() {
        while (!this.#randomImageArr || this.#randomImageArr.length === 0) {
            console.log('No random images yet; waiting...');
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms
        }
    }

    async startShuffle() {
        // Avoid multiple concurrent shuffles
        if (this.#isShuffling) return;

        this.#isShuffling = true;
        await this.waitForImages(); // Ensure images are ready before proceeding

        console.log('Starting shuffle...');
        
        const shuffleLoop = async () => {
            if (!this.#isShuffling) return;

            if (!this.#randomImageArr || this.#randomImageArr.length === 0) {
                this.stopShuffle();
                return;
            }

            this.shuffleArray(this.#randomImageArr);
            if (this.#isShuffling) {
                await fillGridItems(this.#randomImageArr, false, false, true);
            }
    
            // **Ensure setTimeout doesn’t trigger if stopShuffle() is called**
            if (this.#isShuffling) {
                this.#shuffleTimeout = setTimeout(shuffleLoop, 150);
            }
        };

        shuffleLoop(); // Start the loop
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
