import { useAppContext } from '../context/AppContext';

// Declare global for React Native
declare const global: any;

export function useAppState() {
  const { state, dispatch } = useAppContext();

  // Debug: Expose store to global object for console inspection (React Native)
  if (typeof global !== 'undefined') {
    global.__REHABIRI_STORE__ = {
      state,
      dispatch,
      // Helper functions
      getPatients: () => state.patients.data,
      getSessions: () => ({
        today: state.sessions.today,
        upcoming: state.sessions.upcoming,
        past: state.sessions.past,
      }),
      getLoadingStates: () => ({
        patients: state.patients.isLoading,
        sessions: state.sessions.isLoading,
        global: state.globalLoading,
      }),
      getErrors: () => ({
        patients: state.patients.error,
        sessions: state.sessions.error,
      }),
      getLastFetched: () => ({
        patients: state.patients.lastFetched,
        sessions: state.sessions.lastFetched,
      }),
    };
  }

  return {
    // Patients
    patients: state.patients.data,
    patientsLoading: state.patients.isLoading,
    patientsError: state.patients.error,
    patientsLastFetched: state.patients.lastFetched,
    
    // Sessions
    todaySessions: state.sessions.today,
    upcomingSessions: state.sessions.upcoming,
    pastSessions: state.sessions.past,
    sessionsLoading: state.sessions.isLoading,
    sessionsError: state.sessions.error,
    sessionsLastFetched: state.sessions.lastFetched,
    
    // Global state
    globalLoading: state.globalLoading,
    
    // Refresh triggers
    shouldRefreshPatients: state.refreshTriggers.patients,
    shouldRefreshSessions: state.refreshTriggers.sessions,
    
    // Actions
    dispatch,
  };
}
