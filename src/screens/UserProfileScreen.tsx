import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

const { width } = Dimensions.get('window');

type RouteParams = {
  UserProfile: {
    userId: string;
    name: string;
    avatar?: string;
  };
};

// Sample user data - in a real app this would come from an API
const userData: Record<string, {
  name: string;
  age: number;
  location: string;
  bio: string;
  avatar: string;
  interests: string[];
  joinedDate: string;
  postsCount: number;
  connectionsCount: number;
  isVerified: boolean;
}> = {
  'user1': {
    name: 'Alex Rivera',
    age: 28,
    location: 'San Francisco, CA',
    bio: "Tech enthusiast and coffee addict. I love hiking on weekends and trying new restaurants. Currently working on building meaningful connections and growing as a person. Always up for deep conversations about life, philosophy, and the future.",
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    interests: ['Hiking', 'Coffee', 'Tech', 'Philosophy', 'Travel'],
    joinedDate: 'March 2024',
    postsCount: 12,
    connectionsCount: 156,
    isVerified: true,
  },
  'user2': {
    name: 'Jordan Chen',
    age: 25,
    location: 'New York, NY',
    bio: "Artist and dreamer. I spend my days creating and my nights exploring the city. Looking for genuine people who appreciate art, music, and spontaneous adventures.",
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    interests: ['Art', 'Music', 'Photography', 'City Life', 'Adventures'],
    joinedDate: 'January 2024',
    postsCount: 24,
    connectionsCount: 289,
    isVerified: true,
  },
  'user3': {
    name: 'Sam Taylor',
    age: 31,
    location: 'Austin, TX',
    bio: "Fitness coach by day, amateur chef by night. I believe in balance - work hard, play hard. Love meeting new people and hearing their stories.",
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    interests: ['Fitness', 'Cooking', 'Music', 'Sports', 'Wellness'],
    joinedDate: 'February 2024',
    postsCount: 8,
    connectionsCount: 94,
    isVerified: false,
  },
  'user4': {
    name: 'Casey Morgan',
    age: 27,
    location: 'Seattle, WA',
    bio: "Software developer with a passion for sustainability. When I'm not coding, you'll find me volunteering or exploring the Pacific Northwest. Looking for like-minded individuals.",
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    interests: ['Coding', 'Sustainability', 'Nature', 'Volunteering', 'Reading'],
    joinedDate: 'April 2024',
    postsCount: 15,
    connectionsCount: 178,
    isVerified: true,
  },
};

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'UserProfile'>>();
  const { userId, name, avatar } = route.params;

  // Get user data or create a fallback
  const user = userData[userId] || {
    name: name,
    age: 25,
    location: 'Unknown',
    bio: 'This user hasn\'t added a bio yet.',
    avatar: avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    interests: [],
    joinedDate: 'Recently',
    postsCount: 0,
    connectionsCount: 0,
    isVerified: false,
  };

  const [isFollowing, setIsFollowing] = useState(false);

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
          <Image source={{ uri: user.avatar }} style={styles.avatar} />

          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            {user.isVerified && (
              <Ionicons name="checkmark-circle" size={22} color="#4DA6FF" />
            )}
          </View>

          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color={Colors.gray500} />
            {' '}{user.location} • {user.age} years old
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.postsCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.connectionsCount}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.joinedDate}</Text>
              <Text style={styles.statLabel}>Joined</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={() => setIsFollowing(!isFollowing)}
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

            <TouchableOpacity style={styles.messageButton}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
              <Text style={styles.messageText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>

        {/* Interests Section */}
        {user.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {user.interests.map((interest, index) => (
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
});

export default UserProfileScreen;
