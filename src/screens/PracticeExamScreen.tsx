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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { PRACTICE_EXAMS, QuizQuestion } from '../data/lessonData';
import { ProgressStorage, UserProgress, ExamScore } from './ClassroomScreen';

const { width } = Dimensions.get('window');

type ExamRouteParams = {
  PracticeExam: { examId: string };
};

type ExamStep = 'intro' | 'questions' | 'results';

const PracticeExamScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ExamRouteParams, 'PracticeExam'>>();
  const { examId } = route.params;

  const exam = PRACTICE_EXAMS.find(e => e.id === examId);

  const [step, setStep] = useState<ExamStep>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadProgress();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (exam && examStarted && step === 'questions') {
      // Parse duration (e.g., "15 min" -> 15 * 60 seconds)
      const durationMatch = exam.duration.match(/(\d+)/);
      const minutes = durationMatch ? parseInt(durationMatch[1]) : 15;
      setTimeRemaining(minutes * 60);

      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto-submit
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examStarted, step]);

  useEffect(() => {
    // Animate progress bar
    if (exam) {
      Animated.timing(progressAnim, {
        toValue: (currentQuestionIndex + 1) / exam.questions.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentQuestionIndex]);

  const loadProgress = async () => {
    const savedProgress = await ProgressStorage.getProgress();
    if (savedProgress) {
      setProgress(savedProgress);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartExam = () => {
    if (!exam) return;
    setAnswers(new Array(exam.questions.length).fill(null));
    setExamStarted(true);
    setStep('questions');
  };

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null || !exam) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
    setShowExplanation(true);

    const currentQuestion = exam.questions[currentQuestionIndex];
    if (selectedAnswer === currentQuestion.correctIndex) {
      setCorrectAnswers(prev => prev + 1);
      setEarnedPoints(prev => prev + currentQuestion.points);
    }
  };

  const handleNextQuestion = () => {
    if (!exam) return;

    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      handleFinishExam();
    }
  };

  const handleFinishExam = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    await saveExamScore();
    setStep('results');
  };

  const saveExamScore = async () => {
    if (!progress || !exam) return;

    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
    const scorePercent = Math.round((earnedPoints / totalPoints) * 100);
    const passed = scorePercent >= exam.passingScore;

    const existingExamScore = progress.examScores.find(e => e.examId === exam.id);

    const newExamScore: ExamScore = {
      examId: exam.id,
      score: scorePercent,
      passed,
      attempts: (existingExamScore?.attempts || 0) + 1,
      bestScore: Math.max(existingExamScore?.bestScore || 0, scorePercent),
      completedAt: new Date().toISOString(),
    };

    // Calculate XP earned
    const baseXP = passed ? 100 : 25;
    const bonusXP = scorePercent >= 90 ? 50 : scorePercent >= 80 ? 25 : 0;
    const totalXP = baseXP + bonusXP;

    const updatedProgress: UserProgress = {
      ...progress,
      totalXP: progress.totalXP + totalXP,
      level: Math.floor((progress.totalXP + totalXP) / 100) + 1,
      examScores: [
        ...progress.examScores.filter(e => e.examId !== exam.id),
        newExamScore,
      ],
      lastActivityDate: new Date().toISOString(),
    };

    await ProgressStorage.saveProgress(updatedProgress);
    setProgress(updatedProgress);
  };

  if (!exam) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Exam not found</Text>
      </SafeAreaView>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const totalQuestions = exam.questions.length;
  const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
  const scorePercent = Math.round((earnedPoints / totalPoints) * 100);
  const passed = scorePercent >= exam.passingScore;

  const renderIntro = () => (
    <View style={styles.introContainer}>
      <View style={styles.examIcon}>
        <Ionicons name="document-text" size={48} color={Colors.primary} />
      </View>

      <Text style={styles.examTitle}>{exam.title}</Text>
      <Text style={styles.examDescription}>{exam.description}</Text>

      <View style={styles.examDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={24} color={Colors.primary} />
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{exam.duration}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.detailLabel}>Questions</Text>
          <Text style={styles.detailValue}>{exam.totalQuestions}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Ionicons name="checkmark-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.detailLabel}>Pass Score</Text>
          <Text style={styles.detailValue}>{exam.passingScore}%</Text>
        </View>
      </View>

      <View style={styles.examRules}>
        <Text style={styles.rulesTitle}>Before You Begin</Text>
        <View style={styles.ruleItem}>
          <Ionicons name="checkmark" size={20} color={Colors.success} />
          <Text style={styles.ruleText}>Answer all questions to complete the exam</Text>
        </View>
        <View style={styles.ruleItem}>
          <Ionicons name="checkmark" size={20} color={Colors.success} />
          <Text style={styles.ruleText}>You'll see explanations after each answer</Text>
        </View>
        <View style={styles.ruleItem}>
          <Ionicons name="checkmark" size={20} color={Colors.success} />
          <Text style={styles.ruleText}>Score {exam.passingScore}% or higher to pass</Text>
        </View>
        <View style={styles.ruleItem}>
          <Ionicons name="checkmark" size={20} color={Colors.success} />
          <Text style={styles.ruleText}>You can retake the exam to improve your score</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartExam}
      >
        <Text style={styles.startButtonText}>Start Exam</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuestions = () => (
    <View style={styles.questionContainer}>
      {/* Timer */}
      <View style={[
        styles.timerBar,
        timeRemaining < 60 && styles.timerBarUrgent
      ]}>
        <Ionicons
          name="time"
          size={18}
          color={timeRemaining < 60 ? Colors.error : Colors.primary}
        />
        <Text style={[
          styles.timerText,
          timeRemaining < 60 && styles.timerTextUrgent
        ]}>
          {formatTime(timeRemaining)}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.questionProgress}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
        <Text style={styles.pointsText}>{currentQuestion.points} points</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Question */}
      <ScrollView style={styles.questionScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          {currentQuestion.audioContext && (
            <View style={styles.audioContext}>
              <Ionicons name="headset" size={16} color={Colors.primary} />
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
                  isSelected && !showExplanation && { backgroundColor: Colors.primary },
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
          <View style={[
            styles.explanationCard,
            selectedAnswer === currentQuestion.correctIndex
              ? styles.explanationCorrect
              : styles.explanationWrong
          ]}>
            <Ionicons
              name={selectedAnswer === currentQuestion.correctIndex ? "checkmark-circle" : "information-circle"}
              size={24}
              color={selectedAnswer === currentQuestion.correctIndex ? Colors.success : Colors.error}
            />
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {!showExplanation ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: selectedAnswer !== null ? Colors.primary : Colors.gray400 }
            ]}
            onPress={handleConfirmAnswer}
            disabled={selectedAnswer === null}
          >
            <Text style={styles.actionButtonText}>Confirm Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={handleNextQuestion}
          >
            <Text style={styles.actionButtonText}>
              {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Exam'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderResults = () => {
    const existingScore = progress?.examScores.find(e => e.examId === exam.id);

    return (
      <ScrollView style={styles.resultsScrollView} contentContainerStyle={styles.resultsContainer}>
        <View style={[styles.resultIcon, { backgroundColor: passed ? Colors.success : Colors.error }]}>
          <Ionicons name={passed ? "trophy" : "refresh"} size={56} color="white" />
        </View>

        <Text style={styles.resultTitle}>
          {passed ? 'Congratulations!' : 'Keep Practicing!'}
        </Text>

        <Text style={styles.resultSubtitle}>
          {passed
            ? `You passed the ${exam.title}!`
            : `You need ${exam.passingScore}% to pass. Review and try again!`}
        </Text>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.mainScore}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={[styles.scoreValue, { color: passed ? Colors.success : Colors.error }]}>
              {scorePercent}%
            </Text>
            <Text style={styles.passScore}>Passing: {exam.passingScore}%</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.statValue}>{correctAnswers}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="close-circle" size={24} color={Colors.error} />
            <Text style={styles.statValue}>{totalQuestions - correctAnswers}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.statValue}>+{passed ? 100 + (scorePercent >= 90 ? 50 : scorePercent >= 80 ? 25 : 0) : 25}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
        </View>

        {/* Best Score */}
        {existingScore && existingScore.bestScore > 0 && (
          <View style={styles.bestScoreCard}>
            <Ionicons name="medal" size={20} color="#FFD700" />
            <Text style={styles.bestScoreText}>
              Best Score: {existingScore.bestScore}% ({existingScore.attempts} attempts)
            </Text>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Back to Classroom</Text>
        </TouchableOpacity>

        {!passed && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setStep('intro');
              setCurrentQuestionIndex(0);
              setSelectedAnswer(null);
              setShowExplanation(false);
              setCorrectAnswers(0);
              setEarnedPoints(0);
              setAnswers([]);
              setExamStarted(false);
            }}
          >
            <Ionicons name="refresh" size={20} color={Colors.primary} />
            <Text style={styles.retryButtonText}>Retake Exam</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      {step !== 'results' && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exam.title}</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {/* Content */}
      {step === 'intro' && renderIntro()}
      {step === 'questions' && renderQuestions()}
      {step === 'results' && renderResults()}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  introContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  examIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  examTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  examDescription: {
    color: Colors.gray400,
    fontSize: 15,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  examDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    width: '100%',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    color: Colors.gray400,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  detailValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  detailDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: Spacing.sm,
  },
  examRules: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  rulesTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 10,
  },
  ruleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    flex: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    width: '100%',
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  backButtonText: {
    color: Colors.gray400,
    fontSize: 15,
  },
  questionContainer: {
    flex: 1,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  timerBarUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  timerText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  timerTextUrgent: {
    color: Colors.error,
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  questionProgress: {
    color: Colors.gray400,
    fontSize: 14,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  questionScrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
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
    borderColor: Colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
  actionContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsScrollView: {
    flex: 1,
  },
  resultsContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  resultTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultSubtitle: {
    color: Colors.gray400,
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  mainScore: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: Colors.gray400,
    fontSize: 14,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
  },
  passScore: {
    color: Colors.gray400,
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  statLabel: {
    color: Colors.gray400,
    fontSize: 12,
  },
  bestScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: 8,
  },
  bestScoreText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.md,
    gap: 8,
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

export default PracticeExamScreen;
