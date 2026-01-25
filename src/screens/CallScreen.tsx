import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useConversation } from '@elevenlabs/react-native';

import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { getCompanionById, COMPANIONS, buildSystemPrompt } from '../data/companions';
import { getLocalImage } from '../data/localImages';
import { usePurchases } from '../context/PurchaseContext';
import { API_CONFIG } from '../config/api';

// Memory Service
import {
  initMemoryDatabase,
  buildMemoryPromptSection,
  saveLearnedFact,
  saveConversationSummary,
  recordEmotionalState,
  saveUserName,
} from '../services/memoryService';

// ElevenLabs Voice Service
import {
  ConversationMessage,
  generateConversationSummary,
  extractFactsFromConversation,
} from '../services/elevenLabsVoice';

type RootStackParamList = {
  Call: { companionId: string };
};

type CallState = 'connecting' | 'connected' | 'speaking' | 'listening' | 'ended' | 'error';

// Response from the backend configuration endpoint
interface CompanionConfigResponse {
  success: boolean;
  agentId: string;
  config: {
    voiceId: string;
    language: string;
  };
  error?: string;
  message?: string;
}

// Fetch companion configuration from Vercel backend
const fetchCompanionConfig = async (
  companionId: string
): Promise<CompanionConfigResponse> => {
  const url = `${API_CONFIG.API_URL}/api/elevenlabs-agent`;
  console.log('[CallScreen] Fetching config from:', url, 'for companion:', companionId);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      companionId,
    }),
  });

  console.log('[CallScreen] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[CallScreen] Error response:', errorText);
    try {
      const error = JSON.parse(errorText);
      throw new Error(error.message || 'Failed to get companion configuration');
    } catch {
      throw new Error(`Failed to get companion configuration: ${errorText}`);
    }
  }

  const data = await response.json();
  console.log('[CallScreen] Config response:', data);
  return data;
};


const CallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Call'>>();
  const { trackVoiceCallUsage } = usePurchases();
  const companionId = route.params?.companionId || 'mia';

  // Get companion from new data structure
  const companion = getCompanionById(companionId) || COMPANIONS[0];

  const [callState, setCallState] = useState<CallState>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Message tracking for memory
  const messagesRef = useRef<ConversationMessage[]>([]);
  const callStartTimeRef = useRef<Date>(new Date());
  const isEndingCallRef = useRef(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ElevenLabs useConversation hook
  const conversation = useConversation({
    tokenFetchUrl: `${API_CONFIG.API_URL}/api/elevenlabs-agent`,
    onConnect: () => {
      console.log('[ElevenLabs] ✅ Connected successfully');
      setCallState('connected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Start call timer
      callStartTimeRef.current = new Date();
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    },
    onDisconnect: () => {
      const elapsed = Math.round((Date.now() - callStartTimeRef.current.getTime()) / 1000);
      console.log(`[ElevenLabs] ❌ Disconnected after ${elapsed}s, state: ${callState}, isEnding: ${isEndingCallRef.current}`);

      // Prevent recursive calls
      if (!isEndingCallRef.current && callState !== 'ended') {
        handleCallEnd();
      }
    },
    onMessage: (message: { message: string; source: string }) => {
      const msg: ConversationMessage = {
        role: message.source === 'user' ? 'user' : 'assistant',
        content: message.message,
        timestamp: new Date(),
      };

      messagesRef.current.push(msg);

      if (message.source === 'ai') {
        setCurrentMessage(message.message);
        // Clear message after delay
        setTimeout(() => setCurrentMessage(''), 3000);
      }

      console.log(`[ElevenLabs] 💬 [${msg.role}] ${msg.content.substring(0, 100)}...`);
    },
    onError: (message: string, context?: unknown) => {
      console.error('[ElevenLabs] ⚠️ Error:', message);
      console.error('[ElevenLabs] Error context:', JSON.stringify(context, null, 2));
      setCallState('error');
      Alert.alert('Connection Error', message || 'Failed to connect. Please try again.');
    },
    onModeChange: (mode: { mode: 'listening' | 'speaking' }) => {
      console.log('[ElevenLabs] 🎤 Mode changed to:', mode.mode);
      if (mode.mode === 'speaking') {
        setIsAISpeaking(true);
        setIsListening(false);
        setCallState('speaking');
      } else {
        setIsAISpeaking(false);
        setIsListening(true);
        setCallState('listening');
      }
    },
    onStatusChange: (status: { status: string }) => {
      console.log('[ElevenLabs] 📡 Status changed:', status.status);
    },
  });

  // Pulse animation for avatar
  useEffect(() => {
    if (callState === 'connected' || callState === 'speaking' || callState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [callState]);

  // Wave animation for speaking
  useEffect(() => {
    if (isAISpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveAnim.setValue(0);
    }
  }, [isAISpeaking]);

  // Auto-close when call ends
  useEffect(() => {
    if (callState === 'ended') {
      const timer = setTimeout(() => {
        navigation.goBack();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [callState, navigation]);

  // Initialize database and build prompt
  useEffect(() => {
    const setup = async () => {
      try {
        console.log('[CallScreen] 🚀 Starting setup...');

        // Initialize memory database
        await initMemoryDatabase();
        console.log('[CallScreen] ✅ Memory database initialized');

        // Build system prompt with memory context
        const memorySection = await buildMemoryPromptSection(companionId);
        const fullPrompt = memorySection
          ? buildSystemPrompt(companion, memorySection)
          : buildSystemPrompt(companion);

        setSystemPrompt(fullPrompt);
        console.log('[CallScreen] ✅ System prompt ready, length:', fullPrompt.length);

        // Request microphone permission
        console.log('[CallScreen] 🎤 Requesting microphone permission...');
        const { status } = await Audio.requestPermissionsAsync();
        console.log('[CallScreen] Microphone permission status:', status);

        if (status !== 'granted') {
          Alert.alert(
            'Microphone Permission Required',
            'Please enable microphone access in Settings to use voice calls.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        console.log('[CallScreen] ✅ Microphone permission granted');

        // Start the conversation with the built prompt
        await startConversationWithPrompt(fullPrompt);
      } catch (error) {
        console.error('[CallScreen] ❌ Setup error:', error);
        setCallState('error');
      }
    };

    setup();

    return () => {
      cleanup();
    };
  }, [companionId]);

  const startConversationWithPrompt = async (promptToUse: string) => {
    try {
      console.log('[CallScreen] 🎙️ Starting ElevenLabs conversation with', companion.name);

      // Get first message
      const firstMessage = getFirstMessage();
      console.log('[CallScreen] First message:', firstMessage);
      console.log('[CallScreen] System prompt length:', promptToUse.length, 'chars');

      // Fetch companion configuration from backend
      console.log('[CallScreen] Fetching companion config from backend...');
      const configResponse = await fetchCompanionConfig(companionId);

      if (!configResponse.success || !configResponse.agentId) {
        throw new Error(configResponse.message || 'Failed to get agent configuration');
      }

      console.log('[CallScreen] Got agent ID:', configResponse.agentId);
      console.log('[CallScreen] Voice ID:', configResponse.config.voiceId);

      console.log('[CallScreen] 🔌 Starting session with memory context...');
      console.log('[CallScreen] Prompt length:', promptToUse.length, 'chars');

      // Start with system prompt override to include memory context
      await conversation.startSession({
        agentId: configResponse.agentId,
        overrides: {
          agent: {
            prompt: {
              prompt: promptToUse,
            },
          },
        },
      });

      console.log('[CallScreen] ✅ Session started with memory-enhanced prompt');
    } catch (error) {
      console.error('[CallScreen] ❌ Failed to start conversation:', error);
      setCallState('error');
      const errorMessage = error instanceof Error ? error.message : 'Could not connect to voice service';
      Alert.alert('Connection Failed', `${errorMessage}. Please try again.`);
    }
  };

  const getFirstMessage = (): string => {
    const greetings: Record<string, string[]> = {
      mia: ["Hey! How's your day going?", "Hi there! Perfect timing for a chat."],
      sophie: ["Hey! Just got back from a dive. How are you?", "Hi! The ocean was amazing today."],
      emma_au: ["Hi! I was just reading something interesting. How are you?"],
      olivia_au: ["Hey love! How are you doing today?"],
      chloe: ["Hey! I was just playing some music. How are you?"],
      noah_au: ["Hey! Just taking a break from coding. What's up?"],
      liam_au: ["Hey! Just had a great flat white. How's your day?"],
      jack: ["Hey! I'm between services so perfect timing. How are you?"],
      ethan_au: ["Hey! Just had an awesome session in the water. How's it going?"],
      oliver: ["Hey there. How are you doing today?"],
      ava: ["Hey! Just wrapped rehearsal. What's going on with you?"],
      isabella: ["Hey! I was just lost in a manuscript. How are you?"],
      madison: ["Hey! Just finishing up a track. What's up?"],
      harper: ["Hey! Taking a break from designing. How's it going?"],
      ella: ["Hey there. How are you doing today?"],
      mason: ["Hey! Stepping away from work. How are you?"],
      lucas: ["Hey! Just finished teaching. How are you doing?"],
      james_us: ["Hey there. How are things with you?"],
      alexander: ["Hey! Taking a break from the game I'm working on. What's up?"],
      benjamin: ["Hey! Just put down the guitar. How are you?"],
    };

    const companionGreetings = greetings[companionId] || [
      `Hey! It's ${companion.name}. How are you doing?`,
    ];

    return companionGreetings[Math.floor(Math.random() * companionGreetings.length)];
  };

  const cleanup = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (conversation.status === 'connected') {
      conversation.endSession();
    }
  };

  const handleCallEnd = async () => {
    // Prevent recursive calls
    if (isEndingCallRef.current) {
      console.log('[CallScreen] Already ending call, skipping...');
      return;
    }
    isEndingCallRef.current = true;
    console.log('[CallScreen] 📞 Ending call...');

    // Stop timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    // End ElevenLabs session (only if connected)
    try {
      if (conversation.status === 'connected') {
        await conversation.endSession();
      }
    } catch (e) {
      console.log('[CallScreen] Error ending session:', e);
    }

    // Process conversation for memory
    await processConversationMemory();

    // Track usage
    if (callDuration > 0) {
      const trackResult = await trackVoiceCallUsage(callDuration);
      console.log(
        '[CallScreen] Usage tracked:',
        `${trackResult.momentsUsed} moments for ${Math.ceil(callDuration / 60)} min`
      );
    }

    setCallState('ended');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const processConversationMemory = async () => {
    const messages = messagesRef.current;

    if (messages.length === 0) {
      console.log('[CallScreen] No messages to process');
      return;
    }

    try {
      // Generate summary
      const { summary, keyTopics, mood } = generateConversationSummary(messages);

      // Save conversation summary
      await saveConversationSummary(companionId, callDuration, summary, mood, keyTopics);
      console.log('[CallScreen] Saved conversation summary');

      // Extract and save facts
      const facts = extractFactsFromConversation(messages);
      for (const fact of facts) {
        await saveLearnedFact(companionId, fact.fact, fact.importance, fact.category);
        console.log('[CallScreen] Saved fact:', fact.fact);

        // If it's a name fact, save to user name
        if (fact.fact.toLowerCase().includes("user's name is")) {
          const name = fact.fact.replace(/user's name is /i, '').trim();
          await saveUserName(companionId, name);
        }
      }

      // Record emotional state
      if (mood && mood !== 'neutral') {
        await recordEmotionalState(companionId, mood, summary);
      }

    } catch (error) {
      console.error('[CallScreen] Error processing memory:', error);
    }
  };

  const handleEndCall = async () => {
    await handleCallEnd();
  };

  const handleMuteToggle = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // ElevenLabs SDK should handle muting through its API
    // This is a UI state for now
    console.log('[CallScreen] Mute:', newMuted);
  };

  const handleSpeakerToggle = async () => {
    const newSpeaker = !isSpeakerOn;
    setIsSpeakerOn(newSpeaker);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: !newSpeaker,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callState) {
      case 'connecting':
        return 'Connecting...';
      case 'ended':
        return 'Call Ended';
      case 'error':
        return 'Connection Error';
      case 'speaking':
        return `${companion.name} is speaking...`;
      case 'listening':
        return 'Listening...';
      default:
        return 'Connected';
    }
  };

  const restartCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Reset state
    setCallState('connecting');
    setCallDuration(0);
    setCurrentMessage('');
    setIsAISpeaking(false);
    setIsListening(false);
    messagesRef.current = [];
    callStartTimeRef.current = new Date();
    isEndingCallRef.current = false;

    // Rebuild prompt with updated memory
    const memorySection = await buildMemoryPromptSection(companionId);
    const fullPrompt = memorySection
      ? buildSystemPrompt(companion, memorySection)
      : buildSystemPrompt(companion);
    setSystemPrompt(fullPrompt);

    // Start new conversation
    await startConversationWithPrompt(fullPrompt);
  };

  // Show loading state
  if (!companion) {
    return (
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Show error state
  if (callState === 'error') {
    return (
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.endedContainer}>
            <View style={styles.endedIconContainer}>
              <View style={[styles.endedIconCircle, { backgroundColor: Colors.error }]}>
                <Ionicons name="warning" size={48} color="white" />
              </View>
            </View>

            <Text style={styles.endedTitle}>Connection Error</Text>
            <Text style={styles.endedSubtitle}>Could not connect to {companion.name}</Text>

            <View style={styles.endedActions}>
              <TouchableOpacity style={styles.callAgainButton} onPress={restartCall}>
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.callAgainText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.goBack();
                }}
              >
                <Text style={styles.doneText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Show call ended screen briefly
  if (callState === 'ended') {
    return (
      <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.endedContainer}>
            <View style={styles.endedIconContainer}>
              <View style={styles.endedIconCircle}>
                <Ionicons
                  name="call"
                  size={48}
                  color="white"
                  style={{ transform: [{ rotate: '135deg' }] }}
                />
              </View>
            </View>

            <Text style={styles.endedTitle}>Call Ended</Text>
            <Text style={styles.endedSubtitle}>with {companion.name}</Text>

            {callDuration > 0 && (
              <Text style={styles.durationValue}>{formatDuration(callDuration)}</Text>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Main call screen
  return (
    <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.callStatus}>{getStatusText()}</Text>
          {callState !== 'connecting' && (
            <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          )}
        </View>

        {/* Avatar and Info */}
        <View style={styles.avatarSection}>
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View
              style={[
                styles.avatarRing,
                isAISpeaking && styles.avatarRingSpeaking,
                isListening && styles.avatarRingListening,
              ]}
            >
              <Image
                source={getLocalImage(companionId)}
                style={styles.avatar}
              />
            </View>
            {(isAISpeaking || isListening) && (
              <View style={styles.speakingIndicator}>
                <Animated.View
                  style={[
                    styles.wave,
                    {
                      opacity: waveAnim,
                      backgroundColor: isListening ? Colors.primary : Colors.success,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.wave,
                    styles.wave2,
                    {
                      opacity: waveAnim,
                      backgroundColor: isListening ? Colors.primary : Colors.success,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.wave,
                    styles.wave3,
                    {
                      opacity: waveAnim,
                      backgroundColor: isListening ? Colors.primary : Colors.success,
                    },
                  ]}
                />
              </View>
            )}
          </Animated.View>

          <Text style={styles.companionName}>{companion.name}</Text>
          <Text style={styles.companionLocation}>{companion.location}</Text>

          {currentMessage ? (
            <View style={styles.messageContainer}>
              <View style={styles.messageBubble}>
                <Text style={styles.currentMessageText}>"{currentMessage}"</Text>
              </View>
            </View>
          ) : (
            callState === 'connected' && (
              <View style={styles.messageContainer}>
                <Text style={styles.waitingText}>
                  {isListening ? 'Speak naturally...' : 'Start talking anytime'}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonMuted]}
            onPress={handleMuteToggle}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color="white" />
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
            <Ionicons name="call" size={32} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={handleSpeakerToggle}
          >
            <Ionicons
              name={isSpeakerOn ? 'volume-high' : 'volume-low'}
              size={28}
              color={isSpeakerOn ? Colors.primary : 'white'}
            />
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>
        </View>

        {/* Companion Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About {companion.name}</Text>
          <Text style={styles.infoText}>{companion.description}</Text>
          <View style={styles.interestTags}>
            {companion.interests.slice(0, 3).map((interest, idx) => (
              <View key={idx} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.h2,
    color: 'white',
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  callStatus: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
  callDuration: {
    ...Typography.h3,
    color: 'white',
    marginTop: Spacing.xs,
  },
  avatarSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: Colors.primary,
    padding: 4,
  },
  avatarRingSpeaking: {
    borderColor: Colors.success,
    borderWidth: 6,
  },
  avatarRingListening: {
    borderColor: Colors.primary,
    borderWidth: 6,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  speakingIndicator: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -40,
    flexDirection: 'row',
    gap: 4,
  },
  wave: {
    width: 8,
    height: 24,
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  wave2: {
    height: 32,
  },
  wave3: {
    height: 20,
  },
  companionName: {
    ...Typography.h1,
    color: 'white',
    marginTop: Spacing.xl,
  },
  companionLocation: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.xs,
  },
  messageContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    maxWidth: '90%',
  },
  messageBubble: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  currentMessageText: {
    ...Typography.body,
    color: 'white',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  waitingText: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  controlButtonMuted: {
    backgroundColor: Colors.error,
  },
  controlLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    position: 'absolute',
    bottom: -20,
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
  },
  infoTitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.body,
    color: 'white',
    marginBottom: Spacing.md,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  interestText: {
    ...Typography.caption,
    color: 'white',
  },
  // Call Ended Screen Styles
  endedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  endedIconContainer: {
    marginBottom: Spacing.xl,
  },
  endedIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endedTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: Spacing.xs,
  },
  endedSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.xl,
  },
  durationCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  durationInfo: {
    flex: 1,
  },
  durationLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  durationValue: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginTop: 2,
  },
  momentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  momentsText: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
  },
  endedCompanionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  endedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
  },
  endedCompanionInfo: {
    flex: 1,
  },
  endedCompanionName: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  endedCompanionLocation: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  endedActions: {
    width: '100%',
    gap: Spacing.md,
  },
  callAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  callAgainText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  doneText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
});

export default CallScreen;
