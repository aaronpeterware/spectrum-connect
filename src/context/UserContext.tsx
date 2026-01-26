import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { getUserId } from '../services/profileService';
import { initMemoryDatabase } from '../services/memoryService';

const STORAGE_KEY = '@haven_user_profile';
const UNREAD_COUNT_KEY = '@haven_unread_messages';
const UNREAD_MATCHES_KEY = '@haven_unread_matches';
const ONBOARDING_KEY = '@haven_onboarding_completed';

export interface UserProfile {
  name: string;
  email: string;
  profileImage: string;
  profilePhotos?: string[];
  age?: number;
  location?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  seeking?: ('male' | 'female' | 'non-binary')[];
  interests?: string[];
  communicationStyle?: string;
  communicationPreferences?: string;
  goals?: string[];
  favoriteCompanions?: string[];
  onboardingCompleted?: boolean;
}

interface UserContextType {
  user: UserProfile;
  userId: string;
  updateUser: (updates: Partial<UserProfile>) => void;
  setProfileImage: (uri: string) => void;
  isLoaded: boolean;
  toggleFavoriteCompanion: (companionId: string) => void;
  isFavoriteCompanion: (companionId: string) => boolean;
  // Unread messages
  unreadCount: number;
  incrementUnread: () => void;
  clearUnread: () => void;
  // Unread matches
  unreadMatches: number;
  incrementUnreadMatches: () => void;
  clearUnreadMatches: () => void;
  // Onboarding
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
}

const defaultUser: UserProfile = {
  name: '',
  email: '',
  profileImage: '',
  profilePhotos: [],
  age: undefined,
  location: '',
  bio: '',
  gender: undefined,
  seeking: [],
  interests: [],
  communicationStyle: '',
  communicationPreferences: '',
  goals: [],
  favoriteCompanions: [],
  onboardingCompleted: false,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [userId, setUserId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMatches, setUnreadMatches] = useState(0);
  const [onboardingCompleted, setOnboardingCompletedState] = useState(false);

  // Load user profile and unread counts from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize memory database for companion conversations
        await initMemoryDatabase();
        console.log('[UserContext] Memory database initialized');

        const fetchedUserId = await getUserId();
        setUserId(fetchedUserId);

        // Try to load from Supabase first
        const { data: supabaseProfile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', fetchedUserId)
          .single();

        if (supabaseProfile && !error) {
          const profilePhotos = supabaseProfile.profile_photos || [];
          const cloudUser: UserProfile = {
            name: supabaseProfile.name || '',
            email: supabaseProfile.email || '',
            profileImage: supabaseProfile.profile_image || profilePhotos[0] || '',
            profilePhotos: profilePhotos,
            age: supabaseProfile.age,
            location: supabaseProfile.location || '',
            bio: supabaseProfile.bio || '',
            gender: supabaseProfile.gender,
            seeking: supabaseProfile.seeking || [],
            interests: supabaseProfile.interests || [],
            communicationStyle: supabaseProfile.communication_style || '',
            communicationPreferences: supabaseProfile.communication_preferences || '',
            goals: supabaseProfile.goals || [],
            favoriteCompanions: supabaseProfile.favorite_companions || [],
            onboardingCompleted: supabaseProfile.onboarding_completed || false,
          };

          setUser(cloudUser);

          if (cloudUser.onboardingCompleted) {
            setOnboardingCompletedState(true);
          }

          // Cache locally
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cloudUser));
        } else {
          // Fall back to local storage
          const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            if (parsedUser.onboardingCompleted) {
              setOnboardingCompletedState(true);
            }
          }
        }

        // Load unread counts from local storage (these are device-specific)
        const [savedUnread, savedMatches, savedOnboarding] = await Promise.all([
          AsyncStorage.getItem(UNREAD_COUNT_KEY),
          AsyncStorage.getItem(UNREAD_MATCHES_KEY),
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);

        if (savedUnread) {
          setUnreadCount(parseInt(savedUnread, 10) || 0);
        }
        if (savedMatches) {
          setUnreadMatches(parseInt(savedMatches, 10) || 0);
        }
        if (savedOnboarding === 'true') {
          setOnboardingCompletedState(true);
        }
      } catch (error) {
        if (__DEV__) console.log('Error loading user profile:', error);

        // Fall back to local storage on error
        try {
          const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          }
        } catch (e) {
          console.log('Error loading local user cache:', e);
        }
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save user profile to storage and Supabase whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    const saveUser = async () => {
      try {
        // Save locally first (faster)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));

        // Sync to Supabase in background
        const userId = await getUserId();
        await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            name: user.name,
            email: user.email,
            profile_image: user.profileImage,
            profile_photos: user.profilePhotos,
            age: user.age,
            location: user.location,
            bio: user.bio,
            gender: user.gender,
            seeking: user.seeking,
            interests: user.interests,
            communication_style: user.communicationStyle,
            communication_preferences: user.communicationPreferences,
            goals: user.goals,
            favorite_companions: user.favoriteCompanions,
            onboarding_completed: user.onboardingCompleted,
            last_active: new Date().toISOString(),
          }, { onConflict: 'id' });
      } catch (error) {
        if (__DEV__) console.log('Error saving user profile:', error);
      }
    };
    saveUser();
  }, [user, isLoaded]);

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const setProfileImage = useCallback((uri: string) => {
    setUser(prev => ({ ...prev, profileImage: uri }));
  }, []);

  const toggleFavoriteCompanion = useCallback((companionId: string) => {
    setUser(prev => {
      const currentFavorites = prev.favoriteCompanions || [];
      const isFav = currentFavorites.includes(companionId);
      return {
        ...prev,
        favoriteCompanions: isFav
          ? currentFavorites.filter(id => id !== companionId)
          : [...currentFavorites, companionId],
      };
    });
  }, []);

  const isFavoriteCompanion = useCallback((companionId: string) => {
    return (user.favoriteCompanions || []).includes(companionId);
  }, [user.favoriteCompanions]);

  // Increment unread message count
  const incrementUnread = useCallback(async () => {
    setUnreadCount(prev => {
      const newCount = prev + 1;
      AsyncStorage.setItem(UNREAD_COUNT_KEY, newCount.toString());
      return newCount;
    });
  }, []);

  // Clear unread message count
  const clearUnread = useCallback(async () => {
    setUnreadCount(0);
    await AsyncStorage.setItem(UNREAD_COUNT_KEY, '0');
  }, []);

  // Increment unread matches count
  const incrementUnreadMatches = useCallback(async () => {
    setUnreadMatches(prev => {
      const newCount = prev + 1;
      AsyncStorage.setItem(UNREAD_MATCHES_KEY, newCount.toString());
      return newCount;
    });
  }, []);

  // Clear unread matches count
  const clearUnreadMatches = useCallback(async () => {
    setUnreadMatches(0);
    await AsyncStorage.setItem(UNREAD_MATCHES_KEY, '0');
  }, []);

  // Set onboarding completed
  const setOnboardingCompleted = useCallback(async (completed: boolean) => {
    setOnboardingCompletedState(completed);
    await AsyncStorage.setItem(ONBOARDING_KEY, completed.toString());
    setUser(prev => ({ ...prev, onboardingCompleted: completed }));
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      userId,
      updateUser,
      setProfileImage,
      isLoaded,
      toggleFavoriteCompanion,
      isFavoriteCompanion,
      unreadCount,
      incrementUnread,
      clearUnread,
      unreadMatches,
      incrementUnreadMatches,
      clearUnreadMatches,
      onboardingCompleted,
      setOnboardingCompleted,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
