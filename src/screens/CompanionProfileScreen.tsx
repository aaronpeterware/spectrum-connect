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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.API_URL;

// Fallback images for companions when API fails
const companionImages: Record<string, string> = {
  megan: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face',
  grace: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face',
  julia: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face',
  bianca: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face',
  julian: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face',
  luca: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face',
  sarah: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face',
  emma: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face',
  sophia: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face',
  isabella: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop&crop=face',
  olivia: 'https://images.unsplash.com/photo-1557555187-23d685287bc3?w=400&h=600&fit=crop&crop=face',
  ava: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&h=600&fit=crop&crop=face',
  mia: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face',
  charlotte: 'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=400&h=600&fit=crop&crop=face',
  amelia: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&h=600&fit=crop&crop=face',
  harper: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=600&fit=crop&crop=face',
  evelyn: 'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=400&h=600&fit=crop&crop=face',
  luna: 'https://images.unsplash.com/photo-1520466809213-7b9a56adcd45?w=400&h=600&fit=crop&crop=face',
  aria: 'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=400&h=600&fit=crop&crop=face',
  chloe: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face',
  james: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face',
  ethan: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop&crop=face',
  noah: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop&crop=face',
  oliver: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face',
  lucas: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop&crop=face',
  mason: 'https://images.unsplash.com/photo-1507081323647-4d250478b919?w=400&h=600&fit=crop&crop=face',
  aiden: 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=400&h=600&fit=crop&crop=face',
  daniel: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=600&fit=crop&crop=face',
  alexander: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=400&h=600&fit=crop&crop=face',
  michael: 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=400&h=600&fit=crop&crop=face',
};

type RootStackParamList = {
  CompanionProfile: { companionId: string };
  Companion: { companionId: string };
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CompanionProfile'>>();
  const companionId = route.params?.companionId || 'megan';

  const [companion, setCompanion] = useState<CompanionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchCompanionData();
  }, [companionId]);

  const fetchCompanionData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/companions?id=${companionId}`);
      const data = await response.json();
      setCompanion(data);
    } catch (error) {
      if (__DEV__) console.error('Error fetching companion:', error);
      const fallbackImage = companionImages[companionId] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face';
      setCompanion({
        id: companionId,
        name: companionId.charAt(0).toUpperCase() + companionId.slice(1),
        age: 25,
        location: 'Unknown',
        description: 'A wonderful companion waiting to meet you.',
        gender: 'female',
        images: [fallbackImage],
        profileImage: fallbackImage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${API_URL}${imagePath}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!companion) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Companion not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getImageUrl(companion.profileImage) }}
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
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={26}
                color={isFavorite ? '#FF4B6E' : 'white'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(26,26,46,0.95)']}
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
            <Text style={styles.name}>{companion.name}</Text>
            <Text style={styles.age}>{companion.age}</Text>
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
          <Ionicons name="location-outline" size={18} color={Colors.gray400} />
          <Text style={styles.location}>{companion.location}</Text>
          <Text style={styles.distance}>• 2 km away</Text>
        </View>

        {/* Bio */}
        <ScrollView
          style={styles.bioContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bioContent}
        >
          <Text style={styles.bio}>{companion.description}</Text>

          {/* Interest Tags */}
          <View style={styles.interestsContainer}>
            <View style={styles.interestTag}>
              <Text style={styles.interestEmoji}>💬</Text>
              <Text style={styles.interestText}>Chatty</Text>
            </View>
            <View style={styles.interestTag}>
              <Text style={styles.interestEmoji}>🎭</Text>
              <Text style={styles.interestText}>Roleplay</Text>
            </View>
            <View style={styles.interestTag}>
              <Text style={styles.interestEmoji}>💕</Text>
              <Text style={styles.interestText}>Flirty</Text>
            </View>
            <View style={styles.interestTag}>
              <Text style={styles.interestEmoji}>🌙</Text>
              <Text style={styles.interestText}>Night owl</Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons - iPhone Style */}
        <View style={styles.actionContainer}>
          {/* Call Button - iPhone Green */}
          <TouchableOpacity
            style={styles.iphoneButton}
            onPress={() => navigation.navigate('Companion', { companionId })}
          >
            <View style={[styles.iphoneButtonInner, styles.callButtonBg]}>
              <Ionicons name="call" size={28} color="white" />
            </View>
            <Text style={styles.iphoneButtonLabel}>Call</Text>
          </TouchableOpacity>

          {/* Message Button - iPhone Blue */}
          <TouchableOpacity
            style={styles.iphoneButton}
            onPress={() => navigation.navigate('Companion', { companionId })}
          >
            <View style={[styles.iphoneButtonInner, styles.messageButtonBg]}>
              <Ionicons name="chatbubble" size={26} color="white" />
            </View>
            <Text style={styles.iphoneButtonLabel}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Safety Padding */}
        <View style={styles.bottomPadding} />
      </View>
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
});

export default CompanionProfileScreen;
