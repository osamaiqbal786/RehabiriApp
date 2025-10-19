import { Event, EventLocation } from '../types';
import { API_CONFIG } from '../src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall, getAuthHeaders } from './apiInterceptor';

/**
 * Get events by location
 */
export const getEventsByLocation = async (location: EventLocation, page: number = 1, limit: number = 10): Promise<{ events: Event[], pagination: any }> => {
  try {
    const authHeaders = await getAuthHeaders();
    const data = await apiCall(`/api/events/location?pincode=${location.pincode}&state=${location.state}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: authHeaders,
    });

    console.log('Events API response:', data);
    console.log('Events found:', data.data?.events?.events?.length || 0);
    return data.data;
  } catch (error) {
    console.error('Error fetching events by location:', error);
    throw error;
  }
};

/**
 * Get single event by ID
 */
export const getEventById = async (eventId: string): Promise<Event> => {
  try {
    const authHeaders = await getAuthHeaders();
    const data = await apiCall(`/api/events/${eventId}`, {
      method: 'GET',
      headers: authHeaders,
    });

    return data.data.event;
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    throw error;
  }
};

/**
 * Get user's location (pincode and state)
 * This gets the location from the user's profile
 */
export const getUserLocation = async (): Promise<EventLocation> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Profile API response:', data);
    
    // Check if the response has the expected structure
    if (!data || !data.user) {
      console.log('Invalid API response structure, using default location');
      return {
        pincode: '400001', // Mumbai
        state: 'Maharashtra'
      };
    }
    
    const user = data.user;
    
    if (!user.address || !user.address.pincode || !user.address.state) {
      // Return default location if user hasn't set their address
      console.log('User address not set, using default location');
      return {
        pincode: '400001', // Mumbai
        state: 'Maharashtra'
      };
    }

    return {
      pincode: user.address.pincode,
      state: user.address.state
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    // Return default location on error
    return {
      pincode: '400001', // Mumbai
      state: 'Maharashtra'
    };
  }
};

/**
 * Get auth token from storage
 */
export const getAuthToken = async (): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem('physio_jwt_token');
    if (!token) {
      throw new Error('No authentication token available');
    }
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('Failed to get authentication token');
  }
};

/**
 * Format event date for display
 */
export const formatEventDate = (eventDate: string, eventTime: string): string => {
  const date = new Date(eventDate);
  const time = eventTime;
  
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const formattedDate = date.toLocaleDateString('en-US', options);
  return `${formattedDate} at ${time}`;
};

/**
 * Format event location for display
 */
export const formatEventLocation = (location: Event['location']): string => {
  return `${location.city}, ${location.state}`;
};

/**
 * Format event time for display
 */
export const formatEventTime = (eventTime: string): string => {
  const [hour, minute] = eventTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get category display name
 */
export const getCategoryDisplayName = (category: Event['category']): string => {
  const categoryMap: Record<Event['category'], string> = {
    workshop: 'Workshop',
    seminar: 'Seminar',
    meetup: 'Meetup',
    conference: 'Conference',
    training: 'Training',
    other: 'Other'
  };
  
  return categoryMap[category] || 'Other';
};

/**
 * Get category color for display
 */
export const getCategoryColor = (category: Event['category']): string => {
  const colorMap: Record<Event['category'], string> = {
    workshop: '#007AFF',
    seminar: '#34C759',
    meetup: '#FF9500',
    conference: '#5856D6',
    training: '#FF3B30',
    other: '#8E8E93'
  };
  
  return colorMap[category] || '#8E8E93';
};
