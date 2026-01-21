import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.lg * 2;
const CARD_HEIGHT = height * 0.65;
const SWIPE_THRESHOLD = width * 0.25;

// Sample match profiles
const matchProfiles = [
  {
    id: 'emma',
    name: 'Emma',
    age: 28,
    bio: 'Coffee enthusiast and book lover. I work in marketing and enjoy hiking on weekends. Looking for meaningful conversations and genuine connections.',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face',
    interests: ['Reading', 'Hiking', 'Coffee', 'Marketing', 'Nature'],
    verified: true,
    compatibility: 94,
  },
  {
    id: 'sophie',
    name: 'Sophie',
    age: 26,
    bio: 'Yoga instructor and plant mom. Looking for genuine connections and good conversations. Love trying new restaurants and exploring the city.',
    image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop&crop=face',
    interests: ['Yoga', 'Plants', 'Food', 'Travel', 'Wellness'],
    verified: true,
    compatibility: 89,
  },
  {
    id: 'olivia',
    name: 'Olivia',
    age: 30,
    bio: 'Software engineer by day, amateur chef by night. I love trying new restaurants and cooking for friends. Always up for a good conversation about tech or food.',
    image: 'https://images.unsplash.com/photo-1557555187-23d685287bc3?w=400&h=600&fit=crop&crop=face',
    interests: ['Cooking', 'Tech', 'Gaming', 'Food', 'Movies'],
    verified: false,
    compatibility: 87,
  },
  {
    id: 'ava',
    name: 'Ava',
    age: 25,
    bio: 'Graduate student studying psychology. I enjoy long walks and meaningful conversations. Music is my escape and I love discovering new artists.',
    image: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&h=600&fit=crop&crop=face',
    interests: ['Psychology', 'Music', 'Walking', 'Reading', 'Art'],
    verified: true,
    compatibility: 85,
  },
];

// User's interests for highlighting shared ones
const userInterests = ['Reading', 'Music', 'Tech', 'Movies', 'Coffee'];

// Sara's dating tips
const saraTips = [
  "Shared interests make great first message topics!",
  "Start with an open-ended question about their bio.",
  "Be genuine - authenticity is attractive!",
  "Ask about their favorite hobby from their interests.",
  "A thoughtful compliment goes a long way!",
];

const MatchesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<typeof matchProfiles[0] | null>(null);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.9, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -width * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(prev => prev + 1);
    });
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: width * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      // Show match animation (50% chance for demo)
      if (Math.random() > 0.5) {
        setMatchedProfile(matchProfiles[currentIndex]);
        setShowMatch(true);
      }
      setCurrentIndex(prev => prev + 1);
    });
  };

  const handleMaybeLater = () => {
    swipeLeft();
  };

  const handleConnect = () => {
    swipeRight();
  };

  const closeMatchModal = () => {
    setShowMatch(false);
    setMatchedProfile(null);
  };

  const handleSendMessage = () => {
    if (matchedProfile) {
      // Close the modal first
      setShowMatch(false);
      // Navigate to chat with the matched real user
      navigation.navigate('Chat', {
        conversationId: matchedProfile.id,
        name: matchedProfile.name,
        avatar: matchedProfile.image,
        isOnline: true,
      });
      setMatchedProfile(null);
    }
  };

  const currentProfile = matchProfiles[currentIndex];
  const nextProfile = matchProfiles[currentIndex + 1];
  const randomTip = saraTips[Math.floor(Math.random() * saraTips.length)];

  if (currentIndex >= matchProfiles.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Matches</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-circle" size={80} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>You've seen everyone!</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new matches, or try adjusting your preferences.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => setCurrentIndex(0)}
          >
            <LinearGradient
              colors={[Colors.gradientPink, Colors.gradientPurple]}
              style={styles.refreshGradient}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.refreshText}>Start Over</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Matches</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="options-outline" size={24} color={Colors.gray600} />
        </TouchableOpacity>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* Next Card (behind) */}
        {nextProfile && (
          <Animated.View
            style={[
              styles.card,
              styles.nextCard,
              { transform: [{ scale: nextCardScale }] },
            ]}
          >
            <Image source={{ uri: nextProfile.image }} style={styles.cardImage} />
          </Animated.View>
        )}

        {/* Current Card */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            },
          ]}
        >
          {/* Like/Nope overlays */}
          <Animated.View style={[styles.likeOverlay, { opacity: likeOpacity }]}>
            <Text style={styles.likeText}>CONNECT</Text>
          </Animated.View>
          <Animated.View style={[styles.nopeOverlay, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeText}>PASS</Text>
          </Animated.View>

          <Image source={{ uri: currentProfile.image }} style={styles.cardImage} />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.cardGradient}
          >
            {/* AI Match Badge */}
            <View style={styles.aiMatchBadge}>
              <Ionicons name="sparkles" size={14} color="white" />
              <Text style={styles.aiMatchText}>AI Match • {currentProfile.compatibility}%</Text>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{currentProfile.name}, {currentProfile.age}</Text>
                {currentProfile.verified && (
                  <Ionicons name="checkmark-circle" size={22} color="#4DA6FF" />
                )}
              </View>
              <Text style={styles.profileBio} numberOfLines={3}>{currentProfile.bio}</Text>

              {/* Interest Tags */}
              <View style={styles.interestTags}>
                {currentProfile.interests.slice(0, 4).map((interest, idx) => {
                  const isShared = userInterests.includes(interest);
                  return (
                    <View
                      key={idx}
                      style={[styles.interestTag, isShared && styles.sharedInterestTag]}
                    >
                      {isShared && <Ionicons name="heart" size={10} color="white" style={{ marginRight: 4 }} />}
                      <Text style={[styles.interestText, isShared && styles.sharedInterestText]}>
                        {interest}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Sara's Tip */}
      <View style={styles.tipContainer}>
        <View style={styles.tipAvatar}>
          <Text style={styles.tipEmoji}>👩‍🏫</Text>
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipLabel}>Sara's Tip</Text>
          <Text style={styles.tipText}>{randomTip}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.passButton} onPress={handleMaybeLater}>
          <Ionicons name="close" size={28} color={Colors.gray500} />
          <Text style={styles.passButtonText}>Maybe Later</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
          <LinearGradient
            colors={[Colors.gradientPink, Colors.gradientPurple]}
            style={styles.connectGradient}
          >
            <Text style={styles.connectEmoji}>💜</Text>
            <Text style={styles.connectButtonText}>Connect</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Match Success Modal */}
      {showMatch && matchedProfile && (
        <View style={styles.matchOverlay}>
          <Animated.View style={styles.matchContent}>
            <View style={styles.matchHearts}>
              <Text style={styles.matchHeart}>💜</Text>
              <Text style={styles.matchHeart}>💜</Text>
              <Text style={styles.matchHeart}>💜</Text>
            </View>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>
              You and {matchedProfile.name} liked each other
            </Text>

            <View style={styles.matchProfiles}>
              <Image
                source={{ uri: 'https://randomuser.me/api/portraits/men/85.jpg' }}
                style={styles.matchProfileImage}
              />
              <View style={styles.matchHeartCenter}>
                <Ionicons name="heart" size={32} color={Colors.primary} />
              </View>
              <Image
                source={{ uri: matchedProfile.image }}
                style={styles.matchProfileImage}
              />
            </View>

            <TouchableOpacity style={styles.sendMessageButton} onPress={handleSendMessage}>
              <LinearGradient
                colors={[Colors.gradientPink, Colors.gradientPurple]}
                style={styles.sendMessageGradient}
              >
                <Text style={styles.sendMessageText}>Send a Message</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.keepSwipingButton} onPress={closeMatchModal}>
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'absolute',
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  nextCard: {
    top: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    padding: Spacing.lg,
    justifyContent: 'flex-end',
  },
  likeOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    borderWidth: 4,
    borderColor: Colors.success,
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '-15deg' }],
  },
  likeText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.success,
  },
  nopeOverlay: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    borderWidth: 4,
    borderColor: Colors.error,
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '15deg' }],
  },
  nopeText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.error,
  },
  aiMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 79, 255, 0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    gap: 6,
  },
  aiMatchText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  profileInfo: {
    gap: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  profileBio: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.sm,
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedInterestTag: {
    backgroundColor: Colors.primary,
  },
  interestText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '500',
  },
  sharedInterestText: {
    color: 'white',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  tipAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipEmoji: {
    fontSize: 20,
  },
  tipContent: {
    flex: 1,
  },
  tipLabel: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  passButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray200,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  passButtonText: {
    ...Typography.body,
    color: Colors.gray600,
    fontWeight: '600',
  },
  connectButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  connectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  connectEmoji: {
    fontSize: 18,
  },
  connectButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  refreshButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  refreshGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  refreshText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  // Match Modal
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchContent: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  matchHearts: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  matchHeart: {
    fontSize: 40,
    marginHorizontal: 4,
  },
  matchTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    marginBottom: Spacing.sm,
  },
  matchSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xl,
  },
  matchProfiles: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  matchProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  matchHeartCenter: {
    marginHorizontal: -20,
    zIndex: 1,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendMessageButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  sendMessageGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  sendMessageText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  keepSwipingButton: {
    paddingVertical: Spacing.md,
  },
  keepSwipingText: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default MatchesScreen;
