import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
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

type GenderOption = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

interface GenderChoice {
  id: GenderOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const GENDER_OPTIONS: GenderChoice[] = [
  {
    id: 'male',
    label: 'Man',
    icon: 'male',
    description: 'I identify as male',
  },
  {
    id: 'female',
    label: 'Woman',
    icon: 'female',
    description: 'I identify as female',
  },
  {
    id: 'non-binary',
    label: 'Non-binary',
    icon: 'infinite',
    description: 'I identify outside the binary',
  },
  {
    id: 'prefer-not-to-say',
    label: 'Prefer not to say',
    icon: 'help',
    description: "I'd rather not specify",
  },
];

const OnboardingGenderScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { data, updateData, nextStep, prevStep, canProceed } = useOnboarding();

  const handleContinue = () => {
    nextStep();
    navigation.navigate('Seeking');
  };

  const handleBack = () => {
    prevStep();
    navigation.goBack();
  };

  const selectGender = (gender: GenderOption) => {
    updateData({ gender });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '56%' }]} />
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>I am a...</Text>
        <Text style={styles.subtitle}>
          This helps us show you relevant matches. You can update this later.
        </Text>

        <View style={styles.options}>
          {GENDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                data.gender === option.id && styles.optionCardSelected,
              ]}
              onPress={() => selectGender(option.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  data.gender === option.id && styles.iconContainerSelected,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={28}
                  color={data.gender === option.id ? Colors.surface : Colors.primary}
                />
              </View>
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionLabel,
                    data.gender === option.id && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {data.gender === option.id && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.note}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
          <Text style={styles.noteText}>
            Your identity is respected here. We're committed to creating a safe space for everyone.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !canProceed() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canProceed()}
        >
          <Text style={[styles.buttonText, !canProceed() && styles.buttonTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray600,
    marginBottom: Spacing.xl,
  },
  options: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.gray50,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray800,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    ...Typography.caption,
    color: Colors.gray500,
  },
  checkmark: {
    marginLeft: Spacing.sm,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  noteText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.gray200,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.surface,
  },
  buttonTextDisabled: {
    color: Colors.gray400,
  },
});

export default OnboardingGenderScreen;
