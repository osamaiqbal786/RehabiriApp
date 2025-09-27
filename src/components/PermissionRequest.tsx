import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

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
    if (Platform.OS !== 'android') return;

    try {
      const androidVersion = typeof Platform.Version === 'string' ? parseInt(Platform.Version) : Platform.Version;
      
      // Request notification permission for Android 13+
      if (androidVersion >= 33) {
        const notificationPermission = await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS',
          {
            title: 'Notification Permission',
            message: 'App needs permission to send you session reminders and updates',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        console.log('Notification permission result:', notificationPermission);
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  return null; // This component doesn't render anything
}
