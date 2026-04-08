// src/config.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FRONTEND_URL_AI = import.meta.env.VITE_FRONTEND_URL_AI;
const ADMIN_LAB_URL = import.meta.env.VITE_ADMIN_LAB_URL;

// Debugging-ku idha add pannu, production-la console-la check pannalam
if (!ADMIN_LAB_URL) {
  console.error('❌ VITE_ADMIN_LAB_URL is missing!');
}

export { API_BASE_URL, FRONTEND_URL_AI, ADMIN_LAB_URL };