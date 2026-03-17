// src/services/notifications.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'TranSync Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // Only fetch push token if projectId is available (not needed for local notifications)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId;

    if (!projectId) {
      // No projectId = running in Expo Go without EAS — skip remote push token
      // Local notifications (trip start/end, expiry alerts) still work fine
      console.log('[Notifications] No projectId found — remote push disabled, local notifications active.');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    // Swallow silently — local notifications still work without a push token
    console.log('[Notifications] Push token registration skipped:', e.message);
    return null;
  }
};

export const scheduleLocalNotification = async ({ title, body, trigger }) => {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: trigger || { seconds: 1 },
    });
  } catch (e) {
    console.log('[Notifications] scheduleLocalNotification error:', e.message);
  }
};

export const scheduleDateAlert = async ({ title, body, date }) => {
  try {
    const alertDate = new Date(date);
    alertDate.setDate(alertDate.getDate() - 7); // 7 days before expiry
    if (alertDate <= new Date()) return;
    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { date: alertDate },
    });
  } catch (e) {
    console.log('[Notifications] scheduleDateAlert error:', e.message);
  }
};

export const sendTripStartNotification = () =>
  scheduleLocalNotification({
    title: '🚚 Trip Started',
    body: 'Your trip has begun. Drive safely!',
  });

export const sendTripEndNotification = () =>
  scheduleLocalNotification({
    title: '✅ Trip Completed',
    body: 'Trip marked as completed. Great work!',
  });
