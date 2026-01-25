import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import MenuModal from '../components/MenuModal';
import { COMPANIONS } from '../data/companionProfiles';
import { getLocalImage } from '../data/localImages';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';

import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.API_URL;

type RootStackParamList = {
  CompanionProfile: { companionId: string };
  Companion: { companionId: string };
  Chat: { conversationId: string; name: string; avatar?: string; isOnline?: boolean; companionId?: string };
  Call: { companionId: string };
  Matches: undefined;
};

type CompanionType = {
  id: string;
  name: string;
  age: number;
  location: string;
  description: string;
  gender: string;
  profileImage: string;
};

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.lg * 2 - Spacing.md) / 2;
const cardHeight = cardWidth * 1.4;

type FilterType = 'all' | 'female' | 'male';

const CompanionsScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { toggleFavoriteCompanion, isFavoriteCompanion, user } = useUser();
  const [filter, setFilter] = useState<FilterType>('all');
  const [companions, setCompanions] = useState<CompanionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  // Track favorites directly to ensure re-renders
  const favoriteCompanions = user.favoriteCompanions || [];

  useEffect(() => {
    // Use local companion data directly
    setCompanions(fallbackCompanions);
    setLoading(false);
  }, []);

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${API_URL}${imagePath}`;
  };

  const filteredCompanions = companions.filter(c =>
    filter === 'all' || c.gender === filter
  );

  const getImageSource = (companion: CompanionType) => {
    const localImage = getLocalImage(companion.id);
    if (localImage) {
      return localImage;
    }
    return { uri: getImageUrl(companion.profileImage) };
  };

  const renderCompanionCard = (companion: CompanionType, index: number) => (
    <View key={companion.id} style={styles.card}>
      <ImageBackground
        source={getImageSource(companion)}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardGradient}
        >
          {/* New Badge - show for first 4 */}
          {index < 4 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavoriteCompanion(companion.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={favoriteCompanions.includes(companion.id) ? 'heart' : 'heart-outline'}
              size={22}
              color={favoriteCompanions.includes(companion.id) ? '#FF4B6E' : 'white'}
            />
          </TouchableOpacity>

          {/* Tappable area for profile - image and info */}
          <TouchableOpacity
            style={styles.profileTapArea}
            onPress={() => navigation.navigate('CompanionProfile', { companionId: companion.id })}
            activeOpacity={0.8}
          >
            {/* Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{companion.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.cardLocation}>{companion.location}</Text>
              </View>
              <Text style={styles.cardAge}>{companion.age} years old</Text>
            </View>
          </TouchableOpacity>

          {/* Action Buttons - Direct to chat/call */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => navigation.navigate('Call', { companionId: companion.id })}
            >
              <Ionicons name="call" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => navigation.navigate('Chat', {
                conversationId: companion.id,
                name: companion.name,
                isOnline: true,
                companionId: companion.id,
              })}
            >
              <Ionicons name="chatbubble" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading companions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.logoContainer}>
          <Text style={[styles.logoTextSpectrum, { color: colors.text }]}>Haven</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
            filter === 'all' && styles.filterTabActive
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterText,
            { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' },
            filter === 'all' && styles.filterTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
            filter === 'female' && styles.filterTabActive
          ]}
          onPress={() => setFilter('female')}
        >
          <Text style={[
            styles.filterText,
            { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' },
            filter === 'female' && styles.filterTextActive
          ]}>
            Women
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
            filter === 'male' && styles.filterTabActive
          ]}
          onPress={() => setFilter('male')}
        >
          <Text style={[
            styles.filterText,
            { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' },
            filter === 'male' && styles.filterTextActive
          ]}>
            Men
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
        <View style={styles.gridRow}>
          {filteredCompanions.map((companion, index) => (
            <React.Fragment key={companion.id}>
              {renderCompanionCard(companion, index)}
            </React.Fragment>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Use companion profiles from data file
const fallbackCompanions: CompanionType[] = COMPANIONS.map(c => ({
  id: c.id,
  name: c.name,
  age: c.age,
  location: c.location,
  description: c.description,
  gender: c.gender,
  profileImage: c.profileImage,
}));

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoTextSpectrum: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  logoTextConnect: {
    fontSize: 22,
    fontWeight: '300',
    color: Colors.primary,
    fontStyle: 'italic',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  grid: {
    paddingHorizontal: Spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray700,
  },
  cardImageStyle: {
    borderRadius: BorderRadius.xl,
  },
  cardGradient: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'flex-end',
  },
  newBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    marginBottom: Spacing.sm,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardLocation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  cardAge: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  actionButtons: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    gap: Spacing.sm,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTapArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  // Menu Modal Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  menuContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: '#1A1A2E',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  menuLogoSpectrum: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  menuLogoConnect: {
    fontSize: 18,
    fontWeight: '300',
    color: Colors.primary,
    fontStyle: 'italic',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: Spacing.md,
  },
});

export default CompanionsScreen;
