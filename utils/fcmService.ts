import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../src/config';
import { getAuthToken } from './eventApi';

// FCM Token storage key
const FCM_TOKEN_KEY = 'fcm_token';

/**
 * Initialize FCM and request permissions (only when user is authenticated)
 */
export const initializeFCM = async (isUserAuthenticated: boolean = false): Promise<boolean> => {
  // Don't initialize FCM if user is not authenticated
  if (!isUserAuthenticated) {
    console.log('ℹ️ FCM initialization skipped - user not authenticated');
    return false;
  }

  try {
    // Request permission for iOS
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('❌ FCM permission not granted');
        return false;
      }
    }

    // Get FCM token
    const token = await messaging().getToken();
    if (token) {
      await storeFCMToken(token);
      await sendTokenToServer(token);
      return true;
    } else {
      console.log('❌ Failed to get FCM token');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing FCM:', error);
    return false;
  }
};

/**
 * Store FCM token locally
 */
const storeFCMToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing FCM token:', error);
  }
};

/**
 * Get stored FCM token
 */
export const getStoredFCMToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Send FCM token to server
 */
const sendTokenToServer = async (token: string): Promise<void> => {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      console.log('⚠️ No auth token available, skipping FCM token send');
      return;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcmToken: token }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ FCM token sent to server successfully');
  } catch (error) {
    console.error('❌ Error sending FCM token to server:', error);
  }
};


/**
 * Handle notification navigation - directly navigate to event page
 */
export const handleNotificationNavigation = (remoteMessage: any) => {
  try {
    const data = remoteMessage.data;
    
    if (data?.eventId) {
      // Store the event ID for navigation
      AsyncStorage.setItem('pendingEventId', data.eventId);
      
      // Try immediate navigation first
      try {
        const { navigate } = require('./navigationService');
        navigate('EventDetail', { eventId: data.eventId });
        
        // Clear the event ID after successful navigation
        setTimeout(() => {
          AsyncStorage.removeItem('pendingEventId');
        }, 500);
      } catch (navError) {
        // If immediate navigation fails, try again after a short delay
        setTimeout(() => {
          try {
            const { navigate } = require('./navigationService');
            navigate('EventDetail', { eventId: data.eventId });
            
            // Clear the event ID after navigation
            setTimeout(() => {
              AsyncStorage.removeItem('pendingEventId');
            }, 500);
          } catch (retryError) {
            // Navigation will be handled by global handler
          }
        }, 500);
      }
    }
  } catch (error) {
    console.error('Error handling notification navigation:', error);
  }
};

/**
 * Setup FCM message handlers
 */
export const setupFCMHandlers = () => {
  // Handle background messages
  messaging().setBackgroundMessageHandler(async (_remoteMessage) => {
    // Background notification received - no action needed
  });

  // Handle foreground messages
  messaging().onMessage(async (remoteMessage) => {
    // When app is open, only update notification count for EVENT notifications
    // General notifications should not increment the bell icon counter
    if (remoteMessage.notification && remoteMessage.data?.type === 'event') {
      try {
        // Get current count and increment it
        const currentCount = await AsyncStorage.getItem('notificationCount') || '0';
        const newCount = parseInt(currentCount, 10) + 1;
        await AsyncStorage.setItem('notificationCount', newCount.toString());
        console.log('✅ Event notification count updated to:', newCount);
      } catch (error) {
        console.error('Error updating notification count:', error);
      }
    }
  });

  // Handle notification tap when app is in background/closed
  messaging().onNotificationOpenedApp((remoteMessage) => {
    handleNotificationNavigation(remoteMessage);
  });

  // Handle notification tap when app is completely closed
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        handleNotificationNavigation(remoteMessage);
      }
    });
};

/**
 * Refresh FCM token
 */
export const refreshFCMToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    if (token) {
      await storeFCMToken(token);
      await sendTokenToServer(token);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing FCM token:', error);
    return null;
  }
};

/**
 * Check if FCM is available
 */
export const isFCMAvailable = (): boolean => {
  return messaging().isDeviceRegisteredForRemoteMessages;
};

/**
 * Send FCM token to server (call this after login)
 */
export const sendFCMTokenToServer = async (): Promise<void> => {
  try {
    const token = await getStoredFCMToken();
    if (token) {
      await sendTokenToServer(token);
    }
  } catch (error) {
    console.error('Error sending FCM token after login:', error);
  }
};

/**
 * Unsubscribe from FCM
 */
export const unsubscribeFromFCM = async (): Promise<void> => {
  try {
    await messaging().deleteToken();
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    console.log('✅ FCM token deleted');
  } catch (error) {
    console.error('Error unsubscribing from FCM:', error);
  }
};
