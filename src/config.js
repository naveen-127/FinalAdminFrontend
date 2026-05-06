// src/config.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FRONTEND_URL_AI = import.meta.env.VITE_FRONTEND_URL_AI;
const ADMIN_LAB_URL = import.meta.env.VITE_ADMIN_LAB_URL;

// Debug: Log the URL to verify it's loaded correctly
console.log('ADMIN_LAB_URL from config:', ADMIN_LAB_URL);

// Export with a default export as well for safety
export { API_BASE_URL, FRONTEND_URL_AI, ADMIN_LAB_URL };
export default { API_BASE_URL, FRONTEND_URL_AI, ADMIN_LAB_URL };