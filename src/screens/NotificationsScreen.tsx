import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, MapPin } from 'lucide-react-native';
import { Event } from '../../types';
import { getEventsByLocation, getUserLocation } from '../../utils/eventApi';
import EventCard from '../../components/EventCard';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ pincode: string; state: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { updateNotificationCount } = useNotifications();

  const clearNotificationCount = useCallback(async () => {
    try {
      await AsyncStorage.setItem('notificationCount', '0');
      updateNotificationCount(0);
    } catch (err) {
      console.error('Error clearing notification count:', err);
    }
  }, [updateNotificationCount]);
  const navigation = useNavigation();

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    cardBackground: isDarkMode ? '#2A2A2A' : 'white',
    secondaryTextColor: isDarkMode ? '#8E8E93' : '#6D6D70',
    borderColor: isDarkMode ? '#444444' : '#E5E5E7',
    primaryColor: '#0A84FF',
    errorColor: '#FF453A',
  };

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user location
      const location = await getUserLocation();
      setUserLocation(location);

      // Fetch events by location
      const response = await getEventsByLocation(location);
      
      // Access the events array correctly from the API response
      const eventsArray = (response as any).events?.events || [];
      setEvents(eventsArray);
    } catch (err) {
      console.error('Error loading events:', err);
      if (err instanceof Error && err.message.includes('authentication')) {
        setError('Please log in again to view events.');
      } else {
        setError('Failed to load events. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  // Clear notification count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      clearNotificationCount();
    }, [clearNotificationCount])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleEventPress = (event: Event) => {
    (navigation as any).navigate('EventDetail', { eventId: event.id });
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <EventCard event={item} onPress={handleEventPress} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={64} color={theme.secondaryTextColor} />
      <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
        No Events Found
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.secondaryTextColor }]}>
        {userLocation 
          ? `No events found for ${userLocation.pincode}, ${userLocation.state}`
          : 'No events found in your area'
        }
      </Text>
      {userLocation && userLocation.pincode === '400001' && (
        <Text style={[styles.emptyDescription, styles.locationHint, { color: theme.secondaryTextColor }]}>
          Update your profile with your location to see relevant events
        </Text>
      )}
      <TouchableOpacity 
        style={[styles.refreshButton, { backgroundColor: theme.primaryColor }]}
        onPress={handleRefresh}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorTitle, { color: theme.errorColor }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorDescription, { color: theme.secondaryTextColor }]}>
        {error}
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: theme.primaryColor }]}
        onPress={loadEvents}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.borderColor }]}>
      {userLocation && (
        <View style={styles.locationInfo}>
          <MapPin size={16} color={theme.secondaryTextColor} />
          <Text style={[styles.locationText, { color: theme.secondaryTextColor }]}>
            {userLocation.pincode}, {userLocation.state}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>
            Loading events...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {renderHeader()}
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {renderHeader()}
      
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primaryColor}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationHint: {
    fontSize: 14,
    marginTop: 8,
  },
});
