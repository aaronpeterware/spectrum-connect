import { supabase } from '../config/supabase';
import { getUserId, getUserProfile, createMutualMatch } from './profileService';
import { FAKE_PROFILES, FakeProfile, getRandomResponse, generateContextualResponse } from '../data/fakeProfiles';
import { sendMatchNotification, sendMatchReplyNotification } from './notificationService';

export interface MatchProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  gender: string;
  interests: string[];
  profilePhotos: string[];
  isFake: boolean;
  goals?: string[];
  communicationStyle?: string;
}

// Safe match profile for the new non-dating focused matching system
export interface SafeMatchProfile {
  id: string;
  name: string;
  age: number;
  location?: string;
  bio?: string;
  interests: string[];
  profilePhotos: string[];
  isFake: boolean;
  goals?: string[];
  communicationStyle?: string;
  communicationPreferences?: string;
  isVerified?: boolean;
  sharedInterestCount?: number;
}

export interface Match {
  id: string;
  conversationId: string;
  profile: MatchProfile;
  matchedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface SwipeResult {
  liked: boolean;
  isMutualMatch: boolean;
  conversationId?: string;
  matchedProfile?: MatchProfile;
}

// Get potential matches for the discover/swipe screen
export const getPotentialMatches = async (limit: number = 20): Promise<MatchProfile[]> => {
  try {
    const userId = await getUserId();
    const userProfile = await getUserProfile();

    if (!userProfile || !userProfile.seeking || userProfile.seeking.length === 0) {
      return [];
    }

    // Get profiles already swiped on
    const { data: swipedProfiles } = await supabase
      .from('swipe_actions')
      .select('target_user_id')
      .eq('user_id', userId);

    const swipedIds = swipedProfiles?.map(s => s.target_user_id) || [];

    // Get matching fake profiles
    const matchingFakeProfiles: MatchProfile[] = FAKE_PROFILES
      .filter(profile =>
        userProfile.seeking.includes(profile.gender) &&
        !swipedIds.includes(profile.id)
      )
      .map(profile => ({
        id: profile.id,
        name: profile.name,
        age: profile.age,
        location: profile.location,
        bio: profile.bio,
        gender: profile.gender,
        interests: profile.interests,
        profilePhotos: profile.profilePhotos,
        isFake: true,
        goals: profile.goals,
        communicationStyle: profile.communicationStyle,
      }));

    // Get matching real profiles from Supabase
    const { data: realProfiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('onboarding_completed', true)
      .eq('is_fake', false)
      .neq('id', userId)
      .in('gender', userProfile.seeking)
      .limit(limit);

    const matchingRealProfiles: MatchProfile[] = (realProfiles || [])
      .filter(profile => !swipedIds.includes(profile.id))
      .map(profile => ({
        id: profile.id,
        name: profile.name,
        age: profile.age,
        location: profile.location,
        bio: profile.bio || '',
        gender: profile.gender,
        interests: profile.interests || [],
        profilePhotos: profile.profile_photos || [],
        isFake: false,
        goals: profile.goals || [],
        communicationStyle: profile.communication_style,
      }));

    // Combine and shuffle, but prioritize fake profiles for new users
    const allProfiles = [...matchingFakeProfiles, ...matchingRealProfiles];

    // Shuffle array
    for (let i = allProfiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allProfiles[i], allProfiles[j]] = [allProfiles[j], allProfiles[i]];
    }

    return allProfiles.slice(0, limit);
  } catch (error) {
    console.error('Error getting potential matches:', error);
    return [];
  }
};

// Record a swipe action (like or pass)
export const recordSwipeAction = async (
  targetUserId: string,
  liked: boolean
): Promise<SwipeResult> => {
  try {
    const userId = await getUserId();

    // Record the swipe action
    await supabase
      .from('swipe_actions')
      .upsert({
        user_id: userId,
        target_user_id: targetUserId,
        action: liked ? 'like' : 'pass',
      }, { onConflict: 'user_id,target_user_id' });

    if (!liked) {
      return { liked: false, isMutualMatch: false };
    }

    // Check if target user is a fake profile (auto-match with fakes)
    const fakeProfile = FAKE_PROFILES.find(p => p.id === targetUserId);
    if (fakeProfile) {
      // Auto-match with fake profiles
      const conversationId = await createMutualMatch(userId, targetUserId);
      return {
        liked: true,
        isMutualMatch: true,
        conversationId: conversationId || undefined,
        matchedProfile: {
          id: fakeProfile.id,
          name: fakeProfile.name,
          age: fakeProfile.age,
          location: fakeProfile.location,
          bio: fakeProfile.bio,
          gender: fakeProfile.gender,
          interests: fakeProfile.interests,
          profilePhotos: fakeProfile.profilePhotos,
          isFake: true,
        },
      };
    }

    // Check if real user has already liked us
    const { data: theirSwipe } = await supabase
      .from('swipe_actions')
      .select('action')
      .eq('user_id', targetUserId)
      .eq('target_user_id', userId)
      .eq('action', 'like')
      .single();

    if (theirSwipe) {
      // Mutual match!
      const conversationId = await createMutualMatch(userId, targetUserId);

      // Get their profile
      const { data: targetProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      // Get current user profile for notification
      const userProfile = await getUserProfile();

      // Send notification to the other user about the mutual match
      if (conversationId) {
        sendMatchNotification(targetUserId, userProfile?.name || 'Someone', conversationId);
      }

      return {
        liked: true,
        isMutualMatch: true,
        conversationId: conversationId || undefined,
        matchedProfile: targetProfile ? {
          id: targetProfile.id,
          name: targetProfile.name,
          age: targetProfile.age,
          location: targetProfile.location,
          bio: targetProfile.bio || '',
          gender: targetProfile.gender,
          interests: targetProfile.interests || [],
          profilePhotos: targetProfile.profile_photos || [],
          isFake: false,
        } : undefined,
      };
    }

    return { liked: true, isMutualMatch: false };
  } catch (error) {
    console.error('Error recording swipe action:', error);
    return { liked, isMutualMatch: false };
  }
};

// Get all mutual matches for the messages screen
export const getMutualMatches = async (): Promise<Match[]> => {
  try {
    const userId = await getUserId();

    // Get all conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error || !conversations) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    const matches: Match[] = [];

    for (const conv of conversations) {
      const otherUserId = conv.participant_1_id === userId
        ? conv.participant_2_id
        : conv.participant_1_id;

      // Check if it's a fake profile
      const fakeProfile = FAKE_PROFILES.find(p => p.id === otherUserId);

      let profile: MatchProfile;

      if (fakeProfile) {
        profile = {
          id: fakeProfile.id,
          name: fakeProfile.name,
          age: fakeProfile.age,
          location: fakeProfile.location,
          bio: fakeProfile.bio,
          gender: fakeProfile.gender,
          interests: fakeProfile.interests,
          profilePhotos: fakeProfile.profilePhotos,
          isFake: true,
          goals: fakeProfile.goals,
          communicationStyle: fakeProfile.communicationStyle,
        };
      } else {
        // Get real user profile
        const { data: realProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        if (!realProfile) continue;

        profile = {
          id: realProfile.id,
          name: realProfile.name,
          age: realProfile.age,
          location: realProfile.location,
          bio: realProfile.bio || '',
          gender: realProfile.gender,
          interests: realProfile.interests || [],
          profilePhotos: realProfile.profile_photos || [],
          isFake: false,
          goals: realProfile.goals || [],
          communicationStyle: realProfile.communication_style,
        };
      }

      // Get unread count for this conversation
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('recipient_id', userId)
        .eq('is_read', false);

      matches.push({
        id: conv.id,
        conversationId: conv.id,
        profile,
        matchedAt: conv.created_at,
        lastMessage: conv.last_message_text,
        lastMessageAt: conv.last_message_at,
        unreadCount: unreadCount || 0,
      });
    }

    return matches;
  } catch (error) {
    console.error('Error getting mutual matches:', error);
    return [];
  }
};

// Get a specific match/conversation
export const getMatch = async (conversationId: string): Promise<Match | null> => {
  try {
    const userId = await getUserId();

    const { data: conv, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error || !conv) {
      return null;
    }

    const otherUserId = conv.participant_1_id === userId
      ? conv.participant_2_id
      : conv.participant_1_id;

    // Check if it's a fake profile
    const fakeProfile = FAKE_PROFILES.find(p => p.id === otherUserId);

    let profile: MatchProfile;

    if (fakeProfile) {
      profile = {
        id: fakeProfile.id,
        name: fakeProfile.name,
        age: fakeProfile.age,
        location: fakeProfile.location,
        bio: fakeProfile.bio,
        gender: fakeProfile.gender,
        interests: fakeProfile.interests,
        profilePhotos: fakeProfile.profilePhotos,
        isFake: true,
        goals: fakeProfile.goals,
        communicationStyle: fakeProfile.communicationStyle,
      };
    } else {
      const { data: realProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

      if (!realProfile) return null;

      profile = {
        id: realProfile.id,
        name: realProfile.name,
        age: realProfile.age,
        location: realProfile.location,
        bio: realProfile.bio || '',
        gender: realProfile.gender,
        interests: realProfile.interests || [],
        profilePhotos: realProfile.profile_photos || [],
        isFake: false,
        goals: realProfile.goals || [],
        communicationStyle: realProfile.communication_style,
      };
    }

    return {
      id: conv.id,
      conversationId: conv.id,
      profile,
      matchedAt: conv.created_at,
      lastMessage: conv.last_message_text,
      lastMessageAt: conv.last_message_at,
      unreadCount: 0,
    };
  } catch (error) {
    console.error('Error getting match:', error);
    return null;
  }
};

// Simulate a fake user response (for fake profile chats)
export const simulateFakeUserResponse = async (
  fakeProfileId: string,
  userMessage: string,
  conversationId: string,
  conversationHistory?: { role: string; content: string }[]
): Promise<string> => {
  const fakeProfile = FAKE_PROFILES.find(p => p.id === fakeProfileId);

  if (!fakeProfile) {
    return "Hey! Nice to hear from you!";
  }

  // Add random delay between 2-5 seconds (feels more natural)
  const delay = Math.floor(Math.random() * 3000) + 2000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Generate contextual response using AI
  const response = await generateContextualResponse(fakeProfileId, userMessage, conversationHistory);

  return response;
};

// Calculate match compatibility percentage (for UI display)
export const calculateCompatibility = (
  userProfile: { interests?: string[]; goals?: string[] },
  matchProfile: MatchProfile
): number => {
  let score = 0;
  let maxScore = 0;

  // Interest overlap
  if (userProfile.interests && matchProfile.interests) {
    const userInterests = new Set(userProfile.interests.map(i => i.toLowerCase()));
    const matchInterests = matchProfile.interests.map(i => i.toLowerCase());

    maxScore += 50;
    const overlap = matchInterests.filter(i => userInterests.has(i)).length;
    score += Math.min(50, (overlap / Math.max(matchInterests.length, 1)) * 50);
  }

  // Goal overlap
  if (userProfile.goals && matchProfile.goals) {
    const userGoals = new Set(userProfile.goals);
    const matchGoals = matchProfile.goals || [];

    maxScore += 30;
    const overlap = matchGoals.filter(g => userGoals.has(g)).length;
    score += Math.min(30, (overlap / Math.max(matchGoals.length, 1)) * 30);
  }

  // Base compatibility for using the same app
  score += 20;
  maxScore += 20;

  return Math.round((score / maxScore) * 100);
};

// Subscribe to new matches (real-time)
export const subscribeToNewMatches = (
  onNewMatch: (match: Match) => void
): (() => void) => {
  let subscription: any = null;

  (async () => {
    const userId = await getUserId();

    subscription = supabase
      .channel('new-matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user_1_id=eq.${userId}`,
        },
        async (payload) => {
          const matchData = payload.new as any;
          if (matchData.is_mutual && matchData.conversation_id) {
            const match = await getMatch(matchData.conversation_id);
            if (match) {
              onNewMatch(match);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user_2_id=eq.${userId}`,
        },
        async (payload) => {
          const matchData = payload.new as any;
          if (matchData.is_mutual && matchData.conversation_id) {
            const match = await getMatch(matchData.conversation_id);
            if (match) {
              onNewMatch(match);
            }
          }
        }
      )
      .subscribe();
  })();

  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  };
};

// Get shared traits between user and a profile
export const getSharedTraits = (
  userProfile: { interests?: string[]; goals?: string[]; communicationStyle?: string },
  matchProfile: SafeMatchProfile
): string[] => {
  const sharedTraits: string[] = [];

  // Check for shared interests
  if (userProfile.interests && matchProfile.interests) {
    const userInterests = new Set(userProfile.interests.map(i => i.toLowerCase()));
    const sharedInterests = matchProfile.interests.filter(i =>
      userInterests.has(i.toLowerCase())
    );
    if (sharedInterests.length > 0) {
      sharedTraits.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`);
    }
  }

  // Check for shared goals
  if (userProfile.goals && matchProfile.goals) {
    const userGoals = new Set(userProfile.goals.map(g => g.toLowerCase()));
    const sharedGoals = matchProfile.goals.filter(g =>
      userGoals.has(g.toLowerCase())
    );
    if (sharedGoals.length > 0) {
      sharedTraits.push(`Similar goals`);
    }
  }

  // Check communication style compatibility
  if (userProfile.communicationStyle && matchProfile.communicationStyle) {
    if (userProfile.communicationStyle.toLowerCase() === matchProfile.communicationStyle.toLowerCase()) {
      sharedTraits.push(`${matchProfile.communicationStyle} communicator`);
    }
  }

  // Add default trait if no shared traits found
  if (sharedTraits.length === 0) {
    sharedTraits.push('New connection');
  }

  return sharedTraits;
};

// Get safe matches based on interests and compatibility (not gender-based)
export const getSafeMatches = async (limit: number = 20): Promise<SafeMatchProfile[]> => {
  try {
    const userId = await getUserId();
    const userProfile = await getUserProfile();

    // Get all fake profiles (not filtered by gender preference)
    const fakeProfilesAsSafe: SafeMatchProfile[] = FAKE_PROFILES.map(profile => {
      // Calculate shared interest count
      const userInterests = new Set((userProfile?.interests || []).map(i => i.toLowerCase()));
      const sharedCount = profile.interests.filter(i =>
        userInterests.has(i.toLowerCase())
      ).length;

      return {
        id: profile.id,
        name: profile.name,
        age: profile.age,
        location: profile.location,
        bio: profile.bio,
        interests: profile.interests,
        profilePhotos: profile.profilePhotos,
        isFake: true,
        goals: profile.goals,
        communicationStyle: profile.communicationStyle,
        communicationPreferences: profile.communicationPreferences ||
          'Open to text and voice communication. Appreciates clear and direct messages.',
        isVerified: true,
        sharedInterestCount: sharedCount,
      };
    });

    // Get real profiles from Supabase (not filtered by gender)
    // Deduplication happens after combining with fake profiles
    const { data: realProfiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('onboarding_completed', true)
      .neq('id', userId)
      .limit(limit);

    const realProfilesAsSafe: SafeMatchProfile[] = (realProfiles || []).map(profile => {
      const userInterests = new Set((userProfile?.interests || []).map(i => i.toLowerCase()));
      const profileInterests = profile.interests || [];
      const sharedCount = profileInterests.filter((i: string) =>
        userInterests.has(i.toLowerCase())
      ).length;

      return {
        id: profile.id,
        name: profile.name,
        age: profile.age,
        location: profile.location,
        bio: profile.bio || '',
        interests: profile.interests || [],
        profilePhotos: profile.profile_photos || [],
        isFake: false,
        goals: profile.goals || [],
        communicationStyle: profile.communication_style,
        communicationPreferences: profile.communication_preferences,
        isVerified: profile.is_verified || false,
        sharedInterestCount: sharedCount,
      };
    });

    // Combine all profiles and deduplicate by ID
    const seenIds = new Set<string>();
    const allProfiles: SafeMatchProfile[] = [];

    for (const profile of [...fakeProfilesAsSafe, ...realProfilesAsSafe]) {
      if (!seenIds.has(profile.id)) {
        seenIds.add(profile.id);
        allProfiles.push(profile);
      }
    }

    // Sort by shared interest count (highest first), then shuffle within same count
    allProfiles.sort((a, b) => {
      const countDiff = (b.sharedInterestCount || 0) - (a.sharedInterestCount || 0);
      if (countDiff !== 0) return countDiff;
      return Math.random() - 0.5; // Random sort for same count
    });

    return allProfiles.slice(0, limit);
  } catch (error) {
    console.error('Error getting safe matches:', error);
    return [];
  }
};

// Send an intro message to start a conversation
export const sendIntroMessage = async (
  targetUserId: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> => {
  try {
    const userId = await getUserId();
    const userProfile = await getUserProfile();

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1_id.eq.${userId},participant_2_id.eq.${targetUserId}),and(participant_1_id.eq.${targetUserId},participant_2_id.eq.${userId})`)
      .single();

    if (existingConv) {
      return { success: true, conversationId: existingConv.id };
    }

    // Create a new conversation
    const conversationId = await createMutualMatch(userId, targetUserId);

    if (!conversationId) {
      return { success: false, error: 'Failed to create conversation' };
    }

    // Send an automatic intro message
    const introMessage = `Hi! I'm ${userProfile?.name || 'a Haven user'}. I noticed we have some things in common and would love to connect!`;

    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        recipient_id: targetUserId,
        content: introMessage,
        message_type: 'text',
        is_read: false,
      });

    // Update conversation's last message
    await supabase
      .from('conversations')
      .update({
        last_message_text: introMessage,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // Send push notification to the target user about the new connection
    // Skip notification for fake profiles
    const isFakeProfile = FAKE_PROFILES.some(p => p.id === targetUserId);
    if (!isFakeProfile) {
      sendMatchNotification(targetUserId, userProfile?.name || 'Someone', conversationId);
    }

    return { success: true, conversationId };
  } catch (error) {
    console.error('Error sending intro message:', error);
    return { success: false, error: 'Failed to send intro message' };
  }
};

export default {
  getPotentialMatches,
  recordSwipeAction,
  getMutualMatches,
  getMatch,
  simulateFakeUserResponse,
  calculateCompatibility,
  subscribeToNewMatches,
  // New safe matching functions
  getSafeMatches,
  sendIntroMessage,
  getSharedTraits,
};
