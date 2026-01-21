import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import {
  getAudioScenarioById,
  AudioScenario,
  AudioQuestion,
  VoiceLine,
  SocialCue
} from '../data/audioLessonData';
import { API_CONFIG } from '../config/api';
import { ProgressStorage, UserProgress, LessonProgress } from './ClassroomScreen';

const { width } = Dimensions.get('window');

type RouteParams = {
  AudioLesson: {
    scenarioId: string;
  };
};

type LessonPhase = 'intro' | 'listening' | 'quiz' | 'results';

const AudioLessonScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AudioLesson'>>();
  const { scenarioId } = route.params;

  const [scenario, setScenario] = useState<AudioScenario | null>(null);
  const [phase, setPhase] = useState<LessonPhase>('intro');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);

  // Audio
  const soundRef = useRef<Audio.Sound | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  useEffect(() => {
    loadScenario();
    return () => {
      // Cleanup audio on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [scenarioId]);

  const loadScenario = async () => {
    const data = getAudioScenarioById(scenarioId);
    if (data) {
      setScenario(data);
      setAnsweredQuestions(new Array(data.questions.length).fill(false));
    }
    setIsLoading(false);
  };

  const generateAndPlayAudio = async () => {
    if (!scenario) return;

    setIsGeneratingAudio(true);
    setPhase('listening');

    try {
      // Request audio generation from our API
      const response = await fetch(`${API_CONFIG.API_URL}/api/generate-conversation-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          conversation: scenario.conversation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();

      if (data.audioUrl) {
        setAudioUri(data.audioUrl);
        await playAudio(data.audioUrl);
      } else {
        // Fallback: simulate audio with text display
        await simulateAudioPlayback();
      }
    } catch (error) {
      if (__DEV__) console.log('Audio generation error:', error);
      // Fallback to text-based experience
      await simulateAudioPlayback();
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const simulateAudioPlayback = async () => {
    // Text-based fallback that shows the conversation line by line
    if (!scenario) return;

    setIsPlaying(true);

    for (let i = 0; i < scenario.conversation.length; i++) {
      setCurrentLineIndex(i);
      setAudioProgress((i + 1) / scenario.conversation.length);

      // Calculate delay based on text length (roughly 100ms per character)
      const line = scenario.conversation[i];
      const delay = Math.max(2000, line.text.length * 80);

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    setIsPlaying(false);
    setPhase('quiz');
  };

  const playAudio = async (uri: string) => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      if (__DEV__) console.log('Audio playback error:', error);
      await simulateAudioPlayback();
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.durationMillis) {
        setAudioProgress(status.positionMillis / status.durationMillis);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPhase('quiz');
      }
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !scenario) return;

    const question = scenario.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctIndex;

    if (isCorrect) {
      setScore(prev => prev + question.points);
    }

    const newAnswered = [...answeredQuestions];
    newAnswered[currentQuestionIndex] = true;
    setAnsweredQuestions(newAnswered);

    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    if (!scenario) return;

    if (currentQuestionIndex < scenario.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz complete
      setPhase('results');
      await saveProgress();
    }
  };

  const saveProgress = async () => {
    if (!scenario) return;

    try {
      const progress = await ProgressStorage.getProgress();
      if (!progress) return;

      const maxScore = scenario.questions.reduce((sum, q) => sum + q.points, 0);
      const percentScore = Math.round((score / maxScore) * 100);

      // Update or add lesson progress
      const existingIndex = progress.lessonsCompleted.findIndex(
        l => l.lessonId === scenario.id
      );

      const lessonProgress: LessonProgress = {
        lessonId: scenario.id,
        completed: true,
        quizScore: percentScore,
        quizAttempts: existingIndex >= 0
          ? progress.lessonsCompleted[existingIndex].quizAttempts + 1
          : 1,
        bestScore: existingIndex >= 0
          ? Math.max(progress.lessonsCompleted[existingIndex].bestScore, percentScore)
          : percentScore,
        completedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        progress.lessonsCompleted[existingIndex] = lessonProgress;
      } else {
        progress.lessonsCompleted.push(lessonProgress);
      }

      // Add XP
      const isFirstCompletion = existingIndex < 0;
      if (isFirstCompletion) {
        progress.totalXP += scenario.xpReward;
        // Level up every 500 XP
        progress.level = Math.floor(progress.totalXP / 500) + 1;
      }

      await ProgressStorage.saveProgress(progress);
    } catch (error) {
      if (__DEV__) console.log('Error saving progress:', error);
    }
  };

  const renderIntroPhase = () => {
    if (!scenario) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          {/* Scenario Info */}
          <View style={styles.scenarioHeader}>
            <View style={[styles.difficultyBadge,
              scenario.difficulty === 'beginner' && styles.difficultyBeginner,
              scenario.difficulty === 'intermediate' && styles.difficultyIntermediate,
              scenario.difficulty === 'advanced' && styles.difficultyAdvanced,
            ]}>
              <Text style={styles.difficultyText}>{scenario.difficulty}</Text>
            </View>
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={14} color={Colors.gray400} />
              <Text style={styles.durationText}>{scenario.duration}</Text>
            </View>
          </View>

          <Text style={styles.scenarioTitle}>{scenario.title}</Text>
          <Text style={styles.scenarioDescription}>{scenario.description}</Text>

          {/* Setting */}
          <View style={styles.settingCard}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.settingText}>{scenario.setting}</Text>
          </View>

          {/* Skills */}
          <Text style={styles.sectionTitle}>Skills You'll Practice</Text>
          <View style={styles.skillsContainer}>
            {scenario.skillsFocused.map((skill, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Ionicons name="headset" size={24} color={Colors.primary} />
            <Text style={styles.instructionsTitle}>How This Works</Text>
            <Text style={styles.instructionsText}>
              1. Listen carefully to the conversation{'\n'}
              2. Pay attention to tone, word choice, and cues described{'\n'}
              3. Answer questions about what you noticed{'\n'}
              4. Learn from the explanations
            </Text>
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={generateAndPlayAudio}
          >
            <LinearGradient
              colors={[Colors.primary, '#8B5CF6']}
              style={styles.startButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.startButtonText}>Start Listening</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* XP Reward */}
          <View style={styles.rewardBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rewardText}>{scenario.xpReward} XP</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderListeningPhase = () => {
    if (!scenario) return null;

    const currentLine = scenario.conversation[currentLineIndex];

    return (
      <View style={styles.listeningContainer}>
        {isGeneratingAudio ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Preparing audio...</Text>
          </View>
        ) : (
          <>
            {/* Audio Visualizer */}
            <View style={styles.audioVisualizer}>
              <View style={styles.waveformContainer}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveformBar,
                      isPlaying && {
                        height: 20 + Math.random() * 40,
                        backgroundColor: Colors.primary
                      }
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${audioProgress * 100}%` }]} />
            </View>

            {/* Current Speaker */}
            <View style={styles.speakerCard}>
              <View style={styles.speakerAvatar}>
                <Ionicons name="person" size={24} color="white" />
              </View>
              <View style={styles.speakerInfo}>
                <Text style={styles.speakerName}>{currentLine?.speaker}</Text>
                {currentLine?.emotion && (
                  <Text style={styles.speakerEmotion}>({currentLine.emotion})</Text>
                )}
              </View>
            </View>

            {/* Transcript */}
            <View style={styles.transcriptCard}>
              <Text style={styles.transcriptText}>"{currentLine?.text}"</Text>
              {currentLine?.bodyLanguage && (
                <Text style={styles.bodyLanguageText}>
                  <Ionicons name="eye" size={12} color={Colors.gray400} /> {currentLine.bodyLanguage}
                </Text>
              )}
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={togglePlayPause}
                disabled={!audioUri}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {/* Skip to Quiz */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setPhase('quiz')}
            >
              <Text style={styles.skipText}>Skip to Questions</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderQuizPhase = () => {
    if (!scenario) return null;

    const question = scenario.questions[currentQuestionIndex];
    const relatedCue = scenario.socialCues.find(c => c.id === question.relatedCue);

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.quizContainer}>
          {/* Progress */}
          <View style={styles.quizProgress}>
            <Text style={styles.quizProgressText}>
              Question {currentQuestionIndex + 1} of {scenario.questions.length}
            </Text>
            <View style={styles.quizProgressBar}>
              <View
                style={[
                  styles.quizProgressFill,
                  { width: `${((currentQuestionIndex + 1) / scenario.questions.length) * 100}%` }
                ]}
              />
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.context && (
              <Text style={styles.questionContext}>
                <Ionicons name="information-circle" size={14} color={Colors.gray400} /> {question.context}
              </Text>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctIndex;
              const showResult = showExplanation;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionSelected,
                    showResult && isCorrect && styles.optionCorrect,
                    showResult && isSelected && !isCorrect && styles.optionIncorrect,
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                >
                  <View style={[
                    styles.optionLetter,
                    isSelected && styles.optionLetterSelected,
                    showResult && isCorrect && styles.optionLetterCorrect,
                    showResult && isSelected && !isCorrect && styles.optionLetterIncorrect,
                  ]}>
                    <Text style={styles.optionLetterText}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}>
                    {option}
                  </Text>
                  {showResult && isCorrect && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit / Explanation */}
          {!showExplanation ? (
            <TouchableOpacity
              style={[styles.submitButton, selectedAnswer === null && styles.submitButtonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              <Text style={styles.submitButtonText}>Check Answer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.explanationContainer}>
              <View style={[
                styles.explanationHeader,
                selectedAnswer === question.correctIndex ? styles.explanationCorrect : styles.explanationIncorrect
              ]}>
                <Ionicons
                  name={selectedAnswer === question.correctIndex ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color="white"
                />
                <Text style={styles.explanationHeaderText}>
                  {selectedAnswer === question.correctIndex ? 'Correct!' : 'Not quite'}
                </Text>
                <Text style={styles.pointsText}>+{selectedAnswer === question.correctIndex ? question.points : 0} pts</Text>
              </View>

              <Text style={styles.explanationText}>{question.explanation}</Text>

              {relatedCue && (
                <View style={styles.cueCard}>
                  <Text style={styles.cueTitle}>The Social Cue</Text>
                  <Text style={styles.cueDescription}>{relatedCue.description}</Text>
                  <Text style={styles.cueSignificance}>
                    <Ionicons name="bulb" size={14} color="#FFD700" /> {relatedCue.significance}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
                <Text style={styles.nextButtonText}>
                  {currentQuestionIndex < scenario.questions.length - 1 ? 'Next Question' : 'See Results'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderResultsPhase = () => {
    if (!scenario) return null;

    const maxScore = scenario.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((score / maxScore) * 100);
    const passed = percentage >= 70;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.resultsContainer}>
          {/* Score Card */}
          <LinearGradient
            colors={passed ? [Colors.success, '#059669'] : [Colors.error, '#DC2626']}
            style={styles.scoreCard}
          >
            <Ionicons
              name={passed ? "trophy" : "refresh"}
              size={48}
              color="white"
            />
            <Text style={styles.scoreTitle}>
              {passed ? 'Great Job!' : 'Keep Practicing'}
            </Text>
            <Text style={styles.scoreValue}>{percentage}%</Text>
            <Text style={styles.scoreSubtext}>{score} / {maxScore} points</Text>
          </LinearGradient>

          {/* XP Earned */}
          {passed && (
            <View style={styles.xpEarnedCard}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.xpEarnedText}>+{scenario.xpReward} XP Earned!</Text>
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Key Takeaways</Text>
            {scenario.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setPhase('intro');
                setCurrentQuestionIndex(0);
                setScore(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
                setCurrentLineIndex(0);
                setAudioProgress(0);
              }}
            >
              <Ionicons name="refresh" size={20} color={Colors.primary} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!scenario) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Scenario not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.errorLink}>Go Back</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {phase === 'intro' && 'Audio Lesson'}
          {phase === 'listening' && 'Listen Carefully'}
          {phase === 'quiz' && 'Quiz Time'}
          {phase === 'results' && 'Results'}
        </Text>
        <View style={styles.headerRight}>
          {phase === 'quiz' && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>{score} pts</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      {phase === 'intro' && renderIntroPhase()}
      {phase === 'listening' && renderListeningPhase()}
      {phase === 'quiz' && renderQuizPhase()}
      {phase === 'results' && renderResultsPhase()}
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
    color: Colors.gray400,
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
  },
  errorLink: {
    color: Colors.primary,
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
    ...Typography.h3,
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  scoreBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgeText: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 14,
  },

  // Intro Phase
  introContainer: {
    padding: Spacing.lg,
  },
  scenarioHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyBeginner: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  difficultyIntermediate: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  difficultyAdvanced: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    color: Colors.gray400,
    fontSize: 14,
  },
  scenarioTitle: {
    ...Typography.h2,
    color: 'white',
    marginBottom: Spacing.sm,
  },
  scenarioDescription: {
    color: Colors.gray400,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  settingText: {
    color: 'white',
    fontSize: 15,
    flex: 1,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  skillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: 'white',
    fontSize: 13,
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  instructionsText: {
    color: Colors.gray400,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
  },
  startButton: {
    marginBottom: Spacing.md,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rewardText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },

  // Listening Phase
  listeningContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  audioVisualizer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 60,
  },
  waveformBar: {
    width: 4,
    height: 20,
    backgroundColor: Colors.gray600,
    borderRadius: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: Spacing.xl,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  speakerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  speakerEmotion: {
    color: Colors.gray400,
    fontSize: 14,
    fontStyle: 'italic',
  },
  transcriptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  transcriptText: {
    color: 'white',
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  bodyLanguageText: {
    color: Colors.gray400,
    fontSize: 14,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  skipText: {
    color: Colors.gray400,
    fontSize: 14,
  },

  // Quiz Phase
  quizContainer: {
    padding: Spacing.lg,
  },
  quizProgress: {
    marginBottom: Spacing.lg,
  },
  quizProgressText: {
    color: Colors.gray400,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  quizProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  quizProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  questionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  questionContext: {
    color: Colors.gray400,
    fontSize: 14,
    marginTop: Spacing.md,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: Spacing.lg,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
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
  optionIncorrect: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterSelected: {
    backgroundColor: Colors.primary,
  },
  optionLetterCorrect: {
    backgroundColor: Colors.success,
  },
  optionLetterIncorrect: {
    backgroundColor: Colors.error,
  },
  optionLetterText: {
    color: 'white',
    fontWeight: '600',
  },
  optionText: {
    color: 'white',
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  optionTextSelected: {
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray700,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  explanationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: 8,
  },
  explanationCorrect: {
    backgroundColor: Colors.success,
  },
  explanationIncorrect: {
    backgroundColor: Colors.error,
  },
  explanationHeaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  pointsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  explanationText: {
    color: Colors.gray300,
    fontSize: 15,
    lineHeight: 24,
    padding: Spacing.md,
  },
  cueCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  cueTitle: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cueDescription: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  cueSignificance: {
    color: Colors.gray400,
    fontSize: 13,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Results Phase
  resultsContainer: {
    padding: Spacing.lg,
  },
  scoreCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  scoreTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  scoreValue: {
    color: 'white',
    fontSize: 64,
    fontWeight: '800',
    marginVertical: Spacing.sm,
  },
  scoreSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  xpEarnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  xpEarnedText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  tipsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  tipText: {
    color: Colors.gray300,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
  },
  retryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AudioLessonScreen;
