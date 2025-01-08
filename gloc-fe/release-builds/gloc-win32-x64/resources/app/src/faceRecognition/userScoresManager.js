// Generate a UUID in JavaScript
import {SERVER_URL} from "../config.js";

export function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now();
    }
    userID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

}

export let userID;
// Send this userID along with requests to the server
export async function createNewScoresDB() {
    userID = generateUUID();

    const response = await fetch(`${SERVER_URL}/create-scores`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userID })
    });
}

export async function deletePrevScoresDB() {
    if(!userID) return
    try {
        const response = await fetch(`${SERVER_URL}/delete-scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
        }
    } catch (error) {
        console.error('Failed to delete scores:', error);
    }
}