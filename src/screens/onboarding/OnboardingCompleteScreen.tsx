import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useOnboarding } from '../../context/OnboardingContext';
import { useUser } from '../../context/UserContext';
import { saveUserProfile, autoMatchNewUser } from '../../services/profileService';
import Paywall from '../../components/Paywall';
import {
  trackOnboardingCompleted,
  trackOnboardingError,
  trackScreen,
} from '../../services/analyticsService';

interface OnboardingCompleteScreenProps {
  onComplete: () => void;
}

const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({ onComplete }) => {
  const { data, prevStep } = useOnboarding();
  const { user, updateUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Track screen view on mount
  React.useEffect(() => {
    trackScreen('OnboardingComplete');
  }, []);

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Save profile to Supabase
      const profileData = {
        name: data.name,
        age: data.age,
        location: data.location,
        goals: data.goals,
        profilePhotos: data.profilePhotos,
        mainPhotoIndex: data.mainPhotoIndex,
        bio: data.bio,
        interests: data.interests,
        onboardingCompleted: true,
      };

      await saveUserProfile(profileData);

      // Update local user context - use selected main photo
      const mainPhoto = data.profilePhotos[data.mainPhotoIndex] || data.profilePhotos[0] || '';
      updateUser({
        name: data.name,
        profileImage: mainPhoto,
        profilePhotos: data.profilePhotos,
        age: data.age || undefined,
        location: data.location,
        bio: data.bio,
        interests: data.interests,
        goals: data.goals,
      });

      // Auto-match with fake profiles and other real users
      await autoMatchNewUser();

      // Track onboarding completed
      trackOnboardingCompleted();

      // Show paywall before navigating to main app
      setShowPaywall(true);
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Something went wrong. Please try again.');
      trackOnboardingError(5, 'save_profile_error', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const goalLabels: { [key: string]: string } = {
    relationship: 'A Relationship',
    friendship: 'New Friends',
    practice: 'Practice Socializing',
  };

  const handlePurchaseComplete = () => {
    setShowPaywall(false);
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '100%' }]} />
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[Colors.gradientPink, Colors.gradientPurple]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark" size={48} color={Colors.surface} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>
          Here's a summary of your profile. You can always update this later in settings.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.profileHeader}>
            {data.profilePhotos[0] ? (
              <Image source={{ uri: data.profilePhotos[0] }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={32} color={Colors.gray400} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{data.name}, {data.age}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={Colors.gray500} />
                <Text style={styles.location}>{data.location}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Goals</Text>
            <Text style={styles.summaryValue}>
              {data.goals.map(g => goalLabels[g] || g).join(', ')}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Photos</Text>
            <Text style={styles.summaryValue}>
              {data.profilePhotos.length} photo{data.profilePhotos.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interests</Text>
            <Text style={styles.summaryValue}>
              {data.interests.length} selected
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.readyMessage}>
          <Ionicons name="sparkles" size={24} color={Colors.primary} />
          <Text style={styles.readyText}>
            We've already found some great matches for you based on your preferences!
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <>
              <Text style={styles.buttonText}>Start Exploring</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <Paywall
          onPurchaseComplete={handlePurchaseComplete}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    marginHorizontal: Spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    ...Typography.bodySmall,
    color: Colors.gray500,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    flex: 1,
  },
  summaryValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray800,
    flex: 2,
    textAlign: 'right',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    width: '100%',
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    flex: 1,
  },
  readyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    width: '100%',
    gap: Spacing.sm,
  },
  readyText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.surface,
  },
});

export default OnboardingCompleteScreen;
