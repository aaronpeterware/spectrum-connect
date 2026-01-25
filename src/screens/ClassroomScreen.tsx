import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { MODULES as STATIC_MODULES, PRACTICE_EXAMS, Module } from '../data/lessonData';
import { fetchModules } from '../services/courseService';
import MenuModal from '../components/MenuModal';
import {
  getUserProgress,
  saveUserProgress,
  UserProgress,
  LessonProgress,
  ModuleProgress,
  ExamScore,
} from '../services/userProgressService';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

// Daily tips for the banner
const DAILY_TIPS = [
  { title: 'Active Listening', tip: 'Try nodding occasionally to show you\'re following the conversation.' },
  { title: 'Eye Contact', tip: 'Looking at someone\'s forehead or nose bridge can feel more comfortable than direct eye contact.' },
  { title: 'Taking Turns', tip: 'Count to 3 in your head after someone finishes speaking before you respond.' },
  { title: 'Body Language', tip: 'Open posture (uncrossed arms) signals that you\'re engaged and approachable.' },
  { title: 'Small Talk Starter', tip: 'Commenting on your shared environment is an easy way to start a conversation.' },
  { title: 'Managing Overwhelm', tip: 'It\'s okay to take a break. Saying "I need a moment" is perfectly acceptable.' },
  { title: 'Showing Interest', tip: 'Asking follow-up questions shows you\'re genuinely interested in what someone is saying.' },
];

// Re-export types for backwards compatibility
export type { UserProgress, LessonProgress, ModuleProgress, ExamScore };

// Legacy ProgressStorage for backwards compatibility (now uses cloud service)
export const ProgressStorage = {
  getProgress: getUserProgress,
  saveProgress: saveUserProgress,
};

// Module icons mapping
const MODULE_ICONS: Record<string, string> = {
  'module1': 'chatbubble',
  'module2': 'heart',
  'module3': 'people',
  'module4': 'sparkles',
};

// Module images (placeholder abstract images)
const MODULE_IMAGES: Record<string, string> = {
  'module1': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop',
  'module2': 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop',
  'module3': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop',
  'module4': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop',
};

const ClassroomScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>(STATIC_MODULES);
  const [menuVisible, setMenuVisible] = useState(false);
  const [dailyTip] = useState(() => DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)]);

  useEffect(() => {
    loadModules();
    loadProgress();
  }, []);

  const loadModules = async () => {
    try {
      const dynamicModules = await fetchModules();
      if (dynamicModules && dynamicModules.length > 0) {
        setModules(dynamicModules);
      }
    } catch (error) {
      console.log('Using static modules:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadModules();
      loadProgress();
    });
    return unsubscribe;
  }, [navigation]);

  const loadProgress = async () => {
    const savedProgress = await ProgressStorage.getProgress();
    if (savedProgress) {
      setProgress(savedProgress);
    } else {
      const initialProgress: UserProgress = {
        totalXP: 0,
        level: 1,
        lessonsCompleted: [],
        modulesProgress: modules.map(m => ({
          moduleId: m.id,
          lessonsCompleted: 0,
          totalLessons: m.lessons.length,
          examPassed: false,
        })),
        examScores: [],
        streakDays: 0,
      };
      setProgress(initialProgress);
      await ProgressStorage.saveProgress(initialProgress);
    }
    setLoading(false);
  };

  const getModuleCompletionPercent = (module: Module): number => {
    if (!progress) return 0;
    const completedLessons = module.lessons.filter(l =>
      progress.lessonsCompleted.some(lp => lp.lessonId === l.id && lp.completed)
    ).length;
    return Math.round((completedLessons / module.lessons.length) * 100);
  };

  const getCompletedLessonsCount = (module: Module): number => {
    if (!progress) return 0;
    return module.lessons.filter(l =>
      progress.lessonsCompleted.some(lp => lp.lessonId === l.id && lp.completed)
    ).length;
  };

  const navigateToModule = (module: Module) => {
    // Navigate to first incomplete lesson, or first lesson if all complete
    const firstIncompleteLesson = module.lessons.find(l =>
      !progress?.lessonsCompleted.some(lp => lp.lessonId === l.id && lp.completed)
    );
    const targetLesson = firstIncompleteLesson || module.lessons[0];
    navigation.navigate('Lesson', { moduleId: module.id, lessonId: targetLesson.id });
  };

  // Group modules by category
  const foundationsModules = modules.filter(m =>
    m.id === 'module1' || m.id === 'module2' || m.title.toLowerCase().includes('conversation') || m.title.toLowerCase().includes('cue')
  );
  const wellbeingModules = modules.filter(m =>
    !foundationsModules.includes(m)
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading your progress...</Text>
      </SafeAreaView>
    );
  }

  const renderModuleCard = (module: Module) => {
    const completionPercent = getModuleCompletionPercent(module);
    const completedCount = getCompletedLessonsCount(module);
    const totalCount = module.lessons.length;
    const iconName = MODULE_ICONS[module.id] || 'book';
    const imageUrl = MODULE_IMAGES[module.id];

    return (
      <TouchableOpacity
        key={module.id}
        style={[styles.moduleCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => navigateToModule(module)}
        activeOpacity={0.8}
      >
        <View style={styles.moduleCardContent}>
          <View style={styles.moduleCardLeft}>
            <View style={styles.moduleCardHeader}>
              <View style={styles.moduleIconSmall}>
                <Ionicons name={iconName as any} size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.moduleCardTitle, { color: colors.text }]}>{module.title}</Text>
            </View>
            <Text style={[styles.moduleCardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {module.description}
            </Text>
          </View>
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.moduleCardImage}
            />
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>PROGRESS</Text>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {completedCount}/{totalCount} lessons ({completionPercent}%)
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${completionPercent}%` }
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Learning Hub</Text>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Daily Tip Banner */}
        <View style={styles.dailyTipCard}>
          <View style={styles.dailyTipHeader}>
            <Ionicons name="bulb" size={20} color={Colors.primary} />
            <Text style={[styles.dailyTipLabel, { color: colors.text }]}>DAILY TIP</Text>
          </View>
          <Text style={[styles.dailyTipTitle, { color: colors.text }]}>{dailyTip.title}</Text>
          <Text style={[styles.dailyTipText, { color: colors.textSecondary }]}>{dailyTip.tip}</Text>
        </View>

        {/* Audio Lessons Feature Card */}
        <TouchableOpacity
          style={styles.audioLessonsCard}
          onPress={() => navigation.navigate('AudioLessons')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.audioLessonsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.audioLessonsIcon}>
              <Ionicons name="ear" size={24} color="white" />
            </View>
            <View style={styles.audioLessonsContent}>
              <View style={styles.audioLessonsHeader}>
                <Text style={styles.audioLessonsTitle}>Audio Lessons</Text>
                <View style={styles.newFeatureBadge}>
                  <Text style={styles.newFeatureText}>NEW</Text>
                </View>
              </View>
              <Text style={styles.audioLessonsDescription}>
                Listen to conversations and identify social cues
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Foundations Section */}
        {foundationsModules.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Foundations</Text>
            {foundationsModules.map(renderModuleCard)}
          </>
        )}

        {/* Social Well-being Section */}
        {wellbeingModules.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Social Well-being</Text>
            {wellbeingModules.map(renderModuleCard)}
          </>
        )}

        {/* Practice Exams Link */}
        <TouchableOpacity
          style={[styles.practiceExamsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => navigation.navigate('PracticeExam', { examId: PRACTICE_EXAMS[0]?.id })}
          activeOpacity={0.8}
        >
          <View style={styles.practiceExamsIcon}>
            <Ionicons name="clipboard" size={24} color={Colors.primary} />
          </View>
          <View style={styles.practiceExamsContent}>
            <Text style={[styles.practiceExamsTitle, { color: colors.text }]}>Practice Exams</Text>
            <Text style={[styles.practiceExamsDescription, { color: colors.textSecondary }]}>
              Test your knowledge with comprehensive assessments
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Stats Summary */}
        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{progress?.totalXP || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total XP</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {progress?.lessonsCompleted.filter(l => l.completed).length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lessons</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{progress?.streakDays || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
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
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerSpacer: {
    width: 44,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  // Daily Tip Card
  dailyTipCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  dailyTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dailyTipLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dailyTipTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  dailyTipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 22,
  },
  // Section Title
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
    letterSpacing: -0.3,
  },
  // Module Card
  moduleCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  moduleCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  moduleCardLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  moduleIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleCardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  moduleCardDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
  },
  moduleCardImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray700,
  },
  // Progress Section
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  // Audio Lessons Card
  audioLessonsCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  audioLessonsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  audioLessonsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  audioLessonsContent: {
    flex: 1,
  },
  audioLessonsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioLessonsTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  newFeatureBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newFeatureText: {
    color: '#1A1A2E',
    fontSize: 10,
    fontWeight: '800',
  },
  audioLessonsDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  // Practice Exams Card
  practiceExamsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  practiceExamsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  practiceExamsContent: {
    flex: 1,
  },
  practiceExamsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  practiceExamsDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 2,
  },
  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.gray400,
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default ClassroomScreen;
