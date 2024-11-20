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
    // Prepare the batch insert/update query for labels and scores
    if (!userID) {
        return; // Exit the function if userID is undefined
    }

    const baseQuery = `
        INSERT INTO Scores (userID, label, score, update_count)
        VALUES ($1, $2, $3, 1)
            ON CONFLICT (userID, label)
        DO UPDATE SET
            score = (Scores.score + EXCLUDED.score),
                           update_count = Scores.update_count + 1;
    `;

    try {
        // Process each entry in the array
        for (let entry of entries) {
            const { label, normalizedDistance } = entry;
            // Insert or update the score for each label
            await pool.query(baseQuery, [userID, label, normalizedDistance]);
        }
    } catch (error) {
        // Log any errors that occur during the execution of the queries
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
        SELECT label, score, update_count
        FROM Scores
        WHERE userID = $1
        ORDER BY score DESC;
    `;

    try {
        // Execute the query with the userID as a parameter.
        const result = await pool.query(query, [userID]);

        // Extract the labels, scores, and score count from the query results
        const sortedLabels = result.rows.map(row => ({
            label: row.label,
            normalizedDistance: row.score / row.update_count  // Divide each score by the score count
        }));

        return sortedLabels;
    } catch (error) {
        // Log any errors that occur during the execution of the query
        console.error(`Failed to fetch and sort labels for userID: ${userID}`, error);
        return []; // Return an empty array in case of error
    }
}
module.exports = { createNewScores, createScoresTable, deleteUserEntry, createOrUpdateScores , getSortedLabelsByUserID};
