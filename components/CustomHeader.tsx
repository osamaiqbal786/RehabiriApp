import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileDropdown from '../src/components/ProfileDropdown';
import BellIcon from './BellIcon';

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  hideProfileDropdown?: boolean;
  showBellIcon?: boolean;
}

export default function CustomHeader({ title, showBackButton = false, hideProfileDropdown = false, showBellIcon = false }: CustomHeaderProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const theme = {
    backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
  };

  // Calculate header padding based on safe area insets
  const headerPaddingTop = Platform.OS === 'ios' ? Math.max(insets.top, 20) : StatusBar.currentHeight || 0;

  return (
    <View 
      style={[
        styles.headerContainer, 
        { 
          backgroundColor: theme.backgroundColor,
          paddingTop: headerPaddingTop,
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                // Try to go back, if that fails, go to the main tabs
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('MainTabs' as never);
                }
              }}
            >
              <ArrowLeft size={20} color={theme.textColor} />
            </TouchableOpacity>
          )}
          {!hideProfileDropdown && <ProfileDropdown />}
        </View>
        <Text style={[styles.title, { color: theme.textColor }]}>{title}</Text>
        <View style={styles.rightContainer}>
          {showBellIcon && <BellIcon />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1001,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 900,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1001,
  },
}); 