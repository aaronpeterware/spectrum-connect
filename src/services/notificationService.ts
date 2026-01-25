// Notification Service - Push notification handling for Haven
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { API_CONFIG } from '../config/api';
import { getCurrentUserId } from './messageService';

// Check if we're in Expo Go (no native modules) or a development build
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy-loaded modules (only load in development builds)
let Notifications: any = null;
let Device: any = null;
let isNotificationsAvailable = false;

// Initialize native modules only if not in Expo Go
const initializeNativeModules = () => {
  // Always skip in Expo Go - no native modules available
  if (isExpoGo) {
    console.log('Push notifications disabled in Expo Go. Use a development build to enable.');
    return;
  }

  if (isNotificationsAvailable) return;

  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    isNotificationsAvailable = true;

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.log('Native notification modules not available');
    isNotificationsAvailable = false;
  }
};

// Types
export interface NotificationData {
  type: 'message' | 'match' | 'match_reply' | 'post_like' | 'post_comment' | 'follow';
  conversationId?: string;
  matchId?: string;
  postId?: string;
  userId?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: NotificationData;
}


// Navigation reference for deep linking
let navigationRef: any = null;

export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

/**
 * Request notification permissions and get Expo push token
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  // Initialize if not already done
  initializeNativeModules();

  // Skip if notifications not available (Expo Go)
  if (!Notifications || !isNotificationsAvailable || !Device) {
    console.log('Push notifications not available (running in Expo Go). Build a development build to enable.');
    return null;
  }

  try {
    // Check if we're on a physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || 'a7ef7c6f-2a67-4f45-83fe-de4844867461',
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });

      // Create specific channels for different notification types
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications for new messages',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });

      await Notifications.setNotificationChannelAsync('matches', {
        name: 'Matches',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications for new matches and connections',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EC4899',
      });

      await Notifications.setNotificationChannelAsync('community', {
        name: 'Community',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Notifications for community activity',
        vibrationPattern: [0, 250],
        lightColor: '#8B5CF6',
      });
    }

    console.log('Expo push token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Save push token to Supabase for the current user
 */
export const savePushToken = async (token: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    const deviceType = Platform.OS;

    // First try to save via API endpoint
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/api/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
          deviceType,
        }),
      });

      if (response.ok) {
        console.log('Push token saved via API');
        return true;
      }
    } catch (apiError) {
      console.log('API save failed, trying Supabase directly:', apiError);
    }

    // Fallback to direct Supabase insert
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          expo_push_token: token,
          device_type: deviceType,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,expo_push_token' }
      );

    if (error) {
      console.error('Error saving push token to Supabase:', error);
      return false;
    }

    console.log('Push token saved to Supabase');
    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
};

/**
 * Remove push token on logout
 */
export const removePushToken = async (token?: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();

    // Try to remove via API first
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/api/push-token`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
        }),
      });

      if (response.ok) {
        console.log('Push token removed via API');
        return true;
      }
    } catch (apiError) {
      console.log('API remove failed, trying Supabase directly:', apiError);
    }

    // Fallback to direct Supabase delete
    let query = supabase.from('push_tokens').delete().eq('user_id', userId);

    if (token) {
      query = query.eq('expo_push_token', token);
    }

    const { error } = await query;

    if (error) {
      console.error('Error removing push token:', error);
      return false;
    }

    console.log('Push token(s) removed');
    return true;
  } catch (error) {
    console.error('Error removing push token:', error);
    return false;
  }
};

/**
 * Handle notification response (when user taps notification)
 */
export const handleNotificationResponse = (response: any) => {
  if (!response) return;
  const data = response.notification?.request?.content?.data as unknown as NotificationData | undefined;

  if (!navigationRef || !data?.type) {
    console.log('No navigation ref or notification data');
    return;
  }

  // Navigate based on notification type
  switch (data.type) {
    case 'message':
      if (data.conversationId) {
        navigationRef.navigate('Chat', {
          conversationId: data.conversationId,
          name: 'Chat',
        });
      } else {
        navigationRef.navigate('MainTabs', { screen: 'Messages' });
      }
      break;

    case 'match':
    case 'match_reply':
      if (data.conversationId) {
        navigationRef.navigate('Chat', {
          conversationId: data.conversationId,
          name: 'Match',
        });
      } else {
        navigationRef.navigate('MainTabs', { screen: 'Matches' });
      }
      break;

    case 'post_like':
    case 'post_comment':
      if (data.postId) {
        navigationRef.navigate('PostDetail', { postId: data.postId });
      } else {
        navigationRef.navigate('MainTabs', { screen: 'Home' });
      }
      break;

    case 'follow':
      if (data.userId) {
        navigationRef.navigate('UserProfile', { userId: data.userId, name: 'User' });
      } else {
        navigationRef.navigate('MainTabs', { screen: 'Profile' });
      }
      break;

    default:
      navigationRef.navigate('MainTabs');
  }
};

/**
 * Set up notification listeners
 */
export const setupNotificationListeners = () => {
  // Initialize if not already done
  initializeNativeModules();

  // Skip if notifications not available (Expo Go)
  if (!Notifications || !isNotificationsAvailable) {
    console.log('Notification listeners not available (running in Expo Go)');
    return () => {}; // Return empty cleanup function
  }

  // Listener for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
  });

  // Listener for notification taps
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response:', response);
    handleNotificationResponse(response);
  });

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
};

/**
 * Get last notification response (for handling app opened via notification)
 */
export const getLastNotificationResponse = async (): Promise<any | null> => {
  initializeNativeModules();
  if (!Notifications || !isNotificationsAvailable) {
    return null;
  }
  return await Notifications.getLastNotificationResponseAsync();
};

/**
 * Send a push notification via the API
 */
export const sendPushNotification = async (
  recipientUserId: string,
  payload: PushNotificationPayload
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_CONFIG.API_URL}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientUserId,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send notification:', errorData);
      return false;
    }

    console.log('Notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

/**
 * Send a message notification
 */
export const sendMessageNotification = async (
  recipientUserId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<boolean> => {
  return sendPushNotification(recipientUserId, {
    title: senderName,
    body: messagePreview.length > 100 ? messagePreview.substring(0, 97) + '...' : messagePreview,
    data: {
      type: 'message',
      conversationId,
    },
  });
};

/**
 * Send a new match notification
 */
export const sendMatchNotification = async (
  recipientUserId: string,
  matcherName: string,
  conversationId?: string
): Promise<boolean> => {
  return sendPushNotification(recipientUserId, {
    title: 'New Connection!',
    body: `${matcherName} wants to connect with you`,
    data: {
      type: 'match',
      conversationId,
    },
  });
};

/**
 * Send a match reply notification
 */
export const sendMatchReplyNotification = async (
  recipientUserId: string,
  replierName: string,
  conversationId: string
): Promise<boolean> => {
  return sendPushNotification(recipientUserId, {
    title: replierName,
    body: 'Replied to your intro',
    data: {
      type: 'match_reply',
      conversationId,
    },
  });
};

/**
 * Send a post like notification
 */
export const sendPostLikeNotification = async (
  postAuthorId: string,
  likerName: string,
  postId: string
): Promise<boolean> => {
  return sendPushNotification(postAuthorId, {
    title: 'Community',
    body: `${likerName} liked your post`,
    data: {
      type: 'post_like',
      postId,
    },
  });
};

/**
 * Send a post comment notification
 */
export const sendPostCommentNotification = async (
  postAuthorId: string,
  commenterName: string,
  postId: string
): Promise<boolean> => {
  return sendPushNotification(postAuthorId, {
    title: 'Community',
    body: `${commenterName} commented on your post`,
    data: {
      type: 'post_comment',
      postId,
    },
  });
};

/**
 * Send a new follower notification
 */
export const sendFollowNotification = async (
  targetUserId: string,
  followerName: string,
  followerId: string
): Promise<boolean> => {
  return sendPushNotification(targetUserId, {
    title: 'New Follower',
    body: `${followerName} started following you`,
    data: {
      type: 'follow',
      userId: followerId,
    },
  });
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  initializeNativeModules();
  if (!Notifications || !isNotificationsAvailable) {
    return false;
  }
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
};

/**
 * Get current notification permissions status
 */
export const getNotificationPermissionStatus = async (): Promise<string> => {
  initializeNativeModules();
  if (!Notifications || !isNotificationsAvailable) {
    return 'unavailable';
  }
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

/**
 * Schedule a local notification (for testing or local reminders)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: NotificationData,
  triggerSeconds: number = 1
): Promise<string> => {
  initializeNativeModules();
  if (!Notifications || !isNotificationsAvailable) {
    console.log('Local notifications not available (running in Expo Go)');
    return '';
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as unknown as Record<string, unknown> | undefined,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
    },
  });
  return id;
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  initializeNativeModules();
  if (!Notifications || !isNotificationsAvailable) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  initializeNativeModules();
  if (!Notifications || !isNotificationsAvailable) return 0;
  return await Notifications.getBadgeCountAsync();
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  initializeNativeModules();
  if (!Notifications || !isNotificationsAvailable) return;
  await Notifications.setBadgeCountAsync(count);
};

/**
 * Clear badge
 */
export const clearBadge = async (): Promise<void> => {
  initializeNativeModules();
  if (!Notifications || !isNotificationsAvailable) return;
  await Notifications.setBadgeCountAsync(0);
};

export default {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  setupNotificationListeners,
  handleNotificationResponse,
  getLastNotificationResponse,
  setNavigationRef,
  sendPushNotification,
  sendMessageNotification,
  sendMatchNotification,
  sendMatchReplyNotification,
  sendPostLikeNotification,
  sendPostCommentNotification,
  sendFollowNotification,
  areNotificationsEnabled,
  getNotificationPermissionStatus,
  scheduleLocalNotification,
  cancelAllNotifications,
  getBadgeCount,
  setBadgeCount,
  clearBadge,
};
