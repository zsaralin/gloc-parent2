export const SERVER_URL =  "https://sandbx.levelofconfidence.net";//"https://face-recognition-be.onrender.com"; //


let currLanguage = localStorage.getItem("language") || "en";
let cachedText = null;

// Fetch and cache text.json
export async function loadTextJson() {
  if (!cachedText) {
    const response = await fetch("/text.json");
    cachedText = await response.json();
    console.log(cachedText)
  }
  return cachedText[currLanguage] || {};
}

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
export const getText = async () => {
  if(!cachedText) await loadTextJson()
  return cachedText[currLanguage] || {};
};