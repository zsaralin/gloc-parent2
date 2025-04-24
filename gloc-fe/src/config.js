export const SERVER_URL =  "http://localhost:5000";//"https://face-recognition-be.onrender.com"; //


let currLanguage = localStorage.getItem("language") || "es";

// Hold loaded text in memory
const response = await fetch('/text.json');
let cachedText = await response.json();

export const getLanguage = () => currLanguage;

export const setLanguage = (lang) => {
  currLanguage = lang;
  localStorage.setItem("language", lang);
};

export const toggleLanguage = () => {
  currLanguage = currLanguage === "es" ? "en" : "es";
  localStorage.setItem("language", currLanguage);
  return currLanguage;
};

// ✅ Fetch text.json only once, then return correct language subset
export const getText = () => {
  if(!cachedText) return null
  return cachedText[currLanguage] || {};
};