import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { COMPANIONS, getCompanionById } from '../data/companionProfiles';
import { getLocalImage } from '../data/localImages';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';

import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.API_URL;

// Create fallback image lookup from companion profiles
const companionImages: Record<string, string> = {};
COMPANIONS.forEach(c => {
  companionImages[c.id] = c.profileImage;
});

type RootStackParamList = {
  CompanionProfile: { companionId: string };
  Companion: { companionId: string };
  Call: { companionId: string };
  Chat: { conversationId: string; name: string; avatar?: string; isOnline?: boolean; companionId?: string };
};

type CompanionData = {
  id: string;
  name: string;
  age: number;
  location: string;
  description: string;
  gender: string;
  images: string[];
  profileImage: string;
};

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.6;

const CompanionProfileScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CompanionProfile'>>();
  const companionId = route.params?.companionId || 'sophia';
  const { toggleFavoriteCompanion, isFavoriteCompanion } = useUser();

  const [companion, setCompanion] = useState<CompanionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const isFavorite = isFavoriteCompanion(companionId);

  const handleReportUser = () => {
    setMenuVisible(false);
    Alert.alert(
      'Report User',
      'Thank you for helping keep Haven safe. What would you like to report?',
      [
        { text: 'Inappropriate Content', onPress: () => Alert.alert('Report Submitted', 'Our team will review this report.') },
        { text: 'Abusive Behaviour', onPress: () => Alert.alert('Report Submitted', 'Our team will review this report.') },
        { text: 'Spam', onPress: () => Alert.alert('Report Submitted', 'Our team will review this report.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleBlockUser = () => {
    setMenuVisible(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${companion?.name}? You won't see their content anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            Alert.alert('User Blocked', `${companion?.name} has been blocked.`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchCompanionData();
  }, [companionId]);

  const fetchCompanionData = async () => {
    // Use local companion profile data directly
    const localCompanion = getCompanionById(companionId);
    if (localCompanion) {
      setCompanion({
        id: localCompanion.id,
        name: localCompanion.name,
        age: localCompanion.age,
        location: localCompanion.location,
        description: localCompanion.description,
        gender: localCompanion.gender,
        images: localCompanion.gallery,
        profileImage: localCompanion.profileImage,
      });
    } else {
      const fallbackImage = companionImages[companionId] || 'https://randomuser.me/api/portraits/women/39.jpg';
      setCompanion({
        id: companionId,
        name: companionId.charAt(0).toUpperCase() + companionId.slice(1),
        age: 25,
        location: 'Australia',
        description: 'A wonderful companion waiting to meet you.',
        gender: 'female',
        images: [fallbackImage],
        profileImage: fallbackImage,
      });
    }
    setLoading(false);
  };

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${API_URL}${imagePath}`;
  };

  const getImageSource = () => {
    const localImage = getLocalImage(companionId);
    if (localImage) {
      return localImage;
    }
    return { uri: getImageUrl(companion?.profileImage || '') };
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!companion) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Companion not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Image */}
      <View style={styles.imageContainer}>
        <Image
          source={getImageSource()}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Header Buttons */}
        <SafeAreaView style={styles.headerOverlay} edges={['top']}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => toggleFavoriteCompanion(companionId)}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={26}
                color={isFavorite ? '#FF4B6E' : 'white'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => setMenuVisible(true)}>
              <Ionicons name="ellipsis-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'transparent', isDark ? 'rgba(26,26,46,0.95)' : 'rgba(255,255,255,0.95)']}
          locations={[0, 0.5, 1]}
          style={styles.imageGradient}
          pointerEvents="none"
        />
      </View>

      {/* Profile Info */}
      <View style={styles.profileContainer}>
        {/* Name and Status Row */}
        <View style={styles.nameRow}>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text }]}>{companion.name}</Text>
            <Text style={[styles.age, { color: colors.textSecondary }]}>{companion.age}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={22} color="#4DA6FF" />
            </View>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online now</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.location, { color: colors.textSecondary }]}>{companion.location}</Text>
          <Text style={[styles.distance, { color: colors.textSecondary }]}>• 2 km away</Text>
        </View>

        {/* Bio */}
        <ScrollView
          style={styles.bioContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bioContent}
        >
          <Text style={[styles.bio, { color: colors.text }]}>{companion.description}</Text>

          {/* Interest Tags */}
          <View style={styles.interestsContainer}>
            <View style={[styles.interestTag, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={styles.interestEmoji}>💬</Text>
              <Text style={[styles.interestText, { color: colors.text }]}>Chatty</Text>
            </View>
            <View style={[styles.interestTag, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={styles.interestEmoji}>🎭</Text>
              <Text style={[styles.interestText, { color: colors.text }]}>Roleplay</Text>
            </View>
            <View style={[styles.interestTag, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={styles.interestEmoji}>💕</Text>
              <Text style={[styles.interestText, { color: colors.text }]}>Flirty</Text>
            </View>
            <View style={[styles.interestTag, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={styles.interestEmoji}>🌙</Text>
              <Text style={[styles.interestText, { color: colors.text }]}>Night owl</Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons - iPhone Style */}
        <View style={styles.actionContainer}>
          {/* Call Button - iPhone Green */}
          <TouchableOpacity
            style={styles.iphoneButton}
            onPress={() => navigation.navigate('Call', { companionId })}
          >
            <View style={[styles.iphoneButtonInner, styles.callButtonBg]}>
              <Ionicons name="call" size={28} color="white" />
            </View>
            <Text style={[styles.iphoneButtonLabel, { color: colors.text }]}>Call</Text>
          </TouchableOpacity>

          {/* Message Button - iPhone Blue */}
          <TouchableOpacity
            style={styles.iphoneButton}
            onPress={() => navigation.navigate('Chat', {
              conversationId: companionId,
              name: companion?.name || 'Unknown',
              isOnline: true,
              companionId: companionId,
            })}
          >
            <View style={[styles.iphoneButtonInner, styles.messageButtonBg]}>
              <Ionicons name="chatbubble" size={26} color="white" />
            </View>
            <Text style={[styles.iphoneButtonLabel, { color: colors.text }]}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Safety Padding */}
        <View style={styles.bottomPadding} />
      </View>

      {/* Report/Block Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleReportUser}>
              <Ionicons name="flag" size={22} color={Colors.warning} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Report User</Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.menuItem} onPress={handleBlockUser}>
              <Ionicons name="ban" size={22} color={Colors.error} />
              <Text style={[styles.menuItemText, { color: Colors.error }]}>Block User</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  image: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  profileContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    marginTop: -30,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  age: {
    fontSize: 28,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.8)',
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  location: {
    fontSize: 15,
    color: Colors.gray400,
  },
  distance: {
    fontSize: 15,
    color: Colors.gray500,
  },
  bioContainer: {
    flex: 1,
  },
  bioContent: {
    paddingBottom: 10,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.85)',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  interestEmoji: {
    fontSize: 14,
  },
  interestText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  iphoneButton: {
    alignItems: 'center',
    gap: 6,
  },
  iphoneButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonBg: {
    backgroundColor: '#34C759', // iPhone green
  },
  messageButtonBg: {
    backgroundColor: '#007AFF', // iPhone blue
  },
  iphoneButtonLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 10,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: width * 0.8,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
});

export default CompanionProfileScreen;
