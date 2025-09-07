/**
 * Rehabiri - Physiotherapy App
 * React Native CLI Version
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './utils/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={isDarkMode ? '#000' : '#fff'}
        />
        <AppNavigator />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

export default App;
