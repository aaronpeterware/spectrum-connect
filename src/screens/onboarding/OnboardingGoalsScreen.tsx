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
import {
  trackGoalsSelected,
  trackOnboardingStepBack,
  trackScreen,
} from '../../services/analyticsService';

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

type GoalOption = 'relationship' | 'friendship' | 'practice';

interface GoalChoice {
  id: GoalOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  color: string;
}

const GOAL_OPTIONS: GoalChoice[] = [
  {
    id: 'relationship',
    label: 'A Relationship',
    icon: 'heart',
    description: 'Looking for a romantic connection and potential partner',
    color: Colors.secondary,
  },
  {
    id: 'friendship',
    label: 'New Friends',
    icon: 'people',
    description: 'Looking for genuine friendships and connections',
    color: Colors.blue,
  },
  {
    id: 'practice',
    label: 'Practice Socializing',
    icon: 'chatbubbles',
    description: 'Practice conversation skills in a safe environment',
    color: Colors.accent,
  },
];

const OnboardingGoalsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { data, updateData, nextStep, prevStep, canProceed } = useOnboarding();

  // Track screen view on mount
  React.useEffect(() => {
    trackScreen('OnboardingGoals');
  }, []);

  const handleContinue = () => {
    trackGoalsSelected(data.goals);
    nextStep();
    navigation.navigate('Interests');
  };

  const handleBack = () => {
    trackOnboardingStepBack(3, 2);
    prevStep();
    navigation.goBack();
  };

  const toggleGoal = (option: GoalOption) => {
    const currentGoals = data.goals || [];
    if (currentGoals.includes(option)) {
      updateData({ goals: currentGoals.filter((g) => g !== option) });
    } else {
      updateData({ goals: [...currentGoals, option] });
    }
  };

  const isSelected = (option: GoalOption) => {
    return data.goals?.includes(option) || false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '84%' }]} />
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What are you looking for?</Text>
        <Text style={styles.subtitle}>
          Select all that apply. This helps us understand your goals on Haven.
        </Text>

        <View style={styles.options}>
          {GOAL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected(option.id) && styles.optionCardSelected,
                isSelected(option.id) && { borderColor: option.color },
              ]}
              onPress={() => toggleGoal(option.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isSelected(option.id) ? option.color : Colors.gray100 },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={28}
                  color={isSelected(option.id) ? Colors.surface : option.color}
                />
              </View>
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected(option.id) && { color: option.color },
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  isSelected(option.id) && { borderColor: option.color, backgroundColor: option.color },
                ]}
              >
                {isSelected(option.id) && (
                  <Ionicons name="checkmark" size={18} color={Colors.surface} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.note}>
          <Ionicons name="sparkles" size={20} color={Colors.primary} />
          <Text style={styles.noteText}>
            No pressure! Many people come here with multiple goals, and that's perfectly okay.
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
    backgroundColor: Colors.gray50,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
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
  optionDescription: {
    ...Typography.caption,
    color: Colors.gray500,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
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

export default OnboardingGoalsScreen;
