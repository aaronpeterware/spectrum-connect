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

type SeekingOption = 'male' | 'female' | 'non-binary';

interface SeekingChoice {
  id: SeekingOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SEEKING_OPTIONS: SeekingChoice[] = [
  {
    id: 'male',
    label: 'Men',
    icon: 'male',
  },
  {
    id: 'female',
    label: 'Women',
    icon: 'female',
  },
  {
    id: 'non-binary',
    label: 'Non-binary people',
    icon: 'infinite',
  },
];

const OnboardingSeekingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { data, updateData, nextStep, prevStep, canProceed } = useOnboarding();

  const handleContinue = () => {
    nextStep();
    navigation.navigate('Goals');
  };

  const handleBack = () => {
    prevStep();
    navigation.goBack();
  };

  const toggleSeeking = (option: SeekingOption) => {
    const currentSeeking = data.seeking || [];
    if (currentSeeking.includes(option)) {
      updateData({ seeking: currentSeeking.filter((s) => s !== option) });
    } else {
      updateData({ seeking: [...currentSeeking, option] });
    }
  };

  const isSelected = (option: SeekingOption) => {
    return data.seeking?.includes(option) || false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '70%' }]} />
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>I'm looking to meet...</Text>
        <Text style={styles.subtitle}>
          Select all that apply. You can change this anytime in settings.
        </Text>

        <View style={styles.options}>
          {SEEKING_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected(option.id) && styles.optionCardSelected,
              ]}
              onPress={() => toggleSeeking(option.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected(option.id) && styles.iconContainerSelected,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={32}
                  color={isSelected(option.id) ? Colors.surface : Colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  isSelected(option.id) && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <View
                style={[
                  styles.checkbox,
                  isSelected(option.id) && styles.checkboxSelected,
                ]}
              >
                {isSelected(option.id) && (
                  <Ionicons name="checkmark" size={18} color={Colors.surface} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={Colors.blue} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Multi-selection enabled</Text>
            <Text style={styles.infoText}>
              You can select multiple options to see a diverse range of potential matches.
            </Text>
          </View>
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
    marginBottom: Spacing.xl,
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
  optionLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray800,
    flex: 1,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.blue,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray800,
    marginBottom: 4,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
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

export default OnboardingSeekingScreen;
