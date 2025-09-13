import { Patient, Session } from '../../types';

export interface AppState {
  patients: {
    data: Patient[];
    lastFetched: Date | null;
    isLoading: boolean;
    error: string | null;
  };
  sessions: {
    today: Session[];
    upcoming: Session[];
    past: Session[];
    lastFetched: Date | null;
    isLoading: boolean;
    error: string | null;
  };
  refreshTriggers: {
    patients: boolean;
    sessions: boolean;
  };
  refreshFailed: {
    patients: boolean;
    sessions: boolean;
  };
  globalLoading: boolean;
}

export type AppAction =
  | { type: 'SET_PATIENTS_LOADING'; payload: boolean }
  | { type: 'SET_PATIENTS_DATA'; payload: Patient[] }
  | { type: 'SET_PATIENTS_ERROR'; payload: string | null }
  | { type: 'SET_SESSIONS_LOADING'; payload: boolean }
  | { type: 'SET_SESSIONS_DATA'; payload: { today: Session[]; upcoming: Session[]; past: Session[] } }
  | { type: 'SET_SESSIONS_ERROR'; payload: string | null }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'TRIGGER_PATIENTS_REFRESH' }
  | { type: 'TRIGGER_SESSIONS_REFRESH' }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'SET_REFRESH_FAILED'; payload: { patients?: boolean; sessions?: boolean } };

const initialState: AppState = {
  patients: {
    data: [],
    lastFetched: null,
    isLoading: false,
    error: null,
  },
  sessions: {
    today: [],
    upcoming: [],
    past: [],
    lastFetched: null,
    isLoading: false,
    error: null,
  },
  refreshTriggers: {
    patients: false,
    sessions: false,
  },
  refreshFailed: {
    patients: false,
    sessions: false,
  },
  globalLoading: false,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PATIENTS_LOADING':
      return {
        ...state,
        patients: {
          ...state.patients,
          isLoading: action.payload,
        },
      };

    case 'SET_PATIENTS_DATA':
      return {
        ...state,
        patients: {
          ...state.patients,
          data: action.payload,
          lastFetched: new Date(),
          isLoading: false,
          error: null,
        },
        refreshTriggers: {
          ...state.refreshTriggers,
          patients: false,
        },
      };

    case 'SET_PATIENTS_ERROR':
      return {
        ...state,
        patients: {
          ...state.patients,
          isLoading: false,
          error: action.payload,
        },
      };

    case 'SET_SESSIONS_LOADING':
      return {
        ...state,
        sessions: {
          ...state.sessions,
          isLoading: action.payload,
        },
      };

    case 'SET_SESSIONS_DATA':
      return {
        ...state,
        sessions: {
          ...state.sessions,
          today: action.payload.today,
          upcoming: action.payload.upcoming,
          past: action.payload.past,
          lastFetched: new Date(),
          isLoading: false,
          error: null,
        },
        refreshTriggers: {
          ...state.refreshTriggers,
          sessions: false,
        },
      };

    case 'SET_SESSIONS_ERROR':
      return {
        ...state,
        sessions: {
          ...state.sessions,
          isLoading: false,
          error: action.payload,
        },
      };

    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        globalLoading: action.payload,
      };

    case 'TRIGGER_PATIENTS_REFRESH':
      return {
        ...state,
        refreshTriggers: {
          ...state.refreshTriggers,
          patients: true,
        },
      };

    case 'TRIGGER_SESSIONS_REFRESH':
      return {
        ...state,
        refreshTriggers: {
          ...state.refreshTriggers,
          sessions: true,
        },
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        patients: {
          ...state.patients,
          error: null,
        },
        sessions: {
          ...state.sessions,
          error: null,
        },
      };

    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        refreshTriggers: {
          patients: false,
          sessions: false,
        },
      };

    case 'SET_REFRESH_FAILED':
      return {
        ...state,
        refreshFailed: {
          patients: action.payload.patients ?? state.refreshFailed?.patients ?? false,
          sessions: action.payload.sessions ?? state.refreshFailed?.sessions ?? false,
        },
      };

    default:
      return state;
  }
}
