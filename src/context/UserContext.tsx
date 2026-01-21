import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@spectrum_user_profile';

export interface UserProfile {
  name: string;
  email: string;
  profileImage: string;
  age?: number;
  location?: string;
  bio?: string;
  interests?: string[];
  communicationStyle?: string;
  goals?: string[];
}

interface UserContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  setProfileImage: (uri: string) => void;
  isLoaded: boolean;
}

const defaultUser: UserProfile = {
  name: '',
  email: '',
  profileImage: '',
  age: undefined,
  location: '',
  bio: '',
  interests: [],
  communicationStyle: '',
  goals: [],
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load user profile from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        if (__DEV__) console.log('Error loading user profile:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadUser();
  }, []);

  // Save user profile to storage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    const saveUser = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
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

  return (
    <UserContext.Provider value={{ user, updateUser, setProfileImage, isLoaded }}>
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
