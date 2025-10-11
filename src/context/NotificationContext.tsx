import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeFCM, setupFCMHandlers, getStoredFCMToken, refreshFCMToken, isFCMAvailable } from '../../utils/fcmService';

interface NotificationContextType {
  fcmToken: string | null;
  isFCMInitialized: boolean;
  notificationCount: number;
  refreshToken: () => Promise<void>;
  updateNotificationCount: (count: number) => void;
  initializeFCMForAuthenticatedUser: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isFCMInitialized, setIsFCMInitialized] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadNotificationCount = async () => {
      try {
        const count = await AsyncStorage.getItem('notificationCount');
        const newCount = count ? parseInt(count, 10) : 0;
        if (newCount !== notificationCount) { // Only update if changed
          setNotificationCount(newCount);
        }
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    };

    // Don't initialize FCM automatically - wait for user authentication
    loadNotificationCount();
    
    // Set up interval to check for notification count changes
    const interval = setInterval(loadNotificationCount, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [notificationCount]);

  const initializeFCMService = async (isUserAuthenticated: boolean = false) => {
    try {
      // Check if FCM is available
      if (!isFCMAvailable()) {
        console.log('❌ FCM not available on this device');
        setIsFCMInitialized(false);
        return;
      }

      // Initialize FCM only if user is authenticated
      const success = await initializeFCM(isUserAuthenticated);
      if (success) {
        // Setup message handlers
        setupFCMHandlers();
        
        // Get stored token
        const storedToken = await getStoredFCMToken();
        setFcmToken(storedToken);
        
        setIsFCMInitialized(true);
        console.log('✅ FCM initialized successfully');
      } else {
        console.log('❌ Failed to initialize FCM');
        setIsFCMInitialized(false);
      }
    } catch (error) {
      console.error('❌ Error initializing FCM service:', error);
      setIsFCMInitialized(false);
    }
  };

  const refreshToken = async () => {
    try {
      const newToken = await refreshFCMToken();
      if (newToken) {
        setFcmToken(newToken);
        console.log('✅ FCM token refreshed');
      }
    } catch (error) {
      console.error('❌ Error refreshing FCM token:', error);
    }
  };


  const updateNotificationCount = (count: number) => {
    setNotificationCount(count);
  };

  const initializeFCMForAuthenticatedUser = async () => {
    await initializeFCMService(true);
  };

  const value: NotificationContextType = {
    fcmToken,
    isFCMInitialized,
    notificationCount,
    refreshToken,
    updateNotificationCount,
    initializeFCMForAuthenticatedUser,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
