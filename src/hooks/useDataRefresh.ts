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
      
      // Fetch all session types in parallel
      const [todaySessions, upcomingSessions, pastSessions] = await Promise.all([
        getTodaySessions(),
        getUpcomingSessions(),
        getPastSessions()
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

  // Manual refresh functions
  const refreshPatients = useCallback(() => {
    dispatch({ type: 'TRIGGER_PATIENTS_REFRESH' });
  }, [dispatch]);

  const refreshSessions = useCallback(() => {
    dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
  }, [dispatch]);

  const refreshAll = useCallback(() => {
    dispatch({ type: 'TRIGGER_PATIENTS_REFRESH' });
    dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
  }, [dispatch]);

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
