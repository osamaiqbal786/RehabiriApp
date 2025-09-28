import { Session } from '../types';
import notifee, { AndroidImportance, AndroidVisibility, AuthorizationStatus, TriggerType } from '@notifee/react-native';
import { Platform } from 'react-native';

// Initialize Notifee and request permissions
const initializeNotifee = async (): Promise<boolean> => {
  try {
    // Request permission
    const settings = await notifee.requestPermission();

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting Notifee permission:', error);
    return false;
  }
};

// Create notification channel for Android
const createNotificationChannel = async (): Promise<string> => {
  if (Platform.OS === 'android') {
    try {
      const channelId = await notifee.createChannel({
        id: 'rehabiri-notifications',
        name: 'Rehabiri Notifications',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500],
        lights: true,
        lightColor: '#FF6B35',
      });

      console.log('✅ Notifee channel created:', channelId);
      return channelId || 'default';
    } catch (error) {
      console.error('❌ Error creating Notifee channel:', error);
      return 'default';
    }
  }
  return 'default';
};

// Schedule session notification using Notifee
export const scheduleSessionNotification = async (session: Session): Promise<string | null> => {
  try {
    
    // Initialize Notifee and get permissions
    const hasPermission = await initializeNotifee();
    if (!hasPermission) {
      console.log('❌ No Notifee permission, cannot schedule session notification');
      return null;
    }

    // Create notification channel
    const channelId = await createNotificationChannel();

    // Calculate notification time (30 minutes before session)
    const sessionDateTime = new Date(`${session.date}T${session.time}`);
    const notificationTime = new Date(sessionDateTime.getTime() - 30 * 60 * 1000); // 30 minutes before

    // Don't schedule if the notification time has already passed
    if (notificationTime <= new Date()) {
      
      // If session is still in the future but notification time has passed,
      // schedule for 1 minute from now instead
      if (sessionDateTime > new Date()) {
        const fallbackTime = new Date(Date.now() + 60 * 1000); // 1 minute from now
        
        const fallbackNotificationId = `session_${session.id}_fallback_${Date.now()}`;
        
        const fallbackTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: fallbackTime.getTime(),
        } as const;

        await notifee.createTriggerNotification(
          {
            id: fallbackNotificationId,
            title: 'Session Reminder',
            body: `You have a session with ${session.patientName} at ${session.time}`,
            android: {
              channelId,
              importance: AndroidImportance.HIGH,
              visibility: AndroidVisibility.PUBLIC,
              sound: 'default',
              smallIcon: 'ic_notification',
              largeIcon: 'ic_launcher',
            },
          },
          fallbackTrigger
        );

        console.log(`✅ Fallback session notification scheduled for ${session.patientName} at ${session.time}`);
        return fallbackNotificationId;
      }
      
      return null;
    }

    // Don't schedule if the session itself is in the past
    if (sessionDateTime <= new Date()) {
      console.log(`⏰ Session is in the past, not scheduling notification for ${session.patientName}`);
      return null;
    }

    const notificationId = `session_${session.id}_${Date.now()}`;

    // Create trigger for the notification
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: notificationTime.getTime(),
    } as const;

    // Schedule the notification
    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: 'Session Reminder',
        body: `You have a session with ${session.patientName} at ${session.time}`,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          sound: 'default',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
        },
      },
      trigger
    );

    console.log(`⏰ Notification will trigger at: ${notificationTime.toLocaleString()}`);
    
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling session notification:', error);
    return null;
  }
};

// Cancel session notification using Notifee
export const cancelSessionNotification = async (notificationId: string): Promise<void> => {
  try {
    console.log('🗑️ Cancelling session notification:', notificationId);
    await notifee.cancelNotification(notificationId);
  } catch (error) {
    console.error('❌ Error cancelling session notification:', error);
  }
};

// Cancel all notifications (for cleanup)
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    console.log('🗑️ Cancelling all notifications...');
    await notifee.cancelAllNotifications();
  } catch (error) {
    console.error('❌ Error cancelling all notifications:', error);
  }
};

// Check notification permissions
export const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const settings = await notifee.getNotificationSettings();

    if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
      return true;
    } else if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
      return false;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking notification permissions:', error);
    return false;
  }
};