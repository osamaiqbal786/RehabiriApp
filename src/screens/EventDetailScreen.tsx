import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MapPin, Calendar, Users } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import { Event } from '../../types';
import { getEventById } from '../../utils/eventApi';
import { formatEventDate, formatEventTime, getCategoryColor } from '../../utils/eventApi';
import { useAuth } from '../../utils/AuthContext';

export default function EventDetailScreen() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const route = useRoute();
  const navigation = useNavigation();
  const { user, isLoading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    cardBackground: isDarkMode ? '#2A2A2A' : 'white',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    secondaryTextColor: isDarkMode ? '#8E8E93' : '#6D6D70',
    borderColor: isDarkMode ? '#444444' : '#E5E5E7',
    primaryColor: '#0A84FF',
    errorColor: '#FF453A',
  };

  const { eventId } = route.params as { eventId: string };


  const loadEvent = useCallback(async () => {
    // Don't load event if user is not authenticated
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const eventData = await getEventById(eventId);
      setEvent(eventData);
    } catch (err) {
      console.error('Error loading event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    // Only load event if user is authenticated and not loading
    if (!authLoading && user) {
      loadEvent();
    }
  }, [loadEvent, authLoading, user]);

  // Navigate to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigation.navigate('Login' as never);
    }
  }, [authLoading, user, navigation]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={[styles.loadingText, { color: theme.secondaryTextColor }]}>
          Loading event details...
        </Text>
      </View>
    );
  }

  if (error || !event) {
    const isAuthError = error?.includes('log in') || error?.includes('authentication');
    
    if (isAuthError) {
      // Navigate to login for authentication errors
      navigation.navigate('Login' as never);
      return null;
    }
    
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundColor }]}>
        <Text style={[styles.errorText, { color: theme.errorColor }]}>
          {error || 'Event not found'}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.primaryColor }]}
          onPress={loadEvent}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header */}
      <CustomHeader title="Event Details" showBackButton={true} hideProfileDropdown={true} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Image */}
        {event.image?.url && (
          <Image source={{ uri: event.image.url }} style={styles.eventImage} />
        )}

        {/* Event Content */}
        <View style={[styles.content, { backgroundColor: theme.cardBackground }]}>
          {/* Title and Category */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.textColor }]}>{event.title}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) }]}>
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: theme.textColor }]}>
            {event.description}
          </Text>

          {/* Event Details */}
          <View style={styles.detailsContainer}>
            {/* Date and Time */}
            <View style={styles.detailRow}>
              <Calendar size={20} color={theme.primaryColor} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: theme.secondaryTextColor }]}>Date & Time</Text>
                <Text style={[styles.detailValue, { color: theme.textColor }]}>
                  {formatEventDate(event.eventDate, event.eventTime)} at {formatEventTime(event.eventTime)}
                </Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.detailRow}>
              <MapPin size={20} color={theme.primaryColor} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: theme.secondaryTextColor }]}>Location</Text>
                <Text style={[styles.detailValue, { color: theme.textColor }]}>
                  {event.location.address ? `${event.location.address}, ` : ''}
                  {event.location.city}, {event.location.state} - {event.location.pincode}
                </Text>
              </View>
            </View>

            {/* Attendees */}
            {event.maxAttendees && event.maxAttendees > 0 && (
              <View style={styles.detailRow}>
                <Users size={20} color={theme.primaryColor} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.secondaryTextColor }]}>Attendees</Text>
                  <Text style={[styles.detailValue, { color: theme.textColor }]}>
                    {event.currentAttendees}/{event.maxAttendees} registered
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={[styles.tagsTitle, { color: theme.textColor }]}>Tags</Text>
              <View style={styles.tagsList}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { borderColor: theme.borderColor }]}>
                    <Text style={[styles.tagText, { color: theme.secondaryTextColor }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  eventImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
});
