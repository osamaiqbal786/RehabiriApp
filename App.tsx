/**
 * Rehabiri - Physiotherapy App
 * React Native CLI Version
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './utils/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { navigate } from './utils/navigationService';
import { setupFCMHandlers } from './utils/fcmService';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // Setup FCM handlers globally (for notification clicks)
  useEffect(() => {
    setupFCMHandlers();
  }, []);

  // Global navigation handler for notifications (fallback)
  useEffect(() => {
    const checkForPendingEventNavigation = async () => {
      try {
        const pendingEventId = await AsyncStorage.getItem('pendingEventId');
        
        if (pendingEventId) {
          // Clear the pending event ID FIRST to prevent duplicate navigation
          await AsyncStorage.removeItem('pendingEventId');
          
          // Wait a bit for navigation to be ready, then navigate
          setTimeout(() => {
            navigate('EventDetail', { eventId: pendingEventId });
          }, 1000);
        }
      } catch (error) {
        console.error('Error in global navigation handler:', error);
      }
    };

    // Check for pending navigation after a longer delay (for cold start)
    const timer = setTimeout(checkForPendingEventNavigation, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <NotificationProvider>
          <SafeAreaProvider>
            <StatusBar 
              barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
              backgroundColor={isDarkMode ? '#000' : '#fff'}
            />
            <AppNavigator />
          </SafeAreaProvider>
        </NotificationProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
