// Simple, direct configuration - no external dependencies
export const API_CONFIG = {
  BASE_URL: 'https://rehabiri.com',
  TIMEOUT: 10000, // 10 seconds
  ENDPOINTS: {
    AUTH: '/api/auth',
    PATIENTS: '/api/patients',
    SESSIONS: '/api/sessions',
    EARNINGS: '/api/earnings',
    OTP: '/api/otp',
  },
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Rehabiri',
  VERSION: '1.0.0',
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
} as const;

// Environment checks
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;


export default {
  API: API_CONFIG,
  APP: APP_CONFIG,
  isDevelopment,
  isProduction,
};
