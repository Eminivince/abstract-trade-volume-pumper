/**
 * Application configuration
 *
 * This file centralizes all environment-specific configuration.
 * To switch between production and development:
 *
 * Method 1: Change the IS_PRODUCTION flag below
 * Method 2: Run with environment variable:
 *   - For local development: npm run dev:local
 *   - For production: npm run dev
 */

// Detect if we're using local API based on environment variable
const useLocalApi = import.meta.env.VITE_USE_LOCAL_API === "true";

// You can also manually toggle this flag
export const IS_PRODUCTION = !useLocalApi;

// API and Socket URLs
const PRODUCTION = {
  API_URL: "https://abstract-pump-109a297e2430.herokuapp.com/api",
  SOCKET_URL: "https://abstract-pump-109a297e2430.herokuapp.com",
};

const DEVELOPMENT = {
  API_URL: "http://localhost:5080/api",
  SOCKET_URL: "http://localhost:5080",
};

// Export the appropriate configuration based on environment
export const config = IS_PRODUCTION ? PRODUCTION : DEVELOPMENT;

// Log the current environment on startup
console.log(`Running in ${IS_PRODUCTION ? "PRODUCTION" : "DEVELOPMENT"} mode`);
console.log(`API URL: ${config.API_URL}`);
console.log(`Socket URL: ${config.SOCKET_URL}`);
