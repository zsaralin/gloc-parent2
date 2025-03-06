const {Pool} = require("pg");
require('dotenv').config(); // Load environment variables from .env file

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

async function createScoresTable() {
    // First, try to drop the existing table if it exists
    const dropQuery = `DROP TABLE IF EXISTS Scores;`;

    // Query to create a new table
    const createQuery = `
        CREATE TABLE IF NOT EXISTS Scores (
                                              userID TEXT,
                                              label TEXT,
                                              score NUMERIC,
                                              update_count INTEGER DEFAULT 0, -- Add the update_count column with default value 0
                                              PRIMARY KEY (userID, label)
            );
    `;

    try {
        console.log("DB User:", process.env.DB_USER);
        console.log("DB Password:", process.env.DB_PASSWORD ? "****" : "Not Set"); // Masked for security
        console.log("DB Host:", process.env.DB_HOST);
        console.log("DB Port:", process.env.DB_PORT);
        console.log("DB Name:", process.env.DB_NAME);
        // Execute the drop table query
        await pool.query(dropQuery);
        console.log("Existing 'scores' table dropped.");

        // Execute the create table query
        await pool.query(createQuery);
        console.log("Table 'scores' is ready.");
    } catch (error) {
        // Check if the error is due to insufficient privileges
        if (error.code === '42501') {
            console.error("Permission denied to modify 'scores' table. Please check database permissions for the user:", error);
        } else {
            // Log other types of errors
            console.error("Error initializing 'scores' table:", error);
        }
    }
}

async function createNewScores(userID) {
    const query = `
        INSERT INTO Scores (userID)
        VALUES ($1) ON CONFLICT (userID) DO NOTHING;
    `;

    try {
        // Execute the query with the userID as a parameter.
        const result = await pool.query(query, [userID]);

        // Log the outcome based on the result of the query
        if (result.rowCount === 0) {
            console.log(`No new record created for userID: ${userID}, already exists.`);
        } else {
            console.log(`New record created successfully for userID: ${userID}.`);
        }
    } catch (error) {
        // Log any errors that occur during the execution of the query
        console.error(`Failed to insert new score for userID: ${userID}`, error);
    }
    await printDB()
}
async function createOrUpdateScores(userID, entries) {
    if (!userID || !entries.length) return; // Exit if no data to update

    const labels = entries.map(entry => entry.label);
    const scores = entries.map(entry => entry.normalizedDistance);
    const updateCounts = new Array(entries.length).fill(1); // Each update increments by 1

    const query = `
        INSERT INTO Scores (userID, label, score, update_count)
        VALUES ($1, unnest($2::text[]), unnest($3::double precision[]), unnest($4::int[]))
        ON CONFLICT (userID, label)
        DO UPDATE SET 
            score = Scores.score + EXCLUDED.score,
            update_count = Scores.update_count + 1;
    `;

    try {
        await pool.query(query, [userID, labels, scores, updateCounts]);
    } catch (error) {
        console.error(`Failed to update scores for userID: ${userID}`, error);
    }
}

async function deleteUserEntry(userID) {
    try {
        const query = 'DELETE FROM Scores WHERE userID = $1;';
        const result = await pool.query(query, [userID]);
        if (result.rowCount > 0) {
            console.log(`Successfully deleted user entry for userID: ${userID}`);
        }  else {
        }
    } catch (error) {
        console.error(`Error deleting user entry for userID: ${userID}`, error);
    }
}

async function printDB(){
    try {
        const result = await pool.query('SELECT * FROM Scores');
        console.log(result.rows); // This will print all rows retrieved from the table
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
}
async function getSortedLabelsByUserID(userID) {
    const query = `
        SELECT label, (score / NULLIF(update_count, 0)) AS normalizedDistance
        FROM Scores
        WHERE userID = $1
        ORDER BY score DESC;
    `;

    try {
        // Execute query and return result directly (no need to map manually)
        const { rows } = await pool.query(query, [userID]);
        return rows; // Directly return rows, which already contain normalizedDistance
    } catch (error) {
        console.error(`Failed to fetch and sort labels for userID: ${userID}`, error);
        return [];
    }
}
async function checkIfUserExists(userID) {
    const query = `SELECT EXISTS (SELECT 1 FROM Scores WHERE userID = $1) AS user_exists;`;
    try {
        const { rows } = await pool.query(query, [userID]);
        return rows[0].user_exists;
    } catch (error) {
        console.error(`Failed to check if user exists: ${userID}`, error);
        return false; // Assume user doesn't exist on DB error
    }
}
module.exports = { createNewScores, createScoresTable, checkIfUserExists, deleteUserEntry, createOrUpdateScores , getSortedLabelsByUserID};
