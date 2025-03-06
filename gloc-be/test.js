const fs = require('fs').promises;

async function convertAndSaveDescriptors(inputFile, outputFile, useAveraging = true) {
    try {
        // Load the original JSON
        const rawData = await fs.readFile(inputFile, 'utf8');
        const jsonData = JSON.parse(rawData);

        const descriptorData = {
            labels: [],
            labelIndex: {},
            descriptors: []
        };

        for (const label in jsonData) {
            const descriptors = jsonData[label].descriptors;
            if (!descriptors.length) continue;

            descriptorData.labelIndex[label] = [];

            let processedDescriptor;

            if (descriptors.length === 1 || !useAveraging) {
                // Use the single descriptor as is
                processedDescriptor = descriptors[0];
            } else {
                // Compute the average descriptor
                processedDescriptor = descriptors[0].map((_, i) =>
                    descriptors.reduce((sum, desc) => sum + desc[i], 0) / descriptors.length
                );
            }

            // Store the descriptor index mapping
            const index = descriptorData.descriptors.length;
            descriptorData.labelIndex[label].push(index);

            // Store label and descriptor
            descriptorData.labels.push(label);
            descriptorData.descriptors.push(processedDescriptor);
        }

        // Save the optimized JSON
        await fs.writeFile(outputFile, JSON.stringify(descriptorData, null, 2), 'utf8');

        console.log(`✅ Conversion complete! Optimized data saved to ${outputFile}`);

    } catch (error) {
        console.error("Error processing JSON:", error);
    }
}

// Run the conversion
const inputFilePath = './descriptors/descriptors_arg.json';  // Original file
const outputFilePath = './descriptors/descriptors_arg2.json'; // New optimized file

convertAndSaveDescriptors(inputFilePath, outputFilePath);
