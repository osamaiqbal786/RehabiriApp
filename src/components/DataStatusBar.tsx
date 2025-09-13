import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useAppState } from '../hooks/useAppState';
import { formatLastUpdated } from '../utils/cacheUtils';

interface DataStatusBarProps {
  onRefresh: () => void;
  dataType: 'patients' | 'sessions';
}

export default function DataStatusBar({ onRefresh, dataType }: DataStatusBarProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { 
    patientsLastFetched, 
    sessionsLastFetched, 
    patientsLoading, 
    sessionsLoading,
    patientsError,
    sessionsError
  } = useAppState();

  const theme = {
    backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F9FA',
    textColor: isDarkMode ? '#FFFFFF' : '#6C757D',
    borderColor: isDarkMode ? '#444444' : '#E9ECEF',
    errorColor: '#FF453A',
  };

  const lastFetched = dataType === 'patients' ? patientsLastFetched : sessionsLastFetched;
  const isLoading = dataType === 'patients' ? patientsLoading : sessionsLoading;
  const error = dataType === 'patients' ? patientsError : sessionsError;

  // Update current time every 30 seconds to refresh the "last updated" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
      <View style={styles.leftSection}>
        <Text style={[styles.statusText, { color: error ? theme.errorColor : theme.textColor }]}>
          {error ? `Error: ${error}` : `Last updated: ${formatLastUpdated(lastFetched, currentTime)}`}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.refreshButton, { opacity: isLoading ? 0.5 : 1 }]}
        onPress={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw 
          size={16} 
          color={theme.textColor} 
          style={isLoading ? styles.spinning : undefined}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  leftSection: {
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 4,
  },
  spinning: {
    // Add rotation animation here if needed
  },
});
