import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useOnboarding } from '../../context/OnboardingContext';
import {
  trackInterestsSelected,
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

interface InterestCategory {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  interests: string[];
}

const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    title: 'Entertainment',
    icon: 'film-outline',
    interests: ['Movies', 'TV Shows', 'Anime', 'K-Drama', 'Documentaries', 'YouTube', 'Podcasts', 'Streaming'],
  },
  {
    title: 'Gaming',
    icon: 'game-controller-outline',
    interests: ['Video Games', 'PC Gaming', 'Console Gaming', 'Mobile Gaming', 'Board Games', 'Card Games', 'Tabletop RPGs', 'Chess'],
  },
  {
    title: 'Music',
    icon: 'musical-notes-outline',
    interests: ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Classical', 'Jazz', 'Indie', 'K-Pop', 'Metal', 'Lo-Fi'],
  },
  {
    title: 'Books & Learning',
    icon: 'book-outline',
    interests: ['Reading', 'Science Fiction', 'Fantasy', 'Non-Fiction', 'Manga', 'Comics', 'History', 'Philosophy', 'Psychology'],
  },
  {
    title: 'Technology',
    icon: 'laptop-outline',
    interests: ['Programming', 'AI & Machine Learning', 'Gadgets', 'Web Development', 'Cybersecurity', 'Open Source', 'Tech News'],
  },
  {
    title: 'Creative',
    icon: 'color-palette-outline',
    interests: ['Art', 'Drawing', 'Digital Art', 'Photography', 'Writing', 'Music Production', 'Crafts', 'DIY Projects'],
  },
  {
    title: 'Science & Nature',
    icon: 'flask-outline',
    interests: ['Space', 'Physics', 'Biology', 'Nature', 'Animals', 'Environment', 'Marine Life', 'Astronomy'],
  },
  {
    title: 'Lifestyle',
    icon: 'cafe-outline',
    interests: ['Cooking', 'Baking', 'Coffee', 'Tea', 'Food', 'Fitness', 'Yoga', 'Meditation', 'Self-Care'],
  },
  {
    title: 'Social',
    icon: 'people-outline',
    interests: ['Memes', 'Social Justice', 'LGBTQ+', 'Mental Health', 'Neurodiversity', 'Community', 'Volunteering'],
  },
  {
    title: 'Hobbies',
    icon: 'sparkles-outline',
    interests: ['Collecting', 'Puzzles', 'Trivia', 'Languages', 'Travel', 'Camping', 'Hiking', 'Gardening'],
  },
];

const OnboardingInterestsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { data, updateData, nextStep, prevStep } = useOnboarding();

  // Track screen view on mount
  React.useEffect(() => {
    trackScreen('OnboardingInterests');
  }, []);

  // Get unique categories for selected interests
  const getSelectedCategories = (): string[] => {
    const categories: string[] = [];
    INTEREST_CATEGORIES.forEach(category => {
      if (category.interests.some(interest => data.interests?.includes(interest))) {
        categories.push(category.title);
      }
    });
    return categories;
  };

  const handleContinue = () => {
    trackInterestsSelected(data.interests || [], getSelectedCategories());
    nextStep();
    navigation.navigate('Complete');
  };

  const handleBack = () => {
    trackOnboardingStepBack(4, 3);
    prevStep();
    navigation.goBack();
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = data.interests || [];
    if (currentInterests.includes(interest)) {
      updateData({ interests: currentInterests.filter((i) => i !== interest) });
    } else {
      updateData({ interests: [...currentInterests, interest] });
    }
  };

  const isSelected = (interest: string) => {
    return data.interests?.includes(interest) || false;
  };

  const selectedCount = data.interests?.length || 0;
  const canProceed = selectedCount >= 3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '92%' }]} />
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Select at least 3 interests to help us find people you'll click with.
        </Text>
        <View style={styles.counter}>
          <Text style={[styles.counterText, canProceed && styles.counterTextValid]}>
            {selectedCount} selected {selectedCount < 3 ? `(${3 - selectedCount} more needed)` : '✓'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {INTEREST_CATEGORIES.map((category) => (
          <View key={category.title} style={styles.category}>
            <View style={styles.categoryHeader}>
              <Ionicons name={category.icon} size={20} color={Colors.primary} />
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            <View style={styles.interestGrid}>
              {category.interests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestChip,
                    isSelected(interest) && styles.interestChipSelected,
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text
                    style={[
                      styles.interestText,
                      isSelected(interest) && styles.interestTextSelected,
                    ]}
                  >
                    {interest}
                  </Text>
                  {isSelected(interest) && (
                    <Ionicons name="checkmark" size={16} color={Colors.surface} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !canProceed && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canProceed}
        >
          <Text style={[styles.buttonText, !canProceed && styles.buttonTextDisabled]}>
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
  titleContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
  },
  counter: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  counterText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.gray600,
  },
  counterTextValid: {
    color: Colors.success,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  category: {
    marginBottom: Spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray800,
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
  },
  interestChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  interestText: {
    ...Typography.bodySmall,
    color: Colors.gray700,
  },
  interestTextSelected: {
    color: Colors.surface,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: Spacing.xs,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
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

export default OnboardingInterestsScreen;
