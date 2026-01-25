import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Animated, Easing } from 'react-native';
import { supabase } from '../config/supabase';
import { getUserId } from '../services/profileService';
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  areNotificationsEnabled,
  getNotificationPermissionStatus,
} from '../services/notificationService';

const SETTINGS_STORAGE_KEY = '@haven_user_settings';

export interface UserSettings {
  calmMode: boolean;
  hapticFeedback: boolean;
  notificationsEnabled: boolean;
  // Granular notification settings
  notificationsMessages: boolean;
  notificationsMatches: boolean;
  notificationsCommunity: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  textSize: 'small' | 'medium' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS: UserSettings = {
  calmMode: false,
  hapticFeedback: true,
  notificationsEnabled: true,
  notificationsMessages: true,
  notificationsMatches: true,
  notificationsCommunity: true,
  reducedMotion: false,
  highContrast: false,
  textSize: 'medium',
  theme: 'system',
};

interface SettingsContextType {
  settings: UserSettings;
  isLoaded: boolean;
  // Setting updaters
  setCalmMode: (enabled: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setNotificationsMessages: (enabled: boolean) => void;
  setNotificationsMatches: (enabled: boolean) => void;
  setNotificationsCommunity: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setTextSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  // Notification helpers
  requestNotificationPermission: () => Promise<boolean>;
  checkNotificationPermission: () => Promise<boolean>;
  // Haptic helpers
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') => void;
  // Animation helpers (respects calm mode)
  getAnimationDuration: (normalDuration: number) => number;
  getAnimationConfig: () => { duration: number; easing: typeof Easing.ease; useNativeDriver: boolean };
  // Color helpers (respects calm mode)
  getCalmModeColors: () => { primary: string; gradientStart: string; gradientEnd: string; accent: string };
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Calm mode color palette (more muted, less stimulating)
const CALM_COLORS = {
  primary: '#7B68EE', // Softer purple
  gradientStart: '#6B5B95', // Muted purple
  gradientEnd: '#8E7CC3', // Softer violet
  accent: '#9B8EC3', // Gentle lavender
};

const NORMAL_COLORS = {
  primary: '#8B5CF6',
  gradientStart: '#EC4899',
  gradientEnd: '#8B5CF6',
  accent: '#F472B6',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userId = await getUserId();

        // Try Supabase first
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (data && !error) {
          const cloudSettings: UserSettings = {
            calmMode: data.calm_mode ?? false,
            hapticFeedback: data.haptic_feedback ?? true,
            notificationsEnabled: data.notifications_enabled ?? true,
            notificationsMessages: data.notifications_messages ?? true,
            notificationsMatches: data.notifications_matches ?? true,
            notificationsCommunity: data.notifications_community ?? true,
            reducedMotion: data.reduced_motion ?? false,
            highContrast: data.high_contrast ?? false,
            textSize: data.text_size ?? 'medium',
            theme: data.theme ?? 'system',
          };
          setSettings(cloudSettings);
          // Cache locally
          await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cloudSettings));
        } else {
          // Fall back to local storage
          const cached = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
          if (cached) {
            setSettings(JSON.parse(cached));
          }
        }
      } catch (error) {
        console.log('Error loading settings:', error);
        // Try local cache
        try {
          const cached = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
          if (cached) {
            setSettings(JSON.parse(cached));
          }
        } catch (e) {
          console.log('Error loading local settings cache:', e);
        }
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    if (!isLoaded) return;

    const saveSettings = async () => {
      try {
        // Save locally first
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

        // Sync to Supabase
        const userId = await getUserId();
        await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            calm_mode: settings.calmMode,
            haptic_feedback: settings.hapticFeedback,
            notifications_enabled: settings.notificationsEnabled,
            notifications_messages: settings.notificationsMessages,
            notifications_matches: settings.notificationsMatches,
            notifications_community: settings.notificationsCommunity,
            reduced_motion: settings.reducedMotion,
            high_contrast: settings.highContrast,
            text_size: settings.textSize,
            theme: settings.theme,
          }, { onConflict: 'user_id' });
      } catch (error) {
        console.log('Error saving settings:', error);
      }
    };

    saveSettings();
  }, [settings, isLoaded]);

  // Update multiple settings at once
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Individual setters
  const setCalmMode = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, calmMode: enabled }));
    // Give haptic feedback when toggling (if haptics are enabled)
    if (settings.hapticFeedback) {
      Haptics.notificationAsync(
        enabled ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      );
    }
  }, [settings.hapticFeedback]);

  const setHapticFeedback = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, hapticFeedback: enabled }));
    // Give one last haptic when turning off
    if (!enabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // Request permission and register for notifications
      const token = await registerForPushNotifications();
      if (token) {
        await savePushToken(token);
        setSettings(prev => ({ ...prev, notificationsEnabled: true }));
      } else {
        // Permission denied or not available
        console.log('Could not enable notifications - permission denied or not available');
      }
    } else {
      // Remove push token when disabling
      await removePushToken();
      setSettings(prev => ({ ...prev, notificationsEnabled: false }));
    }
  }, []);

  const setNotificationsMessages = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, notificationsMessages: enabled }));
  }, []);

  const setNotificationsMatches = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, notificationsMatches: enabled }));
  }, []);

  const setNotificationsCommunity = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, notificationsCommunity: enabled }));
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, reducedMotion: enabled }));
  }, []);

  const setHighContrast = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, highContrast: enabled }));
  }, []);

  const setTextSize = useCallback((size: 'small' | 'medium' | 'large' | 'xlarge') => {
    setSettings(prev => ({ ...prev, textSize: size }));
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, theme: theme }));
  }, []);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light') => {
    if (!settings.hapticFeedback) return;

    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      // Haptics may not be available on all devices
      console.log('Haptics not available:', error);
    }
  }, [settings.hapticFeedback]);

  // Animation duration helper (respects calm mode and reduced motion)
  const getAnimationDuration = useCallback((normalDuration: number): number => {
    if (settings.reducedMotion) return 0;
    if (settings.calmMode) return normalDuration * 1.5; // Slower, gentler animations
    return normalDuration;
  }, [settings.calmMode, settings.reducedMotion]);

  // Animation config helper
  const getAnimationConfig = useCallback(() => {
    if (settings.reducedMotion) {
      return {
        duration: 0,
        easing: Easing.linear,
        useNativeDriver: true,
      };
    }
    if (settings.calmMode) {
      return {
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      };
    }
    return {
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    };
  }, [settings.calmMode, settings.reducedMotion]);

  // Color helper (respects calm mode)
  const getCalmModeColors = useCallback(() => {
    return settings.calmMode ? CALM_COLORS : NORMAL_COLORS;
  }, [settings.calmMode]);

  // Notification permission helpers
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    const token = await registerForPushNotifications();
    if (token) {
      await savePushToken(token);
      setSettings(prev => ({ ...prev, notificationsEnabled: true }));
      return true;
    }
    return false;
  }, []);

  const checkNotificationPermission = useCallback(async (): Promise<boolean> => {
    return await areNotificationsEnabled();
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      isLoaded,
      setCalmMode,
      setHapticFeedback,
      setNotificationsEnabled,
      setNotificationsMessages,
      setNotificationsMatches,
      setNotificationsCommunity,
      setReducedMotion,
      setHighContrast,
      setTextSize,
      setTheme,
      updateSettings,
      requestNotificationPermission,
      checkNotificationPermission,
      triggerHaptic,
      getAnimationDuration,
      getAnimationConfig,
      getCalmModeColors,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Custom hook for haptic feedback (can be used without full context)
export function useHaptics() {
  const { triggerHaptic, settings } = useSettings();
  return {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
    selection: () => triggerHaptic('selection'),
    isEnabled: settings.hapticFeedback,
  };
}

// Custom hook for calm mode colors
export function useCalmModeColors() {
  const { getCalmModeColors, settings } = useSettings();
  return {
    colors: getCalmModeColors(),
    isCalmMode: settings.calmMode,
  };
}
