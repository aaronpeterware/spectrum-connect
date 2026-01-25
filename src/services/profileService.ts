import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAKE_PROFILES } from '../data/fakeProfiles';

const USER_ID_KEY = '@spectrum_user_id';
const PROFILE_KEY = '@spectrum_user_profile_data';

export interface UserProfileData {
  name: string;
  age: number | null;
  location: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | null;
  seeking: string[];
  goals: string[];
  profilePhotos: string[];
  bio?: string;
  interests?: string[];
  communicationStyle?: string;
  onboardingCompleted: boolean;
}

// Get or create a unique user ID
export const getUserId = async (): Promise<string> => {
  try {
    let userId = await AsyncStorage.getItem(USER_ID_KEY);
    if (!userId) {
      // Generate a unique ID based on device and timestamp
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    // Fallback to a generated ID
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Save user profile to Supabase
export const saveUserProfile = async (profileData: UserProfileData): Promise<void> => {
  try {
    const userId = await getUserId();

    const supabaseProfile = {
      id: userId,
      name: profileData.name,
      age: profileData.age,
      location: profileData.location,
      gender: profileData.gender,
      seeking: profileData.seeking,
      goals: profileData.goals,
      profile_photos: profileData.profilePhotos,
      bio: profileData.bio || '',
      interests: profileData.interests || [],
      communication_style: profileData.communicationStyle || '',
      onboarding_completed: profileData.onboardingCompleted,
      is_fake: false,
      last_active: new Date().toISOString(),
    };

    // Upsert to handle both new and existing profiles
    const { error } = await supabase
      .from('user_profiles')
      .upsert(supabaseProfile, { onConflict: 'id' });

    if (error) {
      console.error('Supabase error saving profile:', error);
      throw error;
    }

    // Also save locally for offline access
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));

    console.log('Profile saved successfully:', userId);
  } catch (error) {
    console.error('Error saving user profile:', error);
    // Still save locally even if Supabase fails
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
    throw error;
  }
};

// Get user profile from Supabase or local storage
export const getUserProfile = async (): Promise<UserProfileData | null> => {
  try {
    const userId = await getUserId();

    // Try Supabase first
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      return {
        name: data.name,
        age: data.age,
        location: data.location,
        gender: data.gender,
        seeking: data.seeking || [],
        goals: data.goals || [],
        profilePhotos: data.profile_photos || [],
        bio: data.bio,
        interests: data.interests || [],
        communicationStyle: data.communication_style,
        onboardingCompleted: data.onboarding_completed || false,
      };
    }

    // Fallback to local storage
    const localProfile = await AsyncStorage.getItem(PROFILE_KEY);
    if (localProfile) {
      return JSON.parse(localProfile);
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);

    // Try local storage as fallback
    try {
      const localProfile = await AsyncStorage.getItem(PROFILE_KEY);
      if (localProfile) {
        return JSON.parse(localProfile);
      }
    } catch (localError) {
      console.error('Error getting local profile:', localError);
    }

    return null;
  }
};

// Check if user has completed onboarding
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const profile = await getUserProfile();
    return profile?.onboardingCompleted || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

// Update user's last active timestamp
export const updateLastActive = async (): Promise<void> => {
  try {
    const userId = await getUserId();

    await supabase
      .from('user_profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    console.error('Error updating last active:', error);
  }
};

// Get a profile by ID
export const getProfileById = async (profileId: string): Promise<UserProfileData | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !data) {
      // Check if it's a fake profile
      const fakeProfile = FAKE_PROFILES.find(p => p.id === profileId);
      if (fakeProfile) {
        return {
          name: fakeProfile.name,
          age: fakeProfile.age,
          location: fakeProfile.location,
          gender: fakeProfile.gender,
          seeking: [],
          goals: fakeProfile.goals,
          profilePhotos: fakeProfile.profilePhotos,
          bio: fakeProfile.bio,
          interests: fakeProfile.interests,
          communicationStyle: fakeProfile.communicationStyle,
          onboardingCompleted: true,
        };
      }
      return null;
    }

    return {
      name: data.name,
      age: data.age,
      location: data.location,
      gender: data.gender,
      seeking: data.seeking || [],
      goals: data.goals || [],
      profilePhotos: data.profile_photos || [],
      bio: data.bio,
      interests: data.interests || [],
      communicationStyle: data.communication_style,
      onboardingCompleted: data.onboarding_completed || false,
    };
  } catch (error) {
    console.error('Error getting profile by ID:', error);
    return null;
  }
};

