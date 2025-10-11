import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useNotifications } from '../src/context/NotificationContext';

interface BellIconProps {
  onPress?: () => void;
}

export default function BellIcon({ onPress }: BellIconProps) {
  const { notificationCount, isFCMInitialized } = useNotifications();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    iconColor: isDarkMode ? '#FFFFFF' : '#000000',
    badgeColor: '#FF3B30',
    badgeTextColor: '#FFFFFF',
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to notifications screen
      (navigation as any).navigate('Notifications');
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Bell size={24} color={theme.iconColor} />
      {notificationCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.badgeColor }]}>
          <Text style={[styles.badgeText, { color: theme.badgeTextColor }]}>
            {notificationCount > 99 ? '99+' : notificationCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
