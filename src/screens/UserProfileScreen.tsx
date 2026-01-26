import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { FAKE_PROFILES } from '../data/fakeProfiles';
import { supabase } from '../config/supabase';
import { getUserId } from '../services/profileService';

const { width } = Dimensions.get('window');
const GALLERY_PHOTO_SIZE = (width - Spacing.lg * 2 - Spacing.sm * 2) / 3;

type RootStackParamList = {
  UserProfile: {
    userId: string;
    name: string;
    avatar?: string;
  };
  Chat: {
    conversationId: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    recipientId?: string;
    isFakeUser?: boolean;
  };
  Profile: undefined;
};

type RouteParams = {
  UserProfile: {
    userId: string;
    name: string;
    avatar?: string;
  };
};

// Storage key for followed users
const FOLLOWED_USERS_KEY = 'followed_users';

interface UserData {
  name: string;
  age: number;
  location: string;
  bio: string;
  avatar: string;
  photos: string[];
  interests: string[];
  joinedDate: string;
  postsCount: number;
  connectionsCount: number;
  isVerified: boolean;
  goals?: string[];
}

const UserProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'UserProfile'>>();
  const { userId, name, avatar } = route.params;
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if user is viewing their own profile
  useEffect(() => {
    const checkOwnProfile = async () => {
      try {
        const currentUserId = await getUserId();
        if (currentUserId === userId) {
          setIsOwnProfile(true);
          navigation.replace('Profile');
        }
      } catch (error) {
        console.log('Error checking own profile:', error);
      }
    };
    checkOwnProfile();
  }, [userId, navigation]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        // Check fake profiles first
        const fakeProfile = FAKE_PROFILES.find(p => p.id === userId);
        if (fakeProfile) {
          setUserData({
            name: fakeProfile.name,
            age: fakeProfile.age,
            location: fakeProfile.location,
            bio: fakeProfile.bio,
            avatar: fakeProfile.profilePhotos[0] || avatar || '',
            photos: fakeProfile.profilePhotos,
            interests: fakeProfile.interests,
            joinedDate: 'Recently',
            postsCount: Math.floor(Math.random() * 20),
            connectionsCount: Math.floor(Math.random() * 100) + 50,
            isVerified: true,
            goals: fakeProfile.goals,
          });
          setLoading(false);
          return;
        }

        // Try to load from Supabase
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (data && !error) {
          setUserData({
            name: data.name || name,
            age: data.age || 25,
            location: data.location || 'Unknown',
            bio: data.bio || "This user hasn't added a bio yet.",
            avatar: data.profile_image || data.profile_photos?.[0] || avatar || '',
            photos: data.profile_photos || [],
            interests: data.interests || [],
            joinedDate: 'Recently',
            postsCount: 0,
            connectionsCount: 0,
            isVerified: false,
            goals: data.goals || [],
          });
        } else {
          // Fallback
          setUserData({
            name: name,
            age: 25,
            location: 'Unknown',
            bio: "This user hasn't added a bio yet.",
            avatar: avatar || '',
            photos: avatar ? [avatar] : [],
            interests: [],
            joinedDate: 'Recently',
            postsCount: 0,
            connectionsCount: 0,
            isVerified: false,
          });
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId, name, avatar]);

  // Load follow state on mount
  useEffect(() => {
    const loadFollowState = async () => {
      try {
        const stored = await AsyncStorage.getItem(FOLLOWED_USERS_KEY);
        if (stored) {
          const followedUsers: string[] = JSON.parse(stored);
          setIsFollowing(followedUsers.includes(userId));
        }
      } catch (error) {
        console.log('Error loading follow state:', error);
      }
    };
    loadFollowState();
  }, [userId]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!userData) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const stored = await AsyncStorage.getItem(FOLLOWED_USERS_KEY);
      let followedUsers: string[] = stored ? JSON.parse(stored) : [];

      if (isFollowing) {
        followedUsers = followedUsers.filter(id => id !== userId);
        setIsFollowing(false);
      } else {
        followedUsers.push(userId);
        setIsFollowing(true);
        Alert.alert(
          'Following!',
          `You'll be notified when ${userData.name} posts something new.`,
          [{ text: 'OK' }]
        );
      }

      await AsyncStorage.setItem(FOLLOWED_USERS_KEY, JSON.stringify(followedUsers));
    } catch (error) {
      console.log('Error toggling follow:', error);
    }
  };

  // Handle message button
  const handleMessage = async () => {
    if (!userData) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const currentUserId = await getUserId();
      const isFakeUser = !!FAKE_PROFILES.find(p => p.id === userId);

      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1_id.eq.${currentUserId},participant_2_id.eq.${userId}),and(participant_1_id.eq.${userId},participant_2_id.eq.${currentUserId})`)
        .single();

      if (existingConv) {
        navigation.navigate('Chat', {
          conversationId: existingConv.id,
          name: userData.name,
          avatar: userData.avatar,
          isOnline: true,
          recipientId: userId,
          isFakeUser,
        });
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            participant_1_id: currentUserId,
            participant_2_id: userId,
          })
          .select('id')
          .single();

        if (newConv) {
          navigation.navigate('Chat', {
            conversationId: newConv.id,
            name: userData.name,
            avatar: userData.avatar,
            isOnline: true,
            recipientId: userId,
            isFakeUser,
          });
        }
      }
    } catch (error) {
      console.log('Error finding/creating conversation:', error);
      navigation.navigate('Chat', {
        conversationId: userId,
        name: userData?.name || name,
        avatar: userData?.avatar || avatar,
        isOnline: true,
        recipientId: userId,
        isFakeUser: !!FAKE_PROFILES.find(p => p.id === userId),
      });
    }
  };

  const openPhotoViewer = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPhotoIndex(index);
  };

  const closePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  // Don't render if redirecting to own profile
  if (isOwnProfile || !userData) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.gray600} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => userData.photos.length > 0 && openPhotoViewer(0)}>
            <Image source={{ uri: userData.avatar }} style={styles.avatar} />
          </TouchableOpacity>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{userData.name}</Text>
            {userData.isVerified && (
              <Ionicons name="checkmark-circle" size={22} color="#4DA6FF" />
            )}
          </View>

          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color={Colors.gray500} />
            {' '}{userData.location} • {userData.age} years old
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.photos.length}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.connectionsCount}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.interests.length}</Text>
              <Text style={styles.statLabel}>Interests</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollowToggle}
            >
              <LinearGradient
                colors={isFollowing ? [Colors.gray200, Colors.gray200] : [Colors.gradientPink, Colors.gradientPurple]}
                style={styles.followGradient}
              >
                <Ionicons
                  name={isFollowing ? 'checkmark' : 'person-add'}
                  size={18}
                  color={isFollowing ? Colors.gray700 : 'white'}
                />
                <Text style={[styles.followText, isFollowing && styles.followingText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
              <Text style={styles.messageText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Gallery */}
        {userData.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photoGrid}>
              {userData.photos.map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.galleryPhotoContainer}
                  onPress={() => openPhotoViewer(index)}
                >
                  <Image source={{ uri: photo }} style={styles.galleryPhoto} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{userData.bio}</Text>
        </View>

        {/* Goals Section */}
        {userData.goals && userData.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking for</Text>
            <View style={styles.goalsContainer}>
              {userData.goals.map((goal, index) => (
                <View key={index} style={styles.goalTag}>
                  <Ionicons
                    name={goal === 'relationship' ? 'heart' : goal === 'friendship' ? 'people' : 'chatbubbles'}
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.goalText}>
                    {goal === 'relationship' ? 'Relationship' : goal === 'friendship' ? 'Friendship' : 'Practice'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interests Section */}
        {userData.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {userData.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Photo Viewer Modal */}
      <Modal
        visible={selectedPhotoIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closePhotoViewer}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closePhotoViewer}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          {selectedPhotoIndex !== null && (
            <FlatList
              data={userData.photos}
              horizontal
              pagingEnabled
              initialScrollIndex={selectedPhotoIndex}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.fullPhotoContainer}>
                  <Image source={{ uri: item }} style={styles.fullPhoto} resizeMode="contain" />
                </View>
              )}
              keyExtractor={(_, index) => index.toString()}
            />
          )}

          <View style={styles.photoIndicator}>
            <Text style={styles.photoIndicatorText}>
              {(selectedPhotoIndex ?? 0) + 1} / {userData.photos.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  headerSafeArea: {
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  name: {
    ...Typography.h2,
    color: Colors.gray900,
  },
  location: {
    ...Typography.body,
    color: Colors.gray500,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  statNumber: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.gray500,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.gray200,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  followButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  followingButton: {},
  followGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  followText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  followingText: {
    color: Colors.gray700,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  messageText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  section: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  bioText: {
    ...Typography.body,
    color: Colors.gray700,
    lineHeight: 24,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  galleryPhotoContainer: {
    width: GALLERY_PHOTO_SIZE,
    height: GALLERY_PHOTO_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  galleryPhoto: {
    width: '100%',
    height: '100%',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  goalText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  interestTag: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  interestText: {
    ...Typography.bodySmall,
    color: Colors.gray700,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPhotoContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhoto: {
    width: width,
    height: width,
  },
  photoIndicator: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  photoIndicatorText: {
    ...Typography.bodySmall,
    color: 'white',
  },
});

export default UserProfileScreen;
