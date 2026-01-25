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
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
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
import { Asset } from 'expo-asset';

// Pre-generated audio file mapping
const AUDIO_ASSETS: Record<string, Record<number, any>> = {
  'audio_1_1': {
    0: require('../../assets/audio/scenarios/audio_1_1/segment_00.mp3'),
    1: require('../../assets/audio/scenarios/audio_1_1/segment_01.mp3'),
    2: require('../../assets/audio/scenarios/audio_1_1/segment_02.mp3'),
    3: require('../../assets/audio/scenarios/audio_1_1/segment_03.mp3'),
    4: require('../../assets/audio/scenarios/audio_1_1/segment_04.mp3'),
    5: require('../../assets/audio/scenarios/audio_1_1/segment_05.mp3'),
    6: require('../../assets/audio/scenarios/audio_1_1/segment_06.mp3'),
    7: require('../../assets/audio/scenarios/audio_1_1/segment_07.mp3'),
    8: require('../../assets/audio/scenarios/audio_1_1/segment_08.mp3'),
    9: require('../../assets/audio/scenarios/audio_1_1/segment_09.mp3'),
  },
  'audio_1_2': {
    0: require('../../assets/audio/scenarios/audio_1_2/segment_00.mp3'),
    1: require('../../assets/audio/scenarios/audio_1_2/segment_01.mp3'),
    2: require('../../assets/audio/scenarios/audio_1_2/segment_02.mp3'),
    3: require('../../assets/audio/scenarios/audio_1_2/segment_03.mp3'),
    4: require('../../assets/audio/scenarios/audio_1_2/segment_04.mp3'),
    5: require('../../assets/audio/scenarios/audio_1_2/segment_05.mp3'),
    6: require('../../assets/audio/scenarios/audio_1_2/segment_06.mp3'),
    7: require('../../assets/audio/scenarios/audio_1_2/segment_07.mp3'),
  },
  'audio_1_3': {
    0: require('../../assets/audio/scenarios/audio_1_3/segment_00.mp3'),
    1: require('../../assets/audio/scenarios/audio_1_3/segment_01.mp3'),
    2: require('../../assets/audio/scenarios/audio_1_3/segment_02.mp3'),
    3: require('../../assets/audio/scenarios/audio_1_3/segment_03.mp3'),
    4: require('../../assets/audio/scenarios/audio_1_3/segment_04.mp3'),
    5: require('../../assets/audio/scenarios/audio_1_3/segment_05.mp3'),
    6: require('../../assets/audio/scenarios/audio_1_3/segment_06.mp3'),
    7: require('../../assets/audio/scenarios/audio_1_3/segment_07.mp3'),
  },
  'audio_2_1': {
    0: require('../../assets/audio/scenarios/audio_2_1/segment_00.mp3'),
    1: require('../../assets/audio/scenarios/audio_2_1/segment_01.mp3'),
    2: require('../../assets/audio/scenarios/audio_2_1/segment_02.mp3'),
    3: require('../../assets/audio/scenarios/audio_2_1/segment_03.mp3'),
    4: require('../../assets/audio/scenarios/audio_2_1/segment_04.mp3'),
    5: require('../../assets/audio/scenarios/audio_2_1/segment_05.mp3'),
  },
  'audio_2_2': {
    0: require('../../assets/audio/scenarios/audio_2_2/segment_00.mp3'),
    1: require('../../assets/audio/scenarios/audio_2_2/segment_01.mp3'),
    2: require('../../assets/audio/scenarios/audio_2_2/segment_02.mp3'),
    3: require('../../assets/audio/scenarios/audio_2_2/segment_03.mp3'),
    4: require('../../assets/audio/scenarios/audio_2_2/segment_04.mp3'),
    5: require('../../assets/audio/scenarios/audio_2_2/segment_05.mp3'),
  },
};

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
  const [audioSegments, setAudioSegments] = useState<Array<{speaker: string, text: string, audioUrl: string}>>([]);
  const [audioFinished, setAudioFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const playbackRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Animation refs for audio visualizer
  const waveAnimations = useRef(
    [...Array(12)].map(() => new Animated.Value(0.3))
  ).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset all state when scenario changes
    setPhase('intro');
    setIsLoading(true);
    setIsGeneratingAudio(false);
    setIsPlaying(false);
    setCurrentLineIndex(0);
    setAudioProgress(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAudioSegments([]);
    setAudioFinished(false);
    setIsPaused(false);
    playbackRef.current.cancelled = true;

    // Stop any playing audio
    if (soundRef.current) {
      soundRef.current.stopAsync();
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    loadScenario();

    return () => {
      // Cleanup audio on unmount
      playbackRef.current.cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [scenarioId]);

  // Audio visualization animations
  useEffect(() => {
    if (isPlaying) {
      // Start wave animations
      const animations = waveAnimations.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.5 + Math.random() * 0.5,
              duration: 300 + Math.random() * 400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.3,
              duration: 300 + Math.random() * 400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
      });
      animations.forEach(anim => anim.start());

      // Pulse animation for the center circle
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Glow animation
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();

      return () => {
        animations.forEach(anim => anim.stop());
        pulse.stop();
        glow.stop();
      };
    } else {
      // Reset animations when not playing
      waveAnimations.forEach(anim => anim.setValue(0.3));
      pulseAnimation.setValue(1);
      glowAnimation.setValue(0);
    }
  }, [isPlaying]);

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
      // First try to load from local assets
      const localAudio = AUDIO_ASSETS[scenario.id];
      if (localAudio) {
        if (__DEV__) console.log('Found local audio for scenario:', scenario.id);
        setIsGeneratingAudio(false);
        await playLocalAudioSegments(scenario.id);
        return;
      }

      // Fall back to API if no local audio
      if (__DEV__) console.log('No local audio found, falling back to simulation');
      setIsGeneratingAudio(false);
      await simulateAudioPlayback();
    } catch (error) {
      if (__DEV__) console.log('Audio playback error:', error);
      setIsGeneratingAudio(false);
      await simulateAudioPlayback();
    }
  };

  // Play audio from local asset files
  const playLocalAudioSegments = async (scenarioId: string, startIndex = 0) => {
    if (!scenario) return;

    const audioAssets = AUDIO_ASSETS[scenarioId];
    if (!audioAssets) {
      await simulateAudioPlayback();
      return;
    }

    const segmentCount = Object.keys(audioAssets).length;
    setIsPlaying(true);
    setIsPaused(false);
    setAudioFinished(false);
    playbackRef.current.cancelled = false;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
      });

      for (let i = startIndex; i < segmentCount; i++) {
        if (playbackRef.current.cancelled) {
          break;
        }

        // Update UI to show current speaker
        const conversationIndex = Math.min(i, scenario.conversation.length - 1);
        setCurrentLineIndex(conversationIndex);
        setAudioProgress((i + 1) / segmentCount);

        if (__DEV__) console.log(`Playing local segment ${i + 1}/${segmentCount}`);

        const { sound } = await Audio.Sound.createAsync(
          audioAssets[i],
          { shouldPlay: true }
        );
        soundRef.current = sound;

        // Wait for this segment to finish
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (__DEV__) console.log(`Segment ${i} timed out`);
            sound.unloadAsync();
            resolve();
          }, 30000);

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) {
              clearTimeout(timeout);
              sound.unloadAsync();
              soundRef.current = null;
              resolve();
            }
            if (status.error) {
              clearTimeout(timeout);
              if (__DEV__) console.log(`Playback error for segment ${i}:`, status.error);
              sound.unloadAsync();
              soundRef.current = null;
              resolve();
            }
          });
        });
      }

      if (!playbackRef.current.cancelled) {
        setIsPlaying(false);
        setAudioFinished(true);
      }
    } catch (error) {
      if (__DEV__) console.log('Local audio playback error:', error);
      await simulateAudioPlayback();
    }
  };

  // Play audio from pre-generated URLs (no temp file needed)
  const playAudioFromUrls = async (segments: Array<{speaker: string, text: string, audioUrl: string}>, startIndex = 0) => {
    if (!scenario) return;

    // Store segments for replay
    setAudioSegments(segments);
    setIsPlaying(true);
    setIsPaused(false);
    setAudioFinished(false);
    playbackRef.current.cancelled = false;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
      });

      for (let i = startIndex; i < segments.length; i++) {
        // Check if playback was cancelled
        if (playbackRef.current.cancelled) {
          break;
        }

        // Update UI to show current speaker
        const conversationIndex = Math.min(i, scenario.conversation.length - 1);
        setCurrentLineIndex(conversationIndex);
        setAudioProgress((i + 1) / segments.length);

        if (__DEV__) console.log(`Playing segment ${i + 1}/${segments.length} from URL: ${segments[i].audioUrl}`);

        const { sound } = await Audio.Sound.createAsync(
          { uri: segments[i].audioUrl },
          { shouldPlay: true }
        );
        soundRef.current = sound;

        // Wait for this segment to finish
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (__DEV__) console.log(`Segment ${i} timed out`);
            sound.unloadAsync();
            resolve();
          }, 30000); // 30 second timeout per segment

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) {
              clearTimeout(timeout);
              sound.unloadAsync();
              soundRef.current = null;
              resolve();
            }
            if (status.error) {
              clearTimeout(timeout);
              if (__DEV__) console.log(`Playback error for segment ${i}:`, status.error);
              sound.unloadAsync();
              soundRef.current = null;
              reject(new Error(status.error));
            }
          });
        });
      }

      if (!playbackRef.current.cancelled) {
        setIsPlaying(false);
        setAudioFinished(true);
      }
    } catch (error) {
      if (__DEV__) console.log('URL audio playback error:', error);
      // Fallback to text simulation
      await simulateAudioPlayback();
    }
  };

  // Replay audio from beginning
  const replayAudio = () => {
    if (audioSegments.length > 0) {
      setCurrentLineIndex(0);
      setAudioProgress(0);
      playAudioFromUrls(audioSegments, 0);
    } else {
      generateAndPlayAudio();
    }
  };

  // Go to quiz
  const goToQuiz = () => {
    playbackRef.current.cancelled = true;
    if (soundRef.current) {
      soundRef.current.stopAsync();
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPhase('quiz');
  };

  const playAudioSegments = async (segments: Array<{speaker: string, audio: string}>) => {
    if (!scenario) return;

    setIsPlaying(true);

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
      });

      for (let i = 0; i < segments.length; i++) {
        // Update UI to show current speaker
        const conversationIndex = Math.min(i, scenario.conversation.length - 1);
        setCurrentLineIndex(conversationIndex);
        setAudioProgress((i + 1) / segments.length);

        // Write base64 audio to a temp file (expo-av doesn't support data URIs)
        const audioBase64 = segments[i].audio;
        const tempFilePath = `${FileSystem.cacheDirectory}audio_segment_${i}.mp3`;

        await FileSystem.writeAsStringAsync(tempFilePath, audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (__DEV__) console.log(`Playing segment ${i + 1}/${segments.length} from ${tempFilePath}`);

        const { sound } = await Audio.Sound.createAsync(
          { uri: tempFilePath },
          { shouldPlay: true }
        );

        // Wait for this segment to finish
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (__DEV__) console.log(`Segment ${i} timed out`);
            sound.unloadAsync();
            resolve();
          }, 30000); // 30 second timeout per segment

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) {
              clearTimeout(timeout);
              sound.unloadAsync();
              // Clean up temp file
              FileSystem.deleteAsync(tempFilePath, { idempotent: true }).catch(() => {});
              resolve();
            }
            if (status.error) {
              clearTimeout(timeout);
              if (__DEV__) console.log(`Playback error for segment ${i}:`, status.error);
              sound.unloadAsync();
              reject(new Error(status.error));
            }
          });
        });
      }

      setIsPlaying(false);
      setPhase('quiz');
    } catch (error) {
      if (__DEV__) console.log('Audio segment playback error:', error);
      // Fallback to text simulation
      await simulateAudioPlayback();
    }
  };

  const simulateAudioPlayback = async (startIndex = 0) => {
    // Text-based fallback that shows the conversation line by line
    if (!scenario) return;

    setIsPlaying(true);
    setIsPaused(false);
    playbackRef.current.cancelled = false;

    for (let i = startIndex; i < scenario.conversation.length; i++) {
      // Check if playback was cancelled or paused
      if (playbackRef.current.cancelled) {
        break;
      }

      setCurrentLineIndex(i);
      setAudioProgress((i + 1) / scenario.conversation.length);

      // Calculate delay based on text length (roughly 80ms per character)
      const line = scenario.conversation[i];
      const delay = Math.max(2500, line.text.length * 80);

      // Wait with ability to cancel
      await new Promise<void>(resolve => {
        const checkInterval = setInterval(() => {
          if (playbackRef.current.cancelled) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, delay);
      });
    }

    if (!playbackRef.current.cancelled) {
      setIsPlaying(false);
      setAudioFinished(true);
    }
  };

  const toggleSimulationPlayPause = () => {
    if (isPlaying) {
      // Pause
      playbackRef.current.cancelled = true;
      setIsPlaying(false);
      setIsPaused(true);
    } else {
      // Resume from current position
      setIsPaused(false);
      simulateAudioPlayback(currentLineIndex);
    }
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
        {/* Animated Background Gradient */}
        <LinearGradient
          colors={['#1A1A2E', '#2D1B4E', '#1A1A2E']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Animated Glow Circles */}
        <Animated.View
          style={[
            styles.glowCircle,
            styles.glowCircle1,
            {
              opacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3],
              }),
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.glowCircle,
            styles.glowCircle2,
            {
              opacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.15, 0.25],
              }),
            },
          ]}
        />

        {isGeneratingAudio ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingPulse}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Text style={styles.loadingText}>Preparing audio...</Text>
          </View>
        ) : (
          <>
            {/* Central Audio Visualizer */}
            <View style={styles.visualizerSection}>
              {/* Animated Ring */}
              <Animated.View
                style={[
                  styles.outerRing,
                  { transform: [{ scale: pulseAnimation }] },
                ]}
              >
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.3)']}
                  style={styles.outerRingGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </Animated.View>

              {/* Waveform Circle */}
              <View style={styles.waveformCircle}>
                <LinearGradient
                  colors={[Colors.primary, '#EC4899']}
                  style={styles.waveformCircleInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Animated Bars */}
                  <View style={styles.barsContainer}>
                    {waveAnimations.map((anim, i) => (
                      <Animated.View
                        key={i}
                        style={[
                          styles.waveBar,
                          {
                            transform: [{ scaleY: anim }],
                          },
                        ]}
                      />
                    ))}
                  </View>
                </LinearGradient>
              </View>

              {/* Speaker Badge */}
              <View style={styles.speakerBadge}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.9)', 'rgba(99, 102, 241, 0.9)']}
                  style={styles.speakerBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="person" size={16} color="white" />
                  <Text style={styles.speakerBadgeText}>{currentLine?.speaker}</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>
                  {currentLineIndex + 1} of {scenario.conversation.length}
                </Text>
                {currentLine?.emotion && (
                  <View style={styles.emotionBadge}>
                    <Text style={styles.emotionText}>{currentLine.emotion}</Text>
                  </View>
                )}
              </View>
              <View style={styles.progressBarContainer}>
                <LinearGradient
                  colors={[Colors.primary, '#EC4899']}
                  style={[styles.progressBar, { width: `${audioProgress * 100}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>

            {/* Transcript Card */}
            <View style={styles.transcriptCard}>
              <View style={styles.quoteIcon}>
                <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.transcriptText}>"{currentLine?.text}"</Text>
              {currentLine?.bodyLanguage && (
                <View style={styles.bodyLanguageContainer}>
                  <Ionicons name="eye-outline" size={14} color={Colors.gray400} />
                  <Text style={styles.bodyLanguageText}>{currentLine.bodyLanguage}</Text>
                </View>
              )}
            </View>

            {/* Control Buttons */}
            {audioFinished ? (
              <View style={styles.controlButtonsRow}>
                <TouchableOpacity
                  style={styles.replayButton}
                  onPress={replayAudio}
                >
                  <Ionicons name="refresh" size={22} color={Colors.primary} />
                  <Text style={styles.replayButtonText}>Replay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.continueToQuizButton}
                  onPress={goToQuiz}
                >
                  <LinearGradient
                    colors={[Colors.primary, '#8B5CF6']}
                    style={styles.continueToQuizGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.continueToQuizText}>Continue to Quiz</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.controlButtonsRow}>
                {/* Play/Pause Button */}
                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={toggleSimulationPlayPause}
                >
                  <LinearGradient
                    colors={[Colors.primary, '#8B5CF6']}
                    style={styles.playPauseGradient}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={32}
                      color="white"
                    />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Skip Button */}
                <TouchableOpacity
                  style={styles.skipButtonSmall}
                  onPress={goToQuiz}
                >
                  <Text style={styles.skipText}>Skip to Quiz</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            )}
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
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowCircle1: {
    width: 300,
    height: 300,
    backgroundColor: '#8B5CF6',
    top: '15%',
    left: '50%',
    marginLeft: -150,
  },
  glowCircle2: {
    width: 200,
    height: 200,
    backgroundColor: '#EC4899',
    bottom: '25%',
    right: -50,
  },
  loadingPulse: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  visualizerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  outerRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  outerRingGradient: {
    flex: 1,
    borderRadius: 100,
  },
  waveformCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  waveformCircleInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 80,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 60,
  },
  waveBar: {
    width: 6,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 3,
  },
  speakerBadge: {
    marginTop: Spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
  },
  speakerBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  speakerBadgeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    color: Colors.gray400,
    fontSize: 14,
  },
  emotionBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emotionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  transcriptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  quoteIcon: {
    marginBottom: Spacing.sm,
  },
  transcriptText: {
    color: 'white',
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  bodyLanguageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  bodyLanguageText: {
    color: Colors.gray400,
    fontSize: 14,
    flex: 1,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
  },
  skipButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    color: Colors.gray400,
    fontSize: 14,
  },
  playPauseButton: {
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playPauseGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: Spacing.md,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  replayButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  continueToQuizButton: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  continueToQuizGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  continueToQuizText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