// Auto-match new user with fake profiles and real users
export const autoMatchNewUser = async (): Promise<void> => {
  try {
    const userId = await getUserId();
    const userProfile = await getUserProfile();

    if (!userProfile) {
      console.log('No user profile found for auto-matching');
      return;
    }

    // Get all fake profiles that match user's seeking preferences
    const matchingFakeProfiles = FAKE_PROFILES.filter(
      profile => userProfile.seeking.includes(profile.gender)
    );

    console.log(`Auto-matching with ${matchingFakeProfiles.length} fake profiles`);

    // Create matches with fake profiles
    for (const fakeProfile of matchingFakeProfiles) {
      await createMutualMatch(userId, fakeProfile.id);
    }

    // Also match with other real users
    const { data: realUsers, error } = await supabase
      .from('user_profiles')
      .select('id, gender')
      .eq('onboarding_completed', true)
      .eq('is_fake', false)
      .neq('id', userId);

    if (realUsers && !error) {
      const matchingRealUsers = realUsers.filter(
        user => userProfile.seeking.includes(user.gender)
      );

      console.log(`Auto-matching with ${matchingRealUsers.length} real users`);

      for (const realUser of matchingRealUsers) {
        await createMutualMatch(userId, realUser.id);
      }
    }

    console.log('Auto-matching completed');
  } catch (error) {
    console.error('Error in autoMatchNewUser:', error);
  }
};

// Create a mutual match and conversation between two users
export const createMutualMatch = async (user1Id: string, user2Id: string): Promise<string | null> => {
  try {
    // Order IDs consistently
    const [orderedUser1, orderedUser2] = [user1Id, user2Id].sort();

    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id, conversation_id')
      .eq('user_1_id', orderedUser1)
      .eq('user_2_id', orderedUser2)
      .single();

    if (existingMatch?.conversation_id) {
      return existingMatch.conversation_id;
    }

    // Create conversation first
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        participant_1_id: orderedUser1,
        participant_2_id: orderedUser2,
      })
      .select('id')
      .single();

    if (convError || !conversation) {
      // Conversation might already exist
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1_id', orderedUser1)
        .eq('participant_2_id', orderedUser2)
        .single();

      if (existingConv) {
        // Update match with existing conversation
        await supabase
          .from('matches')
          .upsert({
            user_1_id: orderedUser1,
            user_2_id: orderedUser2,
            user_1_liked: true,
            user_2_liked: true,
            is_mutual: true,
            matched_at: new Date().toISOString(),
            conversation_id: existingConv.id,
          }, { onConflict: 'user_1_id,user_2_id' });

        return existingConv.id;
      }
      throw convError || new Error('Failed to create conversation');
    }

    // Create or update match record
    await supabase
      .from('matches')
      .upsert({
        user_1_id: orderedUser1,
        user_2_id: orderedUser2,
        user_1_liked: true,
        user_2_liked: true,
        is_mutual: true,
        matched_at: new Date().toISOString(),
        conversation_id: conversation.id,
      }, { onConflict: 'user_1_id,user_2_id' });

    console.log(`Created match between ${orderedUser1} and ${orderedUser2}`);
    return conversation.id;
  } catch (error) {
    console.error('Error creating mutual match:', error);
    return null;
  }
};

// Delete user profile (for testing/account deletion)
export const deleteUserProfile = async (): Promise<void> => {
  try {
    const userId = await getUserId();

    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    await AsyncStorage.removeItem(PROFILE_KEY);
    await AsyncStorage.removeItem(USER_ID_KEY);

    console.log('User profile deleted');
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};

export default {
  getUserId,
  saveUserProfile,
  getUserProfile,
  hasCompletedOnboarding,
  updateLastActive,
  getProfileById,
  autoMatchNewUser,
  createMutualMatch,
  deleteUserProfile,
};
