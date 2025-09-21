import { useCallback, useEffect } from 'react';
import { useAppState } from './useAppState';
import { useAuth } from '../../utils/AuthContext';
import { 
  getCurrentUserPatients, 
  getTodaySessions, 
  getUpcomingSessions, 
  getPastSessions 
} from '../../utils/mongoStorage';

export function useDataRefresh() {
  const { user } = useAuth();
  const { 
    dispatch, 
    shouldRefreshPatients, 
    shouldRefreshSessions,
    patientsLastFetched,
    sessionsLastFetched 
  } = useAppState();

  // Fetch patients with retry logic
  const fetchPatients = useCallback(async (retryCount = 0) => {
    try {
      dispatch({ type: 'SET_PATIENTS_LOADING', payload: true });
      const patients = await getCurrentUserPatients();
      dispatch({ type: 'SET_PATIENTS_DATA', payload: patients });
    } catch (error) {
      console.error('Error fetching patients:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patients';
      dispatch({ type: 'SET_PATIENTS_ERROR', payload: errorMessage });
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          fetchPatients(retryCount + 1);
        }, delay);
      }
    }
  }, [dispatch]);

  // Fetch all sessions with retry logic
  const fetchSessions = useCallback(async (retryCount = 0) => {
    try {
      dispatch({ type: 'SET_SESSIONS_LOADING', payload: true });
      
      // Calculate user's local date (not UTC)
      const now = new Date();
      const userDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      
      // Fetch all session types in parallel
      const [todaySessions, upcomingSessions, pastSessions] = await Promise.all([
        getTodaySessions(userDate),
        getUpcomingSessions(userDate),
        getPastSessions(userDate) // Pass userDate for 90-day default range
      ]);
      
      dispatch({ 
        type: 'SET_SESSIONS_DATA', 
        payload: { 
          today: todaySessions, 
          upcoming: upcomingSessions, 
          past: pastSessions 
        } 
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sessions';
      dispatch({ type: 'SET_SESSIONS_ERROR', payload: errorMessage });
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          fetchSessions(retryCount + 1);
        }, delay);
      }
    }
  }, [dispatch]);

  // Manual refresh functions with better error handling
  const refreshPatients = useCallback(async () => {
    try {
      dispatch({ type: 'SET_PATIENTS_LOADING', payload: true });
      dispatch({ type: 'SET_REFRESH_FAILED', payload: { patients: false } }); // Clear previous failure
      const patients = await getCurrentUserPatients();
      dispatch({ type: 'SET_PATIENTS_DATA', payload: patients });
    } catch (error) {
      console.error('Error refreshing patients:', error);
      // Don't set error state for refresh failures - preserve existing data
      // Just stop loading state and mark refresh as failed
      dispatch({ type: 'SET_PATIENTS_LOADING', payload: false });
      dispatch({ type: 'SET_REFRESH_FAILED', payload: { patients: true } });
    }
  }, [dispatch]);

  const refreshSessions = useCallback(async () => {
    try {
      dispatch({ type: 'SET_SESSIONS_LOADING', payload: true });
      dispatch({ type: 'SET_REFRESH_FAILED', payload: { sessions: false } }); // Clear previous failure
      
      // Calculate user's local date (not UTC)
      const now = new Date();
      const userDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      
      // Fetch all session types in parallel
      const [todaySessions, upcomingSessions, pastSessions] = await Promise.all([
        getTodaySessions(userDate),
        getUpcomingSessions(userDate),
        getPastSessions(userDate) // Pass userDate for 90-day default range
      ]);
      
      dispatch({ 
        type: 'SET_SESSIONS_DATA', 
        payload: { 
          today: todaySessions, 
          upcoming: upcomingSessions, 
          past: pastSessions 
        } 
      });
    } catch (error) {
      console.error('Error refreshing sessions:', error);
      // Don't set error state for refresh failures - preserve existing data
      // Just stop loading state and mark refresh as failed
      dispatch({ type: 'SET_SESSIONS_LOADING', payload: false });
      dispatch({ type: 'SET_REFRESH_FAILED', payload: { sessions: true } });
    }
  }, [dispatch]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshPatients(), refreshSessions()]);
  }, [refreshPatients, refreshSessions]);

  // Clear errors
  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, [dispatch]);

  // Auto-fetch when refresh triggers are set - only if user is authenticated
  useEffect(() => {
    if (user && shouldRefreshPatients) {
      fetchPatients();
    }
  }, [user, shouldRefreshPatients, fetchPatients]);

  useEffect(() => {
    if (user && shouldRefreshSessions) {
      fetchSessions();
    }
  }, [user, shouldRefreshSessions, fetchSessions]);

  // Initial data load - only if user is authenticated
  useEffect(() => {
    if (user && !patientsLastFetched) {
      fetchPatients();
    }
    if (user && !sessionsLastFetched) {
      fetchSessions();
    }
  }, [user, patientsLastFetched, sessionsLastFetched, fetchPatients, fetchSessions]);

  return {
    fetchPatients,
    fetchSessions,
    refreshPatients,
    refreshSessions,
    refreshAll,
    clearErrors,
  };
}
