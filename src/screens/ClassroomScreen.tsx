import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { MODULES, PRACTICE_EXAMS, Module, Lesson } from '../data/lessonData';

const { width } = Dimensions.get('window');

// Progress storage
export const ProgressStorage = {
  async getProgress(): Promise<UserProgress | null> {
    try {
      const filePath = `${FileSystem.documentDirectory}classroom_progress.json`;
      const info = await FileSystem.getInfoAsync(filePath);
      if (!info.exists) return null;
      const data = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  async saveProgress(progress: UserProgress): Promise<void> {
    try {
      const filePath = `${FileSystem.documentDirectory}classroom_progress.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(progress));
    } catch (e) {
      if (__DEV__) console.log('Error saving progress:', e);
    }
  }
};

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  quizScore?: number;
  quizAttempts: number;
  bestScore: number;
  completedAt?: string;
}

export interface ModuleProgress {
  moduleId: string;
  lessonsCompleted: number;
  totalLessons: number;
  examScore?: number;
  examPassed: boolean;
}

export interface ExamScore {
  examId: string;
  score: number;
  passed: boolean;
  attempts: number;
  bestScore: number;
  completedAt?: string;
}

export interface UserProgress {
  totalXP: number;
  level: number;
  lessonsCompleted: LessonProgress[];
  modulesProgress: ModuleProgress[];
  examScores: ExamScore[];
  streakDays: number;
  lastActivityDate?: string;
}

const ClassroomScreen = () => {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'modules' | 'exams'>('modules');

  useEffect(() => {
    loadProgress();
  }, []);

  // Refresh progress when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProgress();
    });
    return unsubscribe;
  }, [navigation]);

  const loadProgress = async () => {
    const savedProgress = await ProgressStorage.getProgress();
    if (savedProgress) {
      setProgress(savedProgress);
    } else {
      // Initialize new progress
      const initialProgress: UserProgress = {
        totalXP: 0,
        level: 1,
        lessonsCompleted: [],
        modulesProgress: MODULES.map(m => ({
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

  const getLessonProgress = (lessonId: string): LessonProgress | undefined => {
    return progress?.lessonsCompleted.find(l => l.lessonId === lessonId);
  };

  const getModuleProgress = (moduleId: string): ModuleProgress | undefined => {
    return progress?.modulesProgress.find(m => m.moduleId === moduleId);
  };

  const getModuleCompletionPercent = (module: Module): number => {
    if (!progress) return 0;
    const completedLessons = module.lessons.filter(l =>
      progress.lessonsCompleted.some(lp => lp.lessonId === l.id && lp.completed)
    ).length;
    return Math.round((completedLessons / module.lessons.length) * 100);
  };

  const navigateToLesson = (module: Module, lesson: Lesson) => {
    navigation.navigate('Lesson', { moduleId: module.id, lessonId: lesson.id });
  };

  const navigateToExam = (examId: string) => {
    navigation.navigate('PracticeExam', { examId });
  };

  // Map module IDs to their corresponding practice exam IDs
  const getModuleExamId = (moduleId: string): string | null => {
    const examMap: Record<string, string> = {
      'module1': 'exam_conversation',
      'module2': 'exam_social_cues',
      'module3': 'exam_dating',
      'module4': 'exam_dating',
    };
    return examMap[moduleId] || null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Classroom</Text>
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.xpText}>{progress?.totalXP || 0} XP</Text>
        </View>
      </View>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <View style={styles.levelCard}>
          <Text style={styles.levelLabel}>Level</Text>
          <Text style={styles.levelNumber}>{progress?.level || 1}</Text>
        </View>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {progress?.lessonsCompleted.filter(l => l.completed).length || 0}
            </Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{progress?.streakDays || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {progress?.examScores.filter(e => e.passed).length || 0}
            </Text>
            <Text style={styles.statLabel}>Passed</Text>
          </View>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'modules' && styles.tabActive]}
          onPress={() => setActiveTab('modules')}
        >
          <Ionicons
            name="book"
            size={20}
            color={activeTab === 'modules' ? Colors.primary : Colors.gray400}
          />
          <Text style={[styles.tabText, activeTab === 'modules' && styles.tabTextActive]}>
            Modules
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'exams' && styles.tabActive]}
          onPress={() => setActiveTab('exams')}
        >
          <Ionicons
            name="clipboard"
            size={20}
            color={activeTab === 'exams' ? Colors.primary : Colors.gray400}
          />
          <Text style={[styles.tabText, activeTab === 'exams' && styles.tabTextActive]}>
            Practice Exams
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'modules' ? (
          <>
            {MODULES.map((module, index) => (
              <View key={module.id} style={styles.moduleCard}>
                <LinearGradient
                  colors={[module.color, `${module.color}CC`]}
                  style={styles.moduleHeader}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.moduleIconContainer}>
                    <Ionicons name={module.icon as any} size={28} color="white" />
                  </View>
                  <View style={styles.moduleInfo}>
                    <Text style={styles.moduleWeek}>{module.weekRange}</Text>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleDescription}>{module.description}</Text>
                  </View>
                  <View style={styles.moduleProgress}>
                    <Text style={styles.progressPercent}>
                      {getModuleCompletionPercent(module)}%
                    </Text>
                  </View>
                </LinearGradient>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${getModuleCompletionPercent(module)}%`, backgroundColor: module.color }
                    ]}
                  />
                </View>

                {/* Lessons */}
                <View style={styles.lessonsContainer}>
                  {module.lessons.map((lesson, lessonIndex) => {
                    const lessonProgress = getLessonProgress(lesson.id);
                    const isCompleted = lessonProgress?.completed;
                    const previousLesson = lessonIndex > 0 ? module.lessons[lessonIndex - 1] : null;
                    const isPreviousCompleted = !previousLesson || getLessonProgress(previousLesson.id)?.completed;
                    const isLocked = lessonIndex > 0 && !isPreviousCompleted;

                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        style={[
                          styles.lessonItem,
                          isCompleted && styles.lessonCompleted,
                          isLocked && styles.lessonLocked,
                        ]}
                        onPress={() => !isLocked && navigateToLesson(module, lesson)}
                        disabled={isLocked}
                      >
                        <View style={[styles.lessonNumber, isCompleted && { backgroundColor: module.color }]}>
                          {isCompleted ? (
                            <Ionicons name="checkmark" size={16} color="white" />
                          ) : isLocked ? (
                            <Ionicons name="lock-closed" size={14} color={Colors.gray400} />
                          ) : (
                            <Text style={styles.lessonNumberText}>{lessonIndex + 1}</Text>
                          )}
                        </View>
                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>
                            {lesson.title}
                          </Text>
                          <View style={styles.lessonMeta}>
                            <Ionicons name="time-outline" size={12} color={Colors.gray400} />
                            <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                            <Ionicons name="star-outline" size={12} color={Colors.gray400} style={{ marginLeft: 8 }} />
                            <Text style={styles.lessonXP}>{lesson.xpReward} XP</Text>
                          </View>
                          {lessonProgress?.bestScore !== undefined && lessonProgress.bestScore > 0 && (
                            <Text style={styles.lessonScore}>Best Quiz: {lessonProgress.bestScore}%</Text>
                          )}
                        </View>
                        <Ionicons
                          name={isLocked ? "lock-closed" : "chevron-forward"}
                          size={20}
                          color={isLocked ? Colors.gray400 : Colors.gray500}
                        />
                      </TouchableOpacity>
                    );
                  })}

                  {/* Module Exam */}
                  <TouchableOpacity
                    style={[
                      styles.lessonItem,
                      styles.examItem,
                      getModuleProgress(module.id)?.examPassed && styles.lessonCompleted,
                    ]}
                    onPress={() => {
                      const examId = getModuleExamId(module.id);
                      if (examId) navigateToExam(examId);
                    }}
                  >
                    <View style={[styles.lessonNumber, { backgroundColor: module.color }]}>
                      <Ionicons name="trophy" size={16} color="white" />
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>Module Exam</Text>
                      <Text style={styles.lessonDuration}>
                        {module.finalExam.length} questions
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray500} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            {/* Practice Exams */}
            <Text style={styles.sectionTitle}>Practice Exams</Text>
            <Text style={styles.sectionSubtitle}>
              Test your knowledge with comprehensive assessments
            </Text>

            {PRACTICE_EXAMS.map((exam) => {
              const examResult = progress?.examScores.find(e => e.examId === exam.id);
              return (
                <TouchableOpacity
                  key={exam.id}
                  style={styles.examCard}
                  onPress={() => navigateToExam(exam.id)}
                >
                  <View style={styles.examIconContainer}>
                    <Ionicons
                      name={examResult?.passed ? "checkmark-circle" : "clipboard-outline"}
                      size={32}
                      color={examResult?.passed ? Colors.success : Colors.primary}
                    />
                  </View>
                  <View style={styles.examInfo}>
                    <Text style={styles.examTitle}>{exam.title}</Text>
                    <Text style={styles.examDescription}>{exam.description}</Text>
                    <View style={styles.examMeta}>
                      <Ionicons name="time-outline" size={14} color={Colors.gray400} />
                      <Text style={styles.examMetaText}>{exam.duration}</Text>
                      <Ionicons name="help-circle-outline" size={14} color={Colors.gray400} style={{ marginLeft: 12 }} />
                      <Text style={styles.examMetaText}>{exam.totalQuestions}q</Text>
                      <Ionicons name="ribbon-outline" size={14} color={Colors.gray400} style={{ marginLeft: 12 }} />
                      <Text style={styles.examMetaText}>{exam.passingScore}%</Text>
                    </View>
                    {examResult && (
                      <View style={[styles.examResultBadge, examResult.passed ? styles.examPassed : styles.examFailed]}>
                        <Text style={styles.examResultText}>
                          {examResult.passed ? 'PASSED' : 'RETRY'} - {examResult.score}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

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
  },
  headerTitle: {
    ...Typography.h2,
    color: 'white',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  xpText: {
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 4,
  },
  progressSummary: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: 12,
  },
  levelCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  levelLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  levelNumber: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.gray400,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  tabText: {
    color: Colors.gray400,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  moduleCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  moduleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleInfo: {
    flex: 1,
    marginLeft: 16,
  },
  moduleWeek: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  moduleTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  moduleDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  moduleProgress: {
    alignItems: 'center',
  },
  progressPercent: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
  },
  lessonsContainer: {
    padding: Spacing.md,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    marginBottom: 8,
  },
  lessonCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  lessonLocked: {
    opacity: 0.5,
  },
  examItem: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberText: {
    color: 'white',
    fontWeight: '600',
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lessonTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  lessonTitleLocked: {
    color: Colors.gray400,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lessonDuration: {
    color: Colors.gray400,
    fontSize: 12,
    marginLeft: 4,
  },
  lessonXP: {
    color: Colors.gray400,
    fontSize: 12,
    marginLeft: 4,
  },
  lessonScore: {
    color: Colors.success,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Colors.gray400,
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: 12,
  },
  examIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  examInfo: {
    flex: 1,
    marginLeft: 16,
  },
  examTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  examDescription: {
    color: Colors.gray400,
    fontSize: 13,
    marginTop: 4,
  },
  examMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  examMetaText: {
    color: Colors.gray400,
    fontSize: 12,
    marginLeft: 4,
  },
  examResultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  examPassed: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  examFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  examResultText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
});

export default ClassroomScreen;
