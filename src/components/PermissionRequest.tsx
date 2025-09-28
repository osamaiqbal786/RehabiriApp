import { useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import PushNotification from 'react-native-push-notification';

interface PermissionRequestProps {
  delay?: number; // Optional delay in milliseconds
}

export default function PermissionRequest({ delay = 0 }: PermissionRequestProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      requestPermissions();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        // Android notification permission request
        const androidVersion = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
        
        if (androidVersion >= 33) {
          const notificationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'Rehabiri needs permission to send you session reminders and updates',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'Allow',
            }
          );
          
          if (notificationPermission === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('✅ Android notification permission granted');
          } else {
            console.log('❌ Android notification permission denied');
          }
        } else {
          console.log('✅ Android notifications available (API < 33)');
        }
      } else if (Platform.OS === 'ios') {
        // iOS notification permission request using react-native-push-notification
        try {
          // Configure push notifications for iOS
          PushNotification.configure({
            onRegister: function (token) {
              console.log('TOKEN:', token);
            },
            onNotification: function (notification) {
              console.log('NOTIFICATION:', notification);
            },
            permissions: {
              alert: true,
              badge: true,
              sound: true,
            },
            popInitialNotification: false,
            requestPermissions: true,
          });
          console.log('✅ iOS notification permission requested');
        } catch (error) {
          console.error('❌ iOS notification permission error:', error);
          Alert.alert(
            'Permission Required',
            'Please enable notifications in settings to receive session reminders.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  return null; // This component doesn't render anything
}
