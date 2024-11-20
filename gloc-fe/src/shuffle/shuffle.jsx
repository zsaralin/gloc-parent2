
let randomImageArr;
import { SERVER_URL } from './config';

export async function  getRandomImages() {
    if(!randomImageArr) {
        const response = await fetch(`${SERVER_URL}/random`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
        });
        randomImageArr = await response.json()
        shuffleArray(randomImageArr);

    }
    return randomImageArr;
}