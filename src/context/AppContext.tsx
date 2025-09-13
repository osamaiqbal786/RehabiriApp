import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { appReducer, AppState, AppAction } from './appReducer';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, {
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
    globalLoading: false,
  });

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
