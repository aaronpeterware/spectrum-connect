import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useOnboarding } from '../../context/OnboardingContext';

type OnboardingStackParamList = {
  Welcome: undefined;
  Photo: undefined;
  Basics: undefined;
  Gender: undefined;
  Seeking: undefined;
  Goals: undefined;
  Interests: undefined;
  Complete: undefined;
};

const { width } = Dimensions.get('window');

const OnboardingWelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { nextStep } = useOnboarding();
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleGetStarted = () => {
    if (!acceptedTerms) return;
    nextStep();
    navigation.navigate('Photo');
  };

  const openTerms = () => {
    Linking.openURL('https://public-c1zlwa17m-hello-2125s-projects.vercel.app/terms.html');
  };

  const openPrivacy = () => {
    Linking.openURL('https://public-c1zlwa17m-hello-2125s-projects.vercel.app/privacy.html');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientPink, Colors.gradientPurple, Colors.gradientBlue]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="heart" size={64} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Welcome to{'\n'}Haven</Text>

          <Text style={styles.subtitle}>
            A safe space for neurodivergent individuals to connect, build meaningful relationships, and practice social skills.
          </Text>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.surface} />
              </View>
              <Text style={styles.featureText}>Safe & Understanding Community</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="people" size={24} color={Colors.surface} />
              </View>
              <Text style={styles.featureText}>Connect with Like-minded People</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="chatbubbles" size={24} color={Colors.surface} />
              </View>
              <Text style={styles.featureText}>Practice Conversations Safely</Text>
            </View>
          </View>

          {/* Terms Acceptance */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Ionicons name="checkmark" size={16} color={Colors.surface} />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={openTerms}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={openPrivacy}>Privacy Policy</Text>
              , including the community guidelines with zero tolerance for objectionable content or abusive behaviour.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !acceptedTerms && styles.buttonDisabled]}
            onPress={handleGetStarted}
            disabled={!acceptedTerms}
          >
            <Text style={[styles.buttonText, !acceptedTerms && styles.buttonTextDisabled]}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={acceptedTerms ? Colors.surface : Colors.gray400} />
          </TouchableOpacity>

          <Text style={styles.privacy}>
            You must accept the terms to continue
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    ...Typography.h1,
    fontSize: 32,
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.surface,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  features: {
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.surface,
    flex: 1,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    width: width - 48,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    ...Typography.bodySmall,
    color: Colors.surface,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    width: width - 48,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  buttonTextDisabled: {
    color: Colors.gray400,
  },
  privacy: {
    ...Typography.caption,
    color: Colors.surface,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});

export default OnboardingWelcomeScreen;
