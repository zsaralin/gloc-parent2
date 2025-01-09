// services/shuffleManagerService.js
import ShuffleManager from './ShuffleManager.js';

const shuffleManager = ShuffleManager;

export async function startShuffle() {
    await shuffleManager.startShuffle();
}

export function stopShuffle() {
    shuffleManager.stopShuffle();
}

export async function fetchRandomImages() {
    return await shuffleManager.getRandomImages();
}

export function isShuffling() {
    return shuffleManager.isShuffling();
}

export function clearImages() {
    shuffleManager.clearImages();
}
