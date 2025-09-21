import { Patient, Session } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../src/config';

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
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
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


export const getCurrentUserPatients = async (): Promise<Patient[]> => {
  try {
    const response = await apiCall('/api/patients');
    return extractData(response, 'patients') || [];
  } catch (error) {
    console.error('Error getting current user patients:', error);
    // Don't return empty array - let the error propagate to preserve existing data
    throw error;
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
    const monthlyEarnings = extractData(response, 'monthlyEarnings') || [];
    return monthlyEarnings;
  } catch (error) {
    console.error('Error getting monthly earnings:', error);
    // Don't return empty array - let the error propagate to preserve existing data
    throw error;
  }
};

export const getMonthlyEarningsDetail = async (year: number, month: string): Promise<any> => {
  try {
    const response = await apiCall(`/api/earnings/monthly/${year}/${month}`);
    
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


export const getTodaySessions = async (userDate?: string): Promise<Session[]> => {
  try {
    const endpoint = userDate ? `/api/sessions/today?date=${userDate}` : '/api/sessions/today';
    const response = await apiCall(endpoint);
    return extractData(response, 'sessions') || [];
  } catch (error) {
    console.error('Error getting today sessions:', error);
    // Don't return empty array - let the error propagate to preserve existing data
    throw error;
  }
};

export const getPastSessions = async (userDate?: string, startDate?: string, endDate?: string, includeCancelled: boolean = true): Promise<Session[]> => {
  try {
    let endpoint = '/api/sessions/past?includeCancelled=true';
    
    // Add parameters if provided
    if (userDate) {
      endpoint += `&date=${userDate}`;
    }
    if (startDate) {
      endpoint += `&startDate=${startDate}`;
    }
    if (endDate) {
      endpoint += `&endDate=${endDate}`;
    }
    if (!includeCancelled) {
      endpoint = endpoint.replace('includeCancelled=true', 'includeCancelled=false');
    }
    
    const response = await apiCall(endpoint);
    return extractData(response, 'sessions');
  } catch (error) {
    console.error('Error getting past sessions:', error);
    // Don't return empty array - let the error propagate to preserve existing data
    throw error;
  }
};

export const getUpcomingSessions = async (userDate?: string): Promise<Session[]> => {
  try {
    const endpoint = userDate ? `/api/sessions/upcoming?date=${userDate}` : '/api/sessions/upcoming';
    const response = await apiCall(endpoint);
    return extractData(response, 'sessions');
  } catch (error) {
    console.error('Error getting upcoming sessions:', error);
    // Don't return empty array - let the error propagate to preserve existing data
    throw error;
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

