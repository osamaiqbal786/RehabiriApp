import { Patient, Session } from '../../types';

// Cache duration constants (in milliseconds)
export const CACHE_DURATION = {
  PATIENTS: 5 * 60 * 1000, // 5 minutes
  SESSIONS: 2 * 60 * 1000, // 2 minutes
};

// Check if data is stale
export function isDataStale(lastFetched: Date | null, cacheDuration: number): boolean {
  if (!lastFetched) return true;
  return Date.now() - lastFetched.getTime() > cacheDuration;
}

// Format timestamp for display
export function formatLastUpdated(timestamp: Date | null, currentTime?: Date): string {
  if (!timestamp) return 'Never';
  
  const now = currentTime || new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Check if we should refresh data based on cache age
export function shouldRefreshData(lastFetched: Date | null, cacheDuration: number): boolean {
  return isDataStale(lastFetched, cacheDuration);
}

// Utility to merge new data with existing data (for optimistic updates)
export function mergeSessionData(existing: Session[], newData: Session[]): Session[] {
  const merged = [...existing];
  
  newData.forEach(newSession => {
    const existingIndex = merged.findIndex(s => s.id === newSession.id);
    if (existingIndex >= 0) {
      // Update existing session
      merged[existingIndex] = newSession;
    } else {
      // Add new session
      merged.push(newSession);
    }
  });
  
  return merged;
}

// Utility to remove session from cache
export function removeSessionFromCache(sessions: Session[], sessionId: string): Session[] {
  return sessions.filter(session => session.id !== sessionId);
}

// Utility to update session in cache
export function updateSessionInCache(sessions: Session[], updatedSession: Session): Session[] {
  return sessions.map(session => 
    session.id === updatedSession.id ? updatedSession : session
  );
}
