import { Patient, Session, SessionFilter } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

// API Base URL - should match your server configuration
export const API_BASE_URL = Config.PUBLIC_API_BASE_URL || 'http://13.62.52.14:3000';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('physio_jwt_token');
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to make API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

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

// Helper function to extract data from new response structure
const extractData = (response: any, key: string) => {
  // Handle new response structure: { success: true, data: { key: value } }
  if (response.data && response.data[key] !== undefined) {
    return response.data[key];
  }
  // Handle old response structure: { key: value }
  if (response[key] !== undefined) {
    return response[key];
  }
  // Fallback
  return response;
};

// Patient functions
export const savePatient = async (patient: Omit<Patient, 'id' | 'createdAt' | 'userId'>): Promise<Patient> => {
  try {
    const response = await apiCall('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });

    return extractData(response, 'patient');
  } catch (error) {
    console.error('Error saving patient:', error);
    throw error;
  }
};

export const getPatients = async (): Promise<Patient[]> => {
  try {
    const response = await apiCall('/api/patients');
    return extractData(response, 'patients');
  } catch (error) {
    console.error('Error getting patients:', error);
    return [];
  }
};

export const getCurrentUserPatients = async (): Promise<Patient[]> => {
  try {
    const response = await apiCall('/api/patients');
    return extractData(response, 'patients') || [];
  } catch (error) {
    console.error('Error getting current user patients:', error);
    return [];
  }
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
  try {
    const response = await apiCall(`/api/patients/${id}`);
    return extractData(response, 'patient');
  } catch (error) {
    console.error('Error getting patient by ID:', error);
    return null;
  }
};

export const updatePatient = async (updatedPatient: Patient): Promise<void> => {
  try {
    await apiCall(`/api/patients/${updatedPatient.id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedPatient),
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

export const deletePatient = async (id: string): Promise<void> => {
  try {
    await apiCall(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};


export const updateAllPatientSessionsDetails = async (patientId: string, sessionDetails: {
  notes?: string;
  time?: string;
  amount?: number;
}): Promise<void> => {
  try {
    await apiCall(`/api/patients/${patientId}/sessions/details`, {
      method: 'PUT',
      body: JSON.stringify(sessionDetails),
    });
  } catch (error) {
    console.error('Error updating all patient session details:', error);
    throw error;
  }
};

export const closeAllUpcomingSessions = async (patientId: string): Promise<void> => {
  try {
    await apiCall(`/api/patients/${patientId}/sessions/close`, {
      method: 'PUT',
    });
  } catch (error) {
    console.error('Error closing all upcoming sessions:', error);
    throw error;
  }
};

export const getLastActiveSessionDate = async (patientId: string): Promise<string | null> => {
  try {
    const response = await apiCall(`/api/patients/${patientId}/sessions/last-active`);
    return extractData(response, 'lastActiveDate') || null;
  } catch (error) {
    console.error('Error getting last active session date:', error);
    return null;
  }
};

export const getPatientsWithActiveSessions = async (patientIds: string[]): Promise<string[]> => {
  try {
    const response = await apiCall('/api/patients/active-sessions', {
      method: 'POST',
      body: JSON.stringify({ patientIds }),
    });
    return extractData(response, 'activePatientIds') || [];
  } catch (error) {
    console.error('Error getting patients with active sessions:', error);
    return [];
  }
};

export const getMonthlyEarnings = async (): Promise<any[]> => {
  try {
    const response = await apiCall('/api/earnings/monthly');
    console.log('Monthly earnings response:', response);
    const monthlyEarnings = extractData(response, 'monthlyEarnings') || [];
    console.log('Extracted monthly earnings:', monthlyEarnings);
    return monthlyEarnings;
  } catch (error) {
    console.error('Error getting monthly earnings:', error);
    return [];
  }
};

export const getMonthlyEarningsDetail = async (year: number, month: string): Promise<any> => {
  try {
    const response = await apiCall(`/api/earnings/monthly/${year}/${month}`);
    console.log('Monthly earnings detail response:', response);
    
    // Extract data from response structure
    if (response.data) {
      return response.data;
    }
    
    // Fallback to direct response if no data wrapper
    return response;
  } catch (error) {
    console.error('Error getting monthly earnings detail:', error);
    throw error;
  }
};

// Session functions
export const saveSession = async (session: Omit<Session, 'id' | 'createdAt' | 'userId'>): Promise<Session> => {
  try {
    const response = await apiCall('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });

    return extractData(response, 'session');
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

export const saveMultipleSessions = async (sessions: Omit<Session, 'id' | 'createdAt' | 'userId'>[]): Promise<Session[]> => {
  try {
    const response = await apiCall('/api/sessions/bulk', {
      method: 'POST',
      body: JSON.stringify({ sessions }),
    });

    return extractData(response, 'sessions');
  } catch (error) {
    console.error('Error saving multiple sessions:', error);
    throw error;
  }
};

export const getSessions = async (): Promise<Session[]> => {
  try {
    const response = await apiCall('/api/sessions');
    return extractData(response, 'sessions');
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

export const getTodaySessions = async (): Promise<Session[]> => {
  try {
    const response = await apiCall('/api/sessions/today');
    return extractData(response, 'sessions') || [];
  } catch (error) {
    console.error('Error getting today sessions:', error);
    return [];
  }
};

export const getPastSessions = async (): Promise<Session[]> => {
  try {
    const response = await apiCall('/api/sessions/past?includeCancelled=true');
    return extractData(response, 'sessions');
  } catch (error) {
    console.error('Error getting past sessions:', error);
    return [];
  }
};

export const getUpcomingSessions = async (): Promise<Session[]> => {
  try {
    const response = await apiCall('/api/sessions/upcoming');
    return extractData(response, 'sessions');
  } catch (error) {
    console.error('Error getting upcoming sessions:', error);
    return [];
  }
};

export const getPatientSessions = async (patientId: string): Promise<Session[]> => {
  try {
    const response = await apiCall(`/api/sessions/patient/${patientId}`);
    return extractData(response, 'sessions');
  } catch (error) {
    console.error('Error getting patient sessions:', error);
    return [];
  }
};

export const getFilteredSessions = async (filters: SessionFilter): Promise<Session[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.patientId) queryParams.append('patientId', filters.patientId);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.includeCancelled !== undefined) queryParams.append('includeCancelled', filters.includeCancelled.toString());
    
    const response = await apiCall(`/api/sessions?${queryParams.toString()}`);
    return extractData(response, 'sessions');
  } catch (error) {
    console.error('Error getting filtered sessions:', error);
    return [];
  }
};

export const getSessionById = async (id: string): Promise<Session | null> => {
  try {
    const response = await apiCall(`/api/sessions/${id}`);
    return extractData(response, 'session');
  } catch (error) {
    console.error('Error getting session by ID:', error);
    return null;
  }
};

export const updateSession = async (updatedSession: Session): Promise<void> => {
  try {
    await apiCall(`/api/sessions/${updatedSession.id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedSession),
    });
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  try {
    await apiCall(`/api/sessions/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

// Placeholder for getCurrentUser - this should use the new auth system
export const getCurrentUser = async () => {
  // This function is now handled by mongoAuth.ts
  // Keeping it here for compatibility but it should not be used
  console.warn('getCurrentUser from mongoStorage is deprecated. Use mongoAuth instead.');
  return null;
};
