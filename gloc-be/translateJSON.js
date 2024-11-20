// translate_info.js

const fs = require('fs');
const path = require('path');
const { Translate } = require('@google-cloud/translate').v2;
require('dotenv').config({ path: '../.env' });

// Instantiate a translation client
const translate = new Translate();

// Custom translations for keys
const keyTranslations = {
  'estado': 'status',
  'fechaDeSecuestro': 'dateOfAbduction',
  'lugarDeSecuestro': 'placeOfAbduction',
  'edad': 'age',
  'sexo': 'sex',
  'fechaDeNacimiento': 'dateOfBirth',
  'lugarDeNacimiento': 'placeOfBirth',
  'nacionalidad': 'nationality',
  'apodos': 'nicknames',
  'estadoCivil': 'maritalStatus',
  'domicilios': 'addresses',
  'ocupaciones': 'occupations',
  'estudios': 'studies',
  'victimasSimultaneas': 'simultaneousVictims',
  'apellido': 'lastName',
  'nombres': 'firstNames',
  'numeroDeRegistros': 'numberOfRecords'
};

// Custom translations for specific values
const valueTranslations = {
  'Masculino': 'Male',
  'Femenino': 'Female',
  'Soltero/a': 'Single',
  'No hay información.': 'No information.',
  // Add more specific value translations as needed
};

// Keys whose values should not be translated (after key translation)
const valuesToSkip = ['placeOfAbduction', 'firstNames', 'lastName', 'name'];

// Function to determine if a value should be translated based on the parent key
function shouldTranslateValue(parentKey, value) {
  if (valuesToSkip.includes(parentKey)) {
    return false;
  }
  // Special handling for 'simultaneousVictims'
  if (parentKey === 'simultaneousVictims') {
    // Do not translate if value is not 'No hay información.'
    if (typeof value === 'string' && value !== 'No hay información.') {
      return false;
    } else if (Array.isArray(value)) {
      return true; // We'll handle individual items in the array
    }
  }
  return true;
}

async function translateText(text, targetLanguage = 'en') {
  try {
    // Check if the text has a custom translation
    if (valueTranslations[text]) {
      return valueTranslations[text];
    }
    const [translation] = await translate.translate(text, targetLanguage);
    return translation;
  } catch (err) {
    console.error('Error translating text:', err);
    return text; // Return the original text if translation fails
  }
}

async function translateJson(data, parentKey = '') {
  if (typeof data === 'string') {
    // Decide whether to translate based on the parent key
    if (shouldTranslateValue(parentKey, data)) {
      // Translate string
      return await translateText(data);
    } else {
      // Skip translating this value
      return data;
    }
  } else if (Array.isArray(data)) {
    // Translate each item in the array
    return Promise.all(data.map(item => translateJson(item, parentKey)));
  } else if (typeof data === 'object' && data !== null) {
    // Translate each key and value in the object
    const entries = await Promise.all(
      Object.entries(data).map(async ([key, value]) => {
        // Use custom translation for the key if available
        const translatedKey = keyTranslations[key] || (await translateText(key));
        const translatedValue = await translateJson(value, translatedKey);
        return [translatedKey, translatedValue];
      })
    );
    return Object.fromEntries(entries);
  } else {
    // Return other data types as is
    return data;
  }
}

async function processInfoJson(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    console.log(`Translating ${filePath}...`);

    const translatedData = await translateJson(data);

    const outputFilePath = path.join(path.dirname(filePath), 'info_en.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(translatedData, null, 2), 'utf8');

    console.log(`Translated ${filePath} and saved to ${outputFilePath}`);
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
  }
}

async function traverseDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Recursively traverse subdirectories
      await traverseDirectory(fullPath);
    } else if (entry.isFile() && entry.name === 'info.json') {
      // Process info.json files
      await processInfoJson(fullPath);
    }
  }
}

async function main() {
  const baseDir = path.join(__dirname, '..','..','..','db', 'arg');

  await traverseDirectory(baseDir);
}

main().catch(err => console.error('Error in main function:', err));
