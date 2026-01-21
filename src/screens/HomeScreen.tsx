import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

type RootStackParamList = {
  MainTabs: undefined;
  Companion: { companionId: string };
  Classroom: undefined;
};

type MainTabParamList = {
  Companions: undefined;
  Classroom: undefined;
  Messages: undefined;
};

const { width } = Dimensions.get('window');

const companions = [
  { id: 'emma', name: 'Emma', tagline: 'Warm & Supportive', icon: 'heart' as const },
  { id: 'james', name: 'James', tagline: 'Calm & Patient', icon: 'compass' as const },
  { id: 'sarah', name: 'Sarah', tagline: 'Dating Coach', icon: 'sparkles' as const },
];

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.title}>Spectrum Connect</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <LinearGradient
              colors={[Colors.gradientPink, Colors.gradientPurple]}
              style={styles.profileGradient}
            >
              <Ionicons name="person" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={[Colors.gradientPurple, Colors.gradientBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="chatbubbles" size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statsNumber}>500</Text>
                <Text style={styles.statsLabel}>Moments</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="flame" size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statsNumber}>5</Text>
                <Text style={styles.statsLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statsNumber}>12</Text>
                <Text style={styles.statsLabel}>Badges</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* AI Companions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Companions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs' as never)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Safe space to build confidence
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.companionsContainer}
          >
            {companions.map((companion) => (
              <TouchableOpacity
                key={companion.id}
                style={styles.companionCard}
                onPress={() =>
                  navigation.navigate('Companion', {
                    companionId: companion.id,
                  })
                }
              >
                <LinearGradient
                  colors={[Colors.gradientPink, Colors.gradientMint]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.companionAvatar}
                >
                  <Ionicons name={companion.icon} size={28} color="white" />
                </LinearGradient>
                <Text style={styles.companionName}>{companion.name}</Text>
                <Text style={styles.companionTagline}>{companion.tagline}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={[Colors.gradientPink, Colors.secondary]}
                style={styles.actionIcon}
              >
                <Ionicons name="heart" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.actionTitle}>Find Matches</Text>
              <Text style={styles.actionDesc}>AI-powered matching</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Classroom')}
            >
              <LinearGradient
                colors={[Colors.gradientBlue, Colors.gradientMint]}
                style={styles.actionIcon}
              >
                <Ionicons name="book" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.actionTitle}>Learn</Text>
              <Text style={styles.actionDesc}>Social skills courses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={[Colors.gradientPurple, Colors.gradientBlue]}
                style={styles.actionIcon}
              >
                <Ionicons name="people" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.actionTitle}>Community</Text>
              <Text style={styles.actionDesc}>Connect with others</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient
                colors={[Colors.gradientMint, Colors.accent]}
                style={styles.actionIcon}
              >
                <Ionicons name="ribbon" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.actionTitle}>Achievements</Text>
              <Text style={styles.actionDesc}>Track your progress</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  greeting: {
    ...Typography.bodySmall,
    color: Colors.gray500,
  },
  title: {
    ...Typography.h2,
    color: Colors.gray900,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginTop: Spacing.xs,
  },
  statsLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  seeAll: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  companionsContainer: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  companionCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginRight: Spacing.md,
  },
  companionAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  companionName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  companionTagline: {
    ...Typography.caption,
    color: Colors.gray500,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  actionTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  actionDesc: {
    ...Typography.caption,
    color: Colors.gray500,
    marginTop: 2,
  },
});

export default HomeScreen;
