import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Calendar, MapPin, Users, Clock } from 'lucide-react-native';
import { Event } from '../types';
import { formatEventDate, formatEventLocation, getCategoryDisplayName, getCategoryColor } from '../utils/eventApi';

interface EventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
}

export default function EventCard({ event, onPress }: EventCardProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    secondaryTextColor: isDarkMode ? '#8E8E93' : '#6D6D70',
    borderColor: isDarkMode ? '#444444' : '#E5E5E7',
    categoryColor: getCategoryColor(event.category),
  };

  const handlePress = () => {
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
      onPress={handlePress}
    >
      {/* Event Image */}
      {event.image?.url && (
        <Image 
          source={{ uri: event.image.url }} 
          style={styles.eventImage}
          resizeMode="cover"
        />
      )}
      
      {/* Event Content */}
      <View style={styles.content}>
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: theme.categoryColor }]}>
          <Text style={styles.categoryText}>
            {getCategoryDisplayName(event.category)}
          </Text>
        </View>

        {/* Event Title */}
        <Text style={[styles.title, { color: theme.textColor }]} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Event Description */}
        <Text style={[styles.description, { color: theme.secondaryTextColor }]} numberOfLines={2}>
          {event.shortDescription}
        </Text>

        {/* Event Details */}
        <View style={styles.details}>
          {/* Date & Time */}
          <View style={styles.detailRow}>
            <Calendar size={16} color={theme.secondaryTextColor} />
            <Text style={[styles.detailText, { color: theme.secondaryTextColor }]}>
              {formatEventDate(event.eventDate, event.eventTime)}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <MapPin size={16} color={theme.secondaryTextColor} />
            <Text style={[styles.detailText, { color: theme.secondaryTextColor }]}>
              {formatEventLocation(event.location)}
            </Text>
          </View>

          {/* Attendees */}
          {event.maxAttendees && (
            <View style={styles.detailRow}>
              <Users size={16} color={theme.secondaryTextColor} />
              <Text style={[styles.detailText, { color: theme.secondaryTextColor }]}>
                {event.currentAttendees}/{event.maxAttendees} attendees
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {event.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {event.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.borderColor }]}>
                <Text style={[styles.tagText, { color: theme.secondaryTextColor }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
  },
});
