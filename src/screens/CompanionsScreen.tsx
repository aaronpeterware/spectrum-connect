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

import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.API_URL;

type RootStackParamList = {
  CompanionProfile: { companionId: string };
  Companion: { companionId: string };
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<FilterType>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [companions, setCompanions] = useState<CompanionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    fetchCompanions();
  }, []);

  const fetchCompanions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/companions`);
      const data = await response.json();
      setCompanions(data.companions || []);
    } catch (error) {
      if (__DEV__) console.error('Error fetching companions:', error);
      // Use fallback data if API fails
      setCompanions(fallbackCompanions);
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

  const filteredCompanions = companions.filter(c =>
    filter === 'all' || c.gender === filter
  );

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderCompanionCard = (companion: CompanionType, index: number) => (
    <View key={companion.id} style={styles.card}>
      <ImageBackground
        source={{ uri: getImageUrl(companion.profileImage) }}
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
            onPress={() => toggleFavorite(companion.id)}
          >
            <Ionicons
              name={favorites.has(companion.id) ? 'heart' : 'heart-outline'}
              size={22}
              color={favorites.has(companion.id) ? Colors.secondary : 'white'}
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
              onPress={() => navigation.navigate('Companion', { companionId: companion.id })}
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
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading companions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextSpectrum}>Spectrum</Text>
          <Text style={styles.logoTextConnect}>Connect</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'female' && styles.filterTabActive]}
          onPress={() => setFilter('female')}
        >
          <Text style={[styles.filterText, filter === 'female' && styles.filterTextActive]}>
            Women
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'male' && styles.filterTabActive]}
          onPress={() => setFilter('male')}
        >
          <Text style={[styles.filterText, filter === 'male' && styles.filterTextActive]}>
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

// Fallback data if API fails
const fallbackCompanions: CompanionType[] = [
  { id: 'megan', name: 'Megan', age: 25, location: 'Copenhagen', description: '', gender: 'female', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face' },
  { id: 'grace', name: 'Grace', age: 27, location: 'Seoul', description: '', gender: 'female', profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face' },
  { id: 'julia', name: 'Julia', age: 26, location: 'Beverly Hills', description: '', gender: 'female', profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face' },
  { id: 'bianca', name: 'Bianca', age: 26, location: 'Milan', description: '', gender: 'female', profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face' },
  { id: 'julian', name: 'Julian', age: 27, location: 'Florida', description: '', gender: 'male', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face' },
  { id: 'luca', name: 'Luca', age: 27, location: 'Tokyo', description: '', gender: 'male', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
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
    color: 'white',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    color: 'rgba(255,255,255,0.6)',
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
