import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
import {
  getSafeMatches,
  SafeMatchProfile,
  sendIntroMessage,
  getSharedTraits,
} from '../services/matchingService';
import {
  trackMatchViewed,
  trackMatchMessaged,
  trackScreen,
} from '../services/analyticsService';

type LocationFilter = 'US' | 'AUS';
type AgeRangeFilter = '18-25' | '26-30' | '31-40' | '40+';

interface Filters {
  locations: LocationFilter[];
  ageRanges: AgeRangeFilter[];
  genders: ('male' | 'female' | 'non-binary')[];
}

const defaultFilters: Filters = {
  locations: ['US', 'AUS'],
  ageRanges: ['18-25', '26-30', '31-40', '40+'],
  genders: ['male', 'female', 'non-binary'],
};

const MatchesScreen = () => {
  const { clearUnreadMatches, user, userId: currentUserId } = useUser();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [matches, setMatches] = useState<SafeMatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingIntro, setSendingIntro] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [tempFilters, setTempFilters] = useState<Filters>(defaultFilters);

  // Load safe matches
  const loadMatches = useCallback(async () => {
    try {
      const safeMatches = await getSafeMatches(20);
      setMatches(safeMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useFocusEffect(
    useCallback(() => {
      clearUnreadMatches();
    }, [clearUnreadMatches])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  // Helper to check if age falls in selected ranges
  const isAgeInSelectedRanges = (age: number | undefined, ranges: AgeRangeFilter[]): boolean => {
    if (!age) return true; // Include if no age specified
    if (ranges.length === 4) return true; // All ranges selected

    for (const range of ranges) {
      if (range === '18-25' && age >= 18 && age <= 25) return true;
      if (range === '26-30' && age >= 26 && age <= 30) return true;
      if (range === '31-40' && age >= 31 && age <= 40) return true;
      if (range === '40+' && age > 40) return true;
    }
    return false;
  };

  // Helper to check if location matches selected regions
  const isLocationInSelectedRegions = (location: string | undefined, regions: LocationFilter[]): boolean => {
    if (!location) return true; // Include if no location specified
    if (regions.length === 2) return true; // All regions selected

    const loc = location.toLowerCase();
    const ausKeywords = ['australia', 'nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'nt', 'act', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'hobart', 'darwin', 'canberra', 'gold coast', 'newcastle', 'byron'];
    const usKeywords = ['usa', 'us', 'united states', 'california', 'new york', 'texas', 'florida', 'los angeles', 'san francisco', 'chicago', 'boston', 'seattle', 'denver', 'austin', 'portland', 'nashville'];

    const isAus = ausKeywords.some(kw => loc.includes(kw));
    const isUs = usKeywords.some(kw => loc.includes(kw));

    if (regions.includes('AUS') && isAus) return true;
    if (regions.includes('US') && isUs) return true;

    // If location doesn't match either, include it if both are selected
    return regions.length === 2;
  };

  // Apply filters to matches
  const filteredMatches = useMemo(() => {
    return matches.filter(profile => {
      // Filter by location
      if (!isLocationInSelectedRegions(profile.location, filters.locations)) {
        return false;
      }

      // Filter by age
      if (!isAgeInSelectedRanges(profile.age, filters.ageRanges)) {
        return false;
      }

      return true;
    });
  }, [matches, filters]);

  const handleOpenFilters = () => {
    setTempFilters(filters);
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setTempFilters(defaultFilters);
  };

  const toggleLocation = (location: LocationFilter) => {
    setTempFilters(prev => {
      const locations = prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location];
      return { ...prev, locations: locations.length > 0 ? locations : [location] };
    });
  };

  const toggleAgeRange = (range: AgeRangeFilter) => {
    setTempFilters(prev => {
      const ageRanges = prev.ageRanges.includes(range)
        ? prev.ageRanges.filter(r => r !== range)
        : [...prev.ageRanges, range];
      return { ...prev, ageRanges: ageRanges.length > 0 ? ageRanges : [range] };
    });
  };

  const toggleGender = (gender: 'male' | 'female' | 'non-binary') => {
    setTempFilters(prev => {
      const genders = prev.genders.includes(gender)
        ? prev.genders.filter(g => g !== gender)
        : [...prev.genders, gender];
      return { ...prev, genders: genders.length > 0 ? genders : [gender] };
    });
  };

  const hasActiveFilters = filters.locations.length !== 2 ||
    filters.ageRanges.length !== 4 ||
    filters.genders.length !== 3;

  const handleSendIntro = async (profile: SafeMatchProfile) => {
    setSendingIntro(profile.id);
    trackMatchMessaged(profile.id);
    try {
      const result = await sendIntroMessage(profile.id);
      if (result.success && result.conversationId) {
        navigation.navigate('Chat', {
          conversationId: result.conversationId,
          name: profile.name,
          avatar: profile.profilePhotos[0],
          isOnline: true,
          recipientId: profile.id,
          isFakeUser: profile.isFake,
        });
      }
    } catch (error) {
      console.error('Error sending intro:', error);
    } finally {
      setSendingIntro(null);
    }
  };

  const handleViewProfile = (profile: SafeMatchProfile) => {
    // Track profile view
    trackMatchViewed(profile.id);

    // Don't allow viewing own profile from matches (shouldn't happen, but safety check)
    if (profile.id === currentUserId) {
      navigation.navigate('Profile' as never);
      return;
    }
    navigation.navigate('UserProfile', {
      userId: profile.id,
      name: profile.name,
      avatar: profile.profilePhotos[0],
    });
  };

  const renderCompatibilityTag = (text: string, key: string) => (
    <View key={key} style={[styles.compatibilityTag, { borderColor: colors.primary }]}>
      <Text style={[styles.compatibilityTagText, { color: colors.primary }]}>{text}</Text>
    </View>
  );

  const renderInterestTag = (interest: string, emoji: string, key: string, isShared: boolean) => (
    <View
      key={key}
      style={[
        styles.interestTag,
        { backgroundColor: isDark ? colors.surface : '#F1F5F9' },
        isShared && styles.sharedInterestTag,
      ]}
    >
      <Text style={styles.interestEmoji}>{emoji}</Text>
      <Text style={[styles.interestText, { color: colors.text }, isShared && styles.sharedInterestText]}>
        {interest}
      </Text>
      {isShared && <Ionicons name="heart" size={12} color={Colors.primary} style={{ marginLeft: 4 }} />}
    </View>
  );

  const getInterestEmoji = (interest: string): string => {
    const emojiMap: Record<string, string> = {
      gaming: '🎮', music: '🎵', reading: '📚', cooking: '🍳', travel: '✈️',
      photography: '📷', fitness: '💪', art: '🎨', movies: '🎬', tech: '💻',
      nature: '🌿', animals: '🐾', writing: '✍️', meditation: '🧘', coding: '⌨️',
      science: '🔬', history: '📜', sports: '⚽', crafts: '🧶', gardening: '🌱',
    };
    return emojiMap[interest.toLowerCase()] || '⭐';
  };

  const renderMatchCard = (profile: SafeMatchProfile) => {
    const sharedTraits = getSharedTraits(user, profile);
    const userInterests = user.interests || [];

    return (
      <View
        key={profile.id}
        style={[styles.matchCard, { backgroundColor: isDark ? colors.surface : '#F6F8F6' }]}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profile.profilePhotos[0] }}
                style={styles.avatar}
              />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="black" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {profile.name}, {profile.age}
                </Text>
                <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
              </View>
              <Text style={[styles.profileLocation, { color: colors.textSecondary }]}>
                {profile.location ? `📍 ${profile.location}` : 'Nearby'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Compatibility Highlights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            COMPATIBILITY HIGHLIGHTS
          </Text>
          <View style={styles.tagsContainer}>
            {sharedTraits.map((trait, idx) => renderCompatibilityTag(trait, `trait-${idx}`))}
            {profile.communicationStyle && (
              renderCompatibilityTag(profile.communicationStyle, 'comm-style')
            )}
          </View>
        </View>

        {/* Special Interests */}
        <View style={[styles.section, styles.interestsSection, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={14} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginLeft: 4 }]}>
              SPECIAL INTERESTS
            </Text>
          </View>
          <View style={styles.tagsContainer}>
            {profile.interests.slice(0, 5).map((interest, idx) => {
              const isShared = userInterests.some(
                ui => ui.toLowerCase() === interest.toLowerCase()
              );
              return renderInterestTag(
                interest,
                getInterestEmoji(interest),
                `interest-${idx}`,
                isShared
              );
            })}
          </View>
        </View>

        {/* Communication Preferences */}
        {profile.communicationPreferences && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              COMMUNICATION PREFERENCES
            </Text>
            <Text style={[styles.communicationText, { color: colors.text }]}>
              "{profile.communicationPreferences}"
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton, { backgroundColor: isDark ? colors.cardBackground : '#F1F5F9' }]}
            onPress={() => handleViewProfile(profile)}
          >
            <Text style={[styles.viewButtonText, { color: colors.text }]}>View Full Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.introButton]}
            onPress={() => handleSendIntro(profile)}
            disabled={sendingIntro === profile.id}
          >
            {sendingIntro === profile.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="chatbubble" size={16} color="white" />
                <Text style={styles.introButtonText}>Send Intro</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Finding safe matches...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Discover</Text>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: isDark ? colors.surface : '#F1F5F9' },
                hasActiveFilters && { backgroundColor: Colors.primary + '30', borderColor: Colors.primary, borderWidth: 1 }
              ]}
              onPress={handleOpenFilters}
            >
              <Ionicons name="options" size={20} color={hasActiveFilters ? Colors.primary : colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Ionicons name="menu" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Based on your shared interests and communication needs.
        </Text>
      </View>

      {/* Dropdown Menu */}
      {showMenu && (
        <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate('Profile');
            }}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>My Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate('Settings');
            }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              handleOpenFilters();
            }}
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Match Feed */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {filteredMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {hasActiveFilters ? 'No matches found' : 'No matches yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {hasActiveFilters
                ? 'Try adjusting your filters to see more people.'
                : 'Complete your profile with more interests to find compatible connections.'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={[styles.resetFiltersButton, { borderColor: Colors.primary }]}
                onPress={() => setFilters(defaultFilters)}
              >
                <Text style={[styles.resetFiltersText, { color: Colors.primary }]}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredMatches.map(profile => renderMatchCard(profile))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
            <TouchableOpacity onPress={handleApplyFilters}>
              <Text style={[styles.modalApply, { color: Colors.primary }]}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Location</Text>
              <View style={styles.checkboxGrid}>
                {([['US', '🇺🇸 United States'], ['AUS', '🇦🇺 Australia']] as const).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.checkboxOption,
                      {
                        backgroundColor: tempFilters.locations.includes(key)
                          ? Colors.primary + '20'
                          : isDark ? colors.surface : '#F1F5F9',
                        borderColor: tempFilters.locations.includes(key)
                          ? Colors.primary
                          : colors.border,
                      }
                    ]}
                    onPress={() => toggleLocation(key)}
                  >
                    <Text
                      style={[
                        styles.checkboxOptionText,
                        { color: tempFilters.locations.includes(key) ? Colors.primary : colors.text }
                      ]}
                    >
                      {label}
                    </Text>
                    {tempFilters.locations.includes(key) && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Age Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Age Range</Text>
              <View style={styles.checkboxGrid}>
                {(['18-25', '26-30', '31-40', '40+'] as const).map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.checkboxOption,
                      {
                        backgroundColor: tempFilters.ageRanges.includes(range)
                          ? Colors.primary + '20'
                          : isDark ? colors.surface : '#F1F5F9',
                        borderColor: tempFilters.ageRanges.includes(range)
                          ? Colors.primary
                          : colors.border,
                      }
                    ]}
                    onPress={() => toggleAgeRange(range)}
                  >
                    <Text
                      style={[
                        styles.checkboxOptionText,
                        { color: tempFilters.ageRanges.includes(range) ? Colors.primary : colors.text }
                      ]}
                    >
                      {range}
                    </Text>
                    {tempFilters.ageRanges.includes(range) && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Gender Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Show Me</Text>
              <View style={styles.genderOptions}>
                {(['male', 'female', 'non-binary'] as const).map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      {
                        backgroundColor: tempFilters.genders.includes(gender)
                          ? Colors.primary + '20'
                          : isDark ? colors.surface : '#F1F5F9',
                        borderColor: tempFilters.genders.includes(gender)
                          ? Colors.primary
                          : colors.border,
                      }
                    ]}
                    onPress={() => toggleGender(gender)}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        {
                          color: tempFilters.genders.includes(gender)
                            ? Colors.primary
                            : colors.text
                        }
                      ]}
                    >
                      {gender === 'non-binary' ? 'Non-binary' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                    {tempFilters.genders.includes(gender) && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: colors.border }]}
              onPress={handleResetFilters}
            >
              <Ionicons name="refresh" size={18} color={colors.textSecondary} />
              <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset All Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Tap outside to close menu */}
      {showMenu && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodySmall,
    marginTop: Spacing.md,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...Typography.bodySmall,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  matchCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F6F8F6',
  },
  profileInfo: {
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileLocation: {
    ...Typography.caption,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  interestsSection: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compatibilityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(25, 230, 94, 0.15)',
    borderWidth: 1,
  },
  compatibilityTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  sharedInterestTag: {
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  interestEmoji: {
    fontSize: 14,
  },
  interestText: {
    fontSize: 14,
  },
  sharedInterestText: {
    fontWeight: '600',
  },
  communicationText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  viewButton: {},
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  introButton: {
    backgroundColor: Colors.primary,
  },
  introButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h2,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  resetFiltersButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  resetFiltersText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 110,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalApply: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minWidth: '47%',
    gap: Spacing.sm,
  },
  checkboxOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  genderOptions: {
    gap: Spacing.sm,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MatchesScreen;
