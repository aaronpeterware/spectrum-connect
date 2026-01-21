import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { MODULES, Lesson, ConversationScenario, QuizQuestion } from '../data/lessonData';
import { ProgressStorage, UserProgress, LessonProgress } from './ClassroomScreen';

const { width } = Dimensions.get('window');

type LessonRouteParams = {
  Lesson: { moduleId: string; lessonId: string };
};

type LessonStep = 'content' | 'scenarios' | 'quiz' | 'complete';

const LessonScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LessonRouteParams, 'Lesson'>>();
  const { moduleId, lessonId } = route.params;

  const module = MODULES.find(m => m.id === moduleId);
  const lesson = module?.lessons.find(l => l.id === lessonId);

  const [step, setStep] = useState<LessonStep>('content');
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    // Animate progress bar
    const totalSteps = 3;
    const currentStep = step === 'content' ? 0 : step === 'scenarios' ? 1 : step === 'quiz' ? 2 : 3;
    Animated.timing(progressAnim, {
      toValue: currentStep / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const loadProgress = async () => {
    const savedProgress = await ProgressStorage.getProgress();
    if (savedProgress) {
      setProgress(savedProgress);
    }
  };

  const saveQuizScore = async (score: number, correct: number, total: number) => {
    if (!progress || !lesson) return;

    const scorePercent = Math.round((correct / total) * 100);
    const existingLessonProgress = progress.lessonsCompleted.find(l => l.lessonId === lesson.id);

    const newLessonProgress: LessonProgress = {
      lessonId: lesson.id,
      completed: true,
      quizScore: scorePercent,
      quizAttempts: (existingLessonProgress?.quizAttempts || 0) + 1,
      bestScore: Math.max(existingLessonProgress?.bestScore || 0, scorePercent),
      completedAt: new Date().toISOString(),
    };

    // Calculate XP earned
    const baseXP = lesson.xpReward;
    const bonusXP = scorePercent >= 80 ? 20 : scorePercent >= 60 ? 10 : 0;
    const totalXP = existingLessonProgress?.completed ? bonusXP : baseXP + bonusXP;

    const updatedProgress: UserProgress = {
      ...progress,
      totalXP: progress.totalXP + totalXP,
      level: Math.floor((progress.totalXP + totalXP) / 100) + 1,
      lessonsCompleted: [
        ...progress.lessonsCompleted.filter(l => l.lessonId !== lesson.id),
        newLessonProgress,
      ],
      streakDays: progress.streakDays, // Would update based on daily activity
      lastActivityDate: new Date().toISOString(),
    };

    await ProgressStorage.saveProgress(updatedProgress);
    setProgress(updatedProgress);
  };

  if (!module || !lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Lesson not found</Text>
      </SafeAreaView>
    );
  }

  const currentScenario = lesson.scenarios[currentScenarioIndex];
  const currentQuestion = lesson.quiz[currentQuestionIndex];
  const totalQuestions = lesson.quiz.length;

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;

    setShowExplanation(true);
    if (selectedAnswer === currentQuestion.correctIndex) {
      setCorrectAnswers(prev => prev + 1);
      setQuizScore(prev => prev + currentQuestion.points);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz complete
      await saveQuizScore(quizScore, correctAnswers, totalQuestions);
      setStep('complete');
    }
  };

  const handleNextScenario = () => {
    if (currentScenarioIndex < lesson.scenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
    } else {
      setStep('quiz');
    }
  };

  const renderContent = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Intro */}
      <View style={styles.introCard}>
        <Ionicons name="bulb" size={24} color={module.color} />
        <Text style={styles.introText}>{lesson.content.intro}</Text>
      </View>

      {/* Key Points */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Points</Text>
        {lesson.content.keyPoints.map((point, index) => (
          <View key={index} style={styles.bulletPoint}>
            <View style={[styles.bullet, { backgroundColor: module.color }]} />
            <Text style={styles.bulletText}>{point}</Text>
          </View>
        ))}
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pro Tips</Text>
        {lesson.content.tips.map((tip, index) => (
          <View key={index} style={styles.tipCard}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Common Mistakes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Common Mistakes to Avoid</Text>
        {lesson.content.commonMistakes.map((mistake, index) => (
          <View key={index} style={styles.mistakeCard}>
            <Ionicons name="close-circle" size={20} color={Colors.error} />
            <Text style={styles.mistakeText}>{mistake}</Text>
          </View>
        ))}
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: module.color }]}
        onPress={() => setStep('scenarios')}
      >
        <Text style={styles.continueButtonText}>Continue to Examples</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderScenarios = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Scenario Header */}
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioCount}>
          Scenario {currentScenarioIndex + 1} of {lesson.scenarios.length}
        </Text>
        <Text style={styles.scenarioTitle}>{currentScenario.title}</Text>
        <Text style={styles.scenarioDescription}>{currentScenario.description}</Text>
      </View>

      {/* Setting */}
      <View style={styles.settingCard}>
        <Ionicons name="location" size={20} color={module.color} />
        <Text style={styles.settingText}>{currentScenario.setting}</Text>
      </View>

      {/* Transcript */}
      <View style={styles.transcriptCard}>
        <View style={styles.transcriptHeader}>
          <Ionicons name="chatbubbles" size={20} color={module.color} />
          <Text style={styles.transcriptTitle}>Conversation</Text>
        </View>
        <Text style={styles.transcriptText}>{currentScenario.transcript}</Text>
      </View>

      {/* Key Moments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Learning Moments</Text>
        {currentScenario.keyMoments.map((moment, index) => (
          <View key={index} style={styles.momentCard}>
            <View style={[styles.momentTime, { backgroundColor: module.color }]}>
              <Text style={styles.momentTimeText}>{moment.timestamp}</Text>
            </View>
            <View style={styles.momentContent}>
              <Text style={styles.momentDescription}>{moment.description}</Text>
              <View style={styles.skillBadge}>
                <Ionicons name="star" size={12} color={module.color} />
                <Text style={[styles.skillText, { color: module.color }]}>
                  {moment.skillDemonstrated}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: module.color }]}
        onPress={handleNextScenario}
      >
        <Text style={styles.continueButtonText}>
          {currentScenarioIndex < lesson.scenarios.length - 1 ? 'Next Scenario' : 'Start Quiz'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderQuiz = () => (
    <View style={styles.quizContainer}>
      {/* Question Counter */}
      <View style={styles.questionCounter}>
        <Text style={styles.questionCounterText}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
        <Text style={styles.pointsText}>{currentQuestion.points} points</Text>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        {currentQuestion.audioContext && (
          <View style={styles.audioContext}>
            <Ionicons name="headset" size={16} color={module.color} />
            <Text style={styles.audioContextText}>{currentQuestion.audioContext}</Text>
          </View>
        )}
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = showExplanation && index === currentQuestion.correctIndex;
          const isWrong = showExplanation && isSelected && index !== currentQuestion.correctIndex;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                isSelected && !showExplanation && styles.optionSelected,
                isCorrect && styles.optionCorrect,
                isWrong && styles.optionWrong,
              ]}
              onPress={() => handleAnswerSelect(index)}
              disabled={showExplanation}
            >
              <View style={[
                styles.optionLetter,
                isSelected && !showExplanation && { backgroundColor: module.color },
                isCorrect && { backgroundColor: Colors.success },
                isWrong && { backgroundColor: Colors.error },
              ]}>
                <Text style={[
                  styles.optionLetterText,
                  (isSelected || isCorrect || isWrong) && { color: 'white' }
                ]}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
              {isCorrect && <Ionicons name="checkmark-circle" size={24} color={Colors.success} />}
              {isWrong && <Ionicons name="close-circle" size={24} color={Colors.error} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Explanation */}
      {showExplanation && (
        <View style={[styles.explanationCard, selectedAnswer === currentQuestion.correctIndex ? styles.explanationCorrect : styles.explanationWrong]}>
          <Ionicons
            name={selectedAnswer === currentQuestion.correctIndex ? "checkmark-circle" : "information-circle"}
            size={24}
            color={selectedAnswer === currentQuestion.correctIndex ? Colors.success : Colors.error}
          />
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.quizActions}>
        {!showExplanation ? (
          <TouchableOpacity
            style={[
              styles.checkButton,
              { backgroundColor: selectedAnswer !== null ? module.color : Colors.gray400 }
            ]}
            onPress={handleCheckAnswer}
            disabled={selectedAnswer === null}
          >
            <Text style={styles.checkButtonText}>Check Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.checkButton, { backgroundColor: module.color }]}
            onPress={handleNextQuestion}
          >
            <Text style={styles.checkButtonText}>
              {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'See Results'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderComplete = () => {
    const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = scorePercent >= 70;

    return (
      <View style={styles.completeContainer}>
        <View style={[styles.completeIcon, { backgroundColor: passed ? Colors.success : Colors.error }]}>
          <Ionicons name={passed ? "trophy" : "refresh"} size={48} color="white" />
        </View>

        <Text style={styles.completeTitle}>
          {passed ? 'Great Job!' : 'Keep Practicing!'}
        </Text>

        <Text style={styles.completeSubtitle}>
          {passed
            ? 'You\'ve completed this lesson successfully!'
            : 'Review the material and try again to improve your score.'}
        </Text>

        <View style={styles.scoreCard}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={[styles.scoreValue, { color: passed ? Colors.success : Colors.error }]}>
              {scorePercent}%
            </Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Correct</Text>
            <Text style={styles.scoreValue}>{correctAnswers}/{totalQuestions}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>XP Earned</Text>
            <Text style={[styles.scoreValue, { color: '#FFD700' }]}>
              +{lesson.xpReward + (scorePercent >= 80 ? 20 : scorePercent >= 60 ? 10 : 0)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: module.color }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.completeButtonText}>Back to Classroom</Text>
        </TouchableOpacity>

        {!passed && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setStep('content');
              setCurrentQuestionIndex(0);
              setSelectedAnswer(null);
              setShowExplanation(false);
              setQuizScore(0);
              setCorrectAnswers(0);
            }}
          >
            <Text style={styles.retryButtonText}>Review Lesson</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
          <Text style={styles.headerSubtitle}>{module.title}</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.xpText}>{lesson.xpReward} XP</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: module.color,
            },
          ]}
        />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {['Learn', 'Examples', 'Quiz'].map((s, i) => {
          const stepIndex = step === 'content' ? 0 : step === 'scenarios' ? 1 : step === 'quiz' ? 2 : 3;
          const isActive = i <= stepIndex;
          const isCurrent = i === stepIndex;
          return (
            <View key={s} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                isActive && { backgroundColor: module.color },
                isCurrent && styles.stepDotCurrent,
              ]}>
                {isActive && i < stepIndex && (
                  <Ionicons name="checkmark" size={12} color="white" />
                )}
              </View>
              <Text style={[styles.stepText, isActive && { color: 'white' }]}>{s}</Text>
            </View>
          );
        })}
      </View>

      {/* Content */}
      {step === 'content' && renderContent()}
      {step === 'scenarios' && renderScenarios()}
      {step === 'quiz' && renderQuiz()}
      {step === 'complete' && renderComplete()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: Colors.gray400,
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    height: '100%',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 32,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCurrent: {
    transform: [{ scale: 1.2 }],
  },
  stepText: {
    color: Colors.gray400,
    fontSize: 11,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  introCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    gap: 12,
  },
  introText: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    lineHeight: 24,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 22,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  tipText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  mistakeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  mistakeText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    gap: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scenarioHeader: {
    marginTop: Spacing.md,
  },
  scenarioCount: {
    color: Colors.gray400,
    fontSize: 12,
  },
  scenarioTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  scenarioDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: 8,
  },
  settingText: {
    color: 'white',
    fontSize: 14,
  },
  transcriptCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  transcriptTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
  momentCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  momentTime: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  momentTimeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  momentContent: {
    flex: 1,
  },
  momentDescription: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quizContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  questionCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  questionCounterText: {
    color: Colors.gray400,
    fontSize: 14,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  audioContext: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  audioContextText: {
    color: Colors.gray400,
    fontSize: 13,
    fontStyle: 'italic',
  },
  questionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  optionsContainer: {
    marginTop: Spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  optionWrong: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
  },
  explanationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    gap: 12,
  },
  explanationCorrect: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  explanationWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  explanationText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    lineHeight: 22,
  },
  quizActions: {
    marginTop: 'auto',
    paddingVertical: Spacing.lg,
  },
  checkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  completeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  completeTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  completeSubtitle: {
    color: Colors.gray400,
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    width: '100%',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    color: Colors.gray400,
    fontSize: 12,
  },
  scoreValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  scoreDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  completeButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  retryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default LessonScreen;
