// src/config.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FRONTEND_URL_AI = import.meta.env.VITE_FRONTEND_URL_AI || import.meta.env.VITE_FRONTEND_LOCAL;
const ADMIN_LAB_URL = import.meta.env.VITE_ADMIN_LAB_URL || 'http://18.232.147.219:5000';

// Add validation and fallback
if (!API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL is not defined in environment variables');
}

if (!FRONTEND_URL_AI) {
  console.error('❌ FRONTEND_URL is not defined in environment variables');
}

export { API_BASE_URL, FRONTEND_URL_AI, ADMIN_LAB_URL };