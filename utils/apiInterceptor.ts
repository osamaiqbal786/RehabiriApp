import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../src/config';

// Global logout function - will be set by AuthContext
let globalLogout: (() => Promise<void>) | null = null;

export const setGlobalLogout = (logoutFunction: () => Promise<void>) => {
  globalLogout = logoutFunction;
};

// Enhanced API call function with automatic logout on token expiration
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check for token expiration (401 Unauthorized)
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      
      // Check if it's a token expiration error
      if (errorData.error === 'Token expired' || 
          errorData.error === 'Invalid token' ||
          errorData.message === 'Token expired' ||
          errorData.message === 'Invalid token') {
        
        console.log('🔐 Token expired, logging out user automatically');
        
        // Clear stored token
        await AsyncStorage.removeItem('physio_jwt_token');
        
        // Call global logout function if available
        if (globalLogout) {
          await globalLogout();
        }
        
        // Throw a specific error that can be caught by components
        throw new Error('TOKEN_EXPIRED');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
};

// Helper function to get auth headers with JWT token
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const token = await AsyncStorage.getItem('physio_jwt_token');
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    throw new Error('Failed to get authentication token');
  }
};
