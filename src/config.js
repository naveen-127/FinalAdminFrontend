// src/config.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FRONTEND_URL_AI = import.meta.env.VITE_FRONTEND_URL_AI;
const ADMIN_LAB_URL = import.meta.env.VITE_ADMIN_LAB_URL;

// Add this line - you can either point it to ADMIN_LAB_URL or the env variable directly
const VITE_ADMIN_LAB_BACKEND_URL = import.meta.env.VITE_ADMIN_LAB_BACKEND_URL || ADMIN_LAB_URL;

// Debug: Log the URL to verify it's loaded correctly
console.log('ADMIN_LAB_URL from config:', ADMIN_LAB_URL);
console.log('VITE_ADMIN_LAB_BACKEND_URL from config:', VITE_ADMIN_LAB_BACKEND_URL);

// Export both
export { API_BASE_URL, FRONTEND_URL_AI, ADMIN_LAB_URL, VITE_ADMIN_LAB_BACKEND_URL };
export default { API_BASE_URL, FRONTEND_URL_AI, ADMIN_LAB_URL, VITE_ADMIN_LAB_BACKEND_URL };