// Usage Tracking Service - Tracks moments for billing
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Moment costs
export const MOMENT_COSTS = {
  CHAT_RESPONSE: 1,        // 1 moment per AI response
  VOICE_PER_MINUTE: 100,   // 100 moments per minute of voice call
};

// Default free moments for new users
const DEFAULT_FREE_MOMENTS = 100;

export interface UsageEvent {
  event_type: 'chat_response' | 'voice_call';
  companion_id: string;
  moments_used: number;
  duration_seconds?: number;
  metadata?: Record<string, any>;
}

export interface UserSubscription {
  user_id: string;
  subscription_tier: 'free' | 'basic' | 'premium' | 'unlimited';
  moments_balance: number;
  moments_used_total: number;
  is_active: boolean;
}

// Get device ID for anonymous users
const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      await AsyncStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  } catch {
    return 'device_' + Date.now().toString(36);
  }
};

// Get current user ID
export const getCurrentUserId = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return user.id;
    }
  } catch (error) {
    console.log('No authenticated user, using device ID');
  }
  return getDeviceId();
};

// Get or create user subscription
export const getUserSubscription = async (): Promise<UserSubscription | null> => {
  try {
    const userId = await getCurrentUserId();

    // Try to get existing subscription
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.log('Error fetching subscription:', error.message);
      return getLocalSubscription(userId);
    }

    if (data) {
      // Sync to local
      await saveLocalSubscription(data);
      return data;
    }

    // Create new subscription for new user
    const newSubscription: UserSubscription = {
      user_id: userId,
      subscription_tier: 'free',
      moments_balance: DEFAULT_FREE_MOMENTS,
      moments_used_total: 0,
      is_active: true,
    };

    const { data: created, error: createError } = await supabase
      .from('user_subscriptions')
      .insert(newSubscription)
      .select()
      .single();

    if (createError) {
      console.log('Error creating subscription:', createError.message);
      await saveLocalSubscription(newSubscription);
      return newSubscription;
    }

    await saveLocalSubscription(created);
    return created;
  } catch (error) {
    console.log('Error in getUserSubscription:', error);
    const userId = await getCurrentUserId();
    return getLocalSubscription(userId);
  }
};

// Check if user has enough moments
export const hasEnoughMoments = async (momentsNeeded: number): Promise<boolean> => {
  const subscription = await getUserSubscription();
  if (!subscription) return false;

  // Unlimited tier has no limit
  if (subscription.subscription_tier === 'unlimited') return true;

  return subscription.moments_balance >= momentsNeeded;
};

// Get current moment balance
export const getMomentBalance = async (): Promise<number> => {
  const subscription = await getUserSubscription();
  return subscription?.moments_balance ?? 0;
};

// Track a chat response (1 moment)
export const trackChatResponse = async (companionId: string): Promise<{ success: boolean; balance: number; message: string }> => {
  const momentsToDeduct = MOMENT_COSTS.CHAT_RESPONSE;

  try {
    const userId = await getCurrentUserId();

    // Check balance first
    const hasBalance = await hasEnoughMoments(momentsToDeduct);
    if (!hasBalance) {
      const balance = await getMomentBalance();
      return { success: false, balance, message: 'Insufficient moments' };
    }

    // Log the usage event
    const { error: eventError } = await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        event_type: 'chat_response',
        companion_id: companionId,
        moments_used: momentsToDeduct,
      });

    if (eventError) {
      console.log('Error logging usage event:', eventError.message);
    }

    // Deduct moments using the database function
    const { data, error } = await supabase.rpc('deduct_moments', {
      p_user_id: userId,
      p_moments: momentsToDeduct,
    });

    if (error) {
      console.log('Error deducting moments:', error.message);
      // Fall back to local tracking
      return await deductLocalMoments(userId, momentsToDeduct);
    }

    const result = data?.[0] || { success: false, new_balance: 0, message: 'Unknown error' };

    // Update local cache
    if (result.success) {
      await updateLocalBalance(userId, result.new_balance);
    }

    return {
      success: result.success,
      balance: result.new_balance,
      message: result.message,
    };
  } catch (error) {
    console.log('Error in trackChatResponse:', error);
    const userId = await getCurrentUserId();
    return await deductLocalMoments(userId, momentsToDeduct);
  }
};

// Track a voice call (100 moments per minute)
export const trackVoiceCall = async (
  companionId: string,
  durationSeconds: number
): Promise<{ success: boolean; balance: number; message: string; momentsUsed: number }> => {
  // Calculate moments: 100 per minute, rounded up
  const minutes = Math.ceil(durationSeconds / 60);
  const momentsToDeduct = minutes * MOMENT_COSTS.VOICE_PER_MINUTE;

  try {
    const userId = await getCurrentUserId();

    // Check balance first
    const hasBalance = await hasEnoughMoments(momentsToDeduct);
    if (!hasBalance) {
      const balance = await getMomentBalance();
      return { success: false, balance, message: 'Insufficient moments', momentsUsed: 0 };
    }

    // Log the usage event
    const { error: eventError } = await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        event_type: 'voice_call',
        companion_id: companionId,
        moments_used: momentsToDeduct,
        duration_seconds: durationSeconds,
        metadata: { minutes },
      });

    if (eventError) {
      console.log('Error logging voice usage event:', eventError.message);
    }

    // Deduct moments
    const { data, error } = await supabase.rpc('deduct_moments', {
      p_user_id: userId,
      p_moments: momentsToDeduct,
    });

    if (error) {
      console.log('Error deducting voice moments:', error.message);
      const localResult = await deductLocalMoments(userId, momentsToDeduct);
      return { ...localResult, momentsUsed: momentsToDeduct };
    }

    const result = data?.[0] || { success: false, new_balance: 0, message: 'Unknown error' };

    // Update local cache
    if (result.success) {
      await updateLocalBalance(userId, result.new_balance);
    }

    return {
      success: result.success,
      balance: result.new_balance,
      message: result.message,
      momentsUsed: momentsToDeduct,
    };
  } catch (error) {
    console.log('Error in trackVoiceCall:', error);
    const userId = await getCurrentUserId();
    const localResult = await deductLocalMoments(userId, momentsToDeduct);
    return { ...localResult, momentsUsed: momentsToDeduct };
  }
};

// Get usage history
export const getUsageHistory = async (limit: number = 50): Promise<UsageEvent[]> => {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('usage_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.log('Error fetching usage history:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.log('Error in getUsageHistory:', error);
    return [];
  }
};

// Get usage summary for current month
export const getMonthlyUsage = async (): Promise<{ chatMoments: number; voiceMoments: number; total: number }> => {
  try {
    const userId = await getCurrentUserId();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('usage_events')
      .select('event_type, moments_used')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.log('Error fetching monthly usage:', error.message);
      return { chatMoments: 0, voiceMoments: 0, total: 0 };
    }

    let chatMoments = 0;
    let voiceMoments = 0;

    (data || []).forEach((event: { event_type: string; moments_used: number }) => {
      if (event.event_type === 'chat_response') {
        chatMoments += event.moments_used;
      } else if (event.event_type === 'voice_call') {
        voiceMoments += event.moments_used;
      }
    });

    return { chatMoments, voiceMoments, total: chatMoments + voiceMoments };
  } catch (error) {
    console.log('Error in getMonthlyUsage:', error);
    return { chatMoments: 0, voiceMoments: 0, total: 0 };
  }
};

// ============ Local Storage Fallback ============

const LOCAL_SUBSCRIPTION_KEY = 'user_subscription';

const getLocalSubscription = async (userId: string): Promise<UserSubscription> => {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_SUBSCRIPTION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.log('Error loading local subscription:', error);
  }

  // Return default
  return {
    user_id: userId,
    subscription_tier: 'free',
    moments_balance: DEFAULT_FREE_MOMENTS,
    moments_used_total: 0,
    is_active: true,
  };
};

const saveLocalSubscription = async (subscription: UserSubscription): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCAL_SUBSCRIPTION_KEY, JSON.stringify(subscription));
  } catch (error) {
    console.log('Error saving local subscription:', error);
  }
};

const updateLocalBalance = async (userId: string, newBalance: number): Promise<void> => {
  try {
    const subscription = await getLocalSubscription(userId);
    subscription.moments_balance = newBalance;
    await saveLocalSubscription(subscription);
  } catch (error) {
    console.log('Error updating local balance:', error);
  }
};

const deductLocalMoments = async (
  userId: string,
  moments: number
): Promise<{ success: boolean; balance: number; message: string }> => {
  try {
    const subscription = await getLocalSubscription(userId);

    if (subscription.moments_balance < moments) {
      return { success: false, balance: subscription.moments_balance, message: 'Insufficient moments' };
    }

    subscription.moments_balance -= moments;
    subscription.moments_used_total += moments;
    await saveLocalSubscription(subscription);

    return { success: true, balance: subscription.moments_balance, message: 'Success' };
  } catch (error) {
    console.log('Error deducting local moments:', error);
    return { success: false, balance: 0, message: 'Error deducting moments' };
  }
};

export default {
  MOMENT_COSTS,
  getCurrentUserId,
  getUserSubscription,
  hasEnoughMoments,
  getMomentBalance,
  trackChatResponse,
  trackVoiceCall,
  getUsageHistory,
  getMonthlyUsage,
};
