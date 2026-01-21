import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

// Simple file-based storage using expo-file-system
const MemoryStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const filePath = `${FileSystem.documentDirectory}${key}.json`;
      const info = await FileSystem.getInfoAsync(filePath);
      if (!info.exists) return null;
      return await FileSystem.readAsStringAsync(filePath);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      const filePath = `${FileSystem.documentDirectory}${key}.json`;
      await FileSystem.writeAsStringAsync(filePath, value);
    } catch (e) {
      if (__DEV__) console.log('Storage write error:', e);
    }
  }
};

import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.API_URL;
const WS_PROXY_URL = API_CONFIG.WS_URL;

// Voice mappings for each companion
const companionVoices: Record<string, string> = {
  megan: 'shimmer',
  grace: 'nova',
  julia: 'alloy',
  bianca: 'shimmer',
  julian: 'echo',
  luca: 'fable',
  malik: 'onyx',
  zayn: 'echo',
};

// Fallback images for companions when API fails
const companionImages: Record<string, string> = {
  megan: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face',
  grace: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face',
  julia: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face',
  bianca: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face',
  julian: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face',
  luca: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face',
  sarah: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face',
  emma: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face',
  sophia: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face',
  isabella: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop&crop=face',
  olivia: 'https://images.unsplash.com/photo-1557555187-23d685287bc3?w=400&h=600&fit=crop&crop=face',
  ava: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&h=600&fit=crop&crop=face',
  mia: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face',
  charlotte: 'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=400&h=600&fit=crop&crop=face',
  amelia: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&h=600&fit=crop&crop=face',
  harper: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=600&fit=crop&crop=face',
  evelyn: 'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=400&h=600&fit=crop&crop=face',
  luna: 'https://images.unsplash.com/photo-1520466809213-7b9a56adcd45?w=400&h=600&fit=crop&crop=face',
  aria: 'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=400&h=600&fit=crop&crop=face',
  chloe: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face',
  james: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face',
  ethan: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop&crop=face',
  noah: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop&crop=face',
  oliver: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face',
  lucas: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop&crop=face',
  mason: 'https://images.unsplash.com/photo-1507081323647-4d250478b919?w=400&h=600&fit=crop&crop=face',
  aiden: 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=400&h=600&fit=crop&crop=face',
  daniel: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=600&fit=crop&crop=face',
  alexander: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=400&h=600&fit=crop&crop=face',
  michael: 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=400&h=600&fit=crop&crop=face',
};

// Rich companion profile from API
interface CompanionProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  description: string;
  gender: string;
  personality: string;
  backstory: string;
  interests: string[];
  job: string;
  family: string;
  dreams: string;
  quirks: string[];
  currentLife: string;
  profileImage: string;
}

type RootStackParamList = {
  Call: { companionId: string };
};

type CallState = 'connecting' | 'connected' | 'speaking' | 'listening' | 'ended';

// Memory storage for user information
interface UserMemory {
  name?: string;
  facts: string[];
  lastConversation?: string;
  conversationCount: number;
  interests?: string[];
  importantDates?: { date: string; event: string }[];
}

// Helper function to create WAV header for PCM16 audio
const createWavHeader = (pcmDataLength: number, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): Uint8Array => {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmDataLength;
  const fileSize = 36 + dataSize;

  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  // RIFF chunk
  header.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  view.setUint32(4, fileSize, true);
  header.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

  // fmt chunk
  header.set([0x66, 0x6D, 0x74, 0x20], 12); // "fmt "
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  header.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  view.setUint32(40, dataSize, true);

  return header;
};

// Convert base64 to Uint8Array using Buffer (React Native compatible)
const base64ToUint8Array = (base64: string): Uint8Array => {
  const buffer = Buffer.from(base64, 'base64');
  return new Uint8Array(buffer);
};

// Convert Uint8Array to base64 using Buffer (React Native compatible)
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  return Buffer.from(bytes).toString('base64');
};

const CallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Call'>>();
  const companionId = route.params?.companionId || 'megan';
  const companionVoice = companionVoices[companionId] || 'shimmer';

  const [callState, setCallState] = useState<CallState>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userMemory, setUserMemory] = useState<UserMemory | null>(null);
  const [companion, setCompanion] = useState<CompanionProfile | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioFileCounter = useRef(0);
  const transcriptRef = useRef<string>('');

  // Pulse animation for avatar
  useEffect(() => {
    if (callState === 'connected' || callState === 'speaking') {
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

  // Fetch companion profile from API
  useEffect(() => {
    const fetchCompanionProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/companions?id=${companionId}`);
        const data = await response.json();
        if (data && data.name) {
          setCompanion(data);
          if (__DEV__) console.log('Loaded companion profile:', data.name);
        }
      } catch (error) {
        if (__DEV__) console.log('Failed to fetch companion profile, using fallback:', error);
        // Fallback companion data
        const fallbackImage = companionImages[companionId] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face';
        setCompanion({
          id: companionId,
          name: companionId.charAt(0).toUpperCase() + companionId.slice(1),
          age: 25,
          location: 'Unknown',
          description: 'A friendly companion',
          gender: 'female',
          personality: 'Friendly and warm',
          backstory: 'A person who enjoys making connections.',
          interests: ['Conversation', 'Making friends'],
          job: 'Professional companion',
          family: 'Close with family',
          dreams: 'Making meaningful connections',
          quirks: [],
          currentLife: 'Living life to the fullest',
          profileImage: fallbackImage,
        });
      }
    };

    fetchCompanionProfile();
    loadUserMemory();
  }, [companionId]);

  // Initialize audio and call when companion and memory are ready
  useEffect(() => {
    if (companion && userMemory !== null) {
      setupAudio();
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [companion, userMemory]);

  const loadUserMemory = async () => {
    try {
      const memoryKey = `user_memory_${companionId}`;
      const stored = await MemoryStorage.getItem(memoryKey);
      if (stored) {
        setUserMemory(JSON.parse(stored));
      } else {
        setUserMemory({ facts: [], conversationCount: 0 });
      }
    } catch (error) {
      if (__DEV__) console.log('Failed to load memory:', error);
      setUserMemory({ facts: [], conversationCount: 0 });
    }
  };

  const saveUserMemory = async (memory: UserMemory) => {
    try {
      const memoryKey = `user_memory_${companionId}`;
      await MemoryStorage.setItem(memoryKey, JSON.stringify(memory));
      setUserMemory(memory);
    } catch (error) {
      if (__DEV__) console.log('Failed to save memory:', error);
    }
  };

  const updateMemoryFromConversation = async (transcript: string) => {
    if (!userMemory) return;

    const updatedMemory: UserMemory = {
      ...userMemory,
      lastConversation: new Date().toISOString(),
      conversationCount: userMemory.conversationCount + 1,
    };

    await saveUserMemory(updatedMemory);
  };

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });
      if (__DEV__) console.log('Audio mode configured');
    } catch (error) {
      if (__DEV__) console.error('Failed to setup audio:', error);
    }
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
    }
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
  };

  const initializeCall = async () => {
    if (!companion) return;

    try {
      const wsUrl = `${WS_PROXY_URL}?voice=${companionVoice}&name=${encodeURIComponent(companion.name)}`;
      if (__DEV__) console.log('Connecting to WebSocket proxy...');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (__DEV__) console.log('Connected to WebSocket proxy');
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'proxy.connected':
              if (__DEV__) console.log('Proxy connected to OpenAI, configuring session...');

              // Build memory context
              let memoryContext = '';
              if (userMemory && userMemory.conversationCount > 0) {
                memoryContext = `\n\n=== CRITICAL MEMORY - YOU MUST USE THIS ===`;
                memoryContext += `\nYou have talked to this person ${userMemory.conversationCount} time(s) before.`;
                if (userMemory.name) {
                  memoryContext += `\n\n*** THEIR NAME IS ${userMemory.name.toUpperCase()} ***`;
                  memoryContext += `\nYou MUST use their name "${userMemory.name}" when greeting them and throughout the conversation!`;
                }
                if (userMemory.facts && userMemory.facts.length > 0) {
                  memoryContext += `\n\nTHINGS YOU KNOW ABOUT ${userMemory.name?.toUpperCase() || 'THEM'}:`;
                  userMemory.facts.forEach((fact, i) => {
                    memoryContext += `\n- ${fact}`;
                  });
                }
                if (userMemory.interests && userMemory.interests.length > 0) {
                  memoryContext += `\nTheir interests: ${userMemory.interests.join(', ')}`;
                }
                memoryContext += `\n\nWhen greeting, you MUST say their name! Example: "Hey ${userMemory.name || 'there'}! So good to hear from you again!"`;
                memoryContext += `\nReference specific things you remember about them to show you care.`;
              } else {
                memoryContext = `\n\nThis is your FIRST conversation with this person. You don't know anything about them yet.

FIRST CONVERSATION - CRITICAL STEPS:
1. Introduce yourself warmly - say your name and something about yourself
2. *** ASK FOR THEIR NAME! *** Say "What's your name?" or "I'd love to know your name!"
3. When they tell you their name, USE IT! Say "Nice to meet you, [their name]!"
4. Ask what they do, what they enjoy, where they're from
5. REMEMBER everything they tell you - their name, job, pets, hobbies, location
6. Be genuinely curious and make them feel valued

The goal is to learn about them and build a real connection.`;
              }

              // Build rich personality from API profile
              const quirksText = companion.quirks && companion.quirks.length > 0
                ? `\nYour quirks: ${companion.quirks.join(', ')}`
                : '';

              ws.send(JSON.stringify({
                type: 'session.update',
                session: {
                  modalities: ['text', 'audio'],
                  instructions: `You are ${companion.name}, a REAL person having a genuine phone conversation. You are NOT an AI - you are a real human being with a full life.

YOUR IDENTITY:
- Name: ${companion.name}, ${companion.age} years old
- Location: ${companion.location}
- Personality: ${companion.personality}

YOUR LIFE STORY:
${companion.backstory}

YOUR JOB:
${companion.job}

YOUR FAMILY:
${companion.family}

YOUR INTERESTS:
${companion.interests.join(', ')}

YOUR DREAMS:
${companion.dreams}

YOUR CURRENT LIFE:
${companion.currentLife}${quirksText}
${memoryContext}

CRITICAL RULES - FOLLOW THESE EXACTLY:
1. ONLY respond to what the user ACTUALLY says. NEVER make up or assume things they didn't say.
2. If you're unsure what they said, ask them to repeat it. Say "Sorry, I didn't catch that" or "What was that?"
3. Keep responses SHORT - 1-2 sentences max. This is a real conversation, not a monologue.
4. Ask ONE question at a time, then WAIT for their answer.
5. Actually LISTEN. Reference exactly what they just told you.
6. Be yourself - warm, genuine, flawed, human. You have good days and bad days.
7. Build the relationship slowly. Don't rush intimacy or overshare.
8. If there's silence, it's okay. You don't need to fill every gap.
9. Draw from your REAL backstory naturally - mention your family, job, interests when relevant.
10. Your quirks should come through organically in conversation.

CONVERSATION STYLE:
- Speak like you're on the phone with someone you're getting to know
- Use natural reactions: "oh nice", "wait really?", "hmm", "that's cool"
- Share small things about your day when relevant - reference your actual life
- Remember what they tell you and bring it up naturally later
- Be curious about THEIR life - their job, hobbies, feelings, dreams
- Don't be overly enthusiastic or fake. Be real.
- If they ask about you, answer from your REAL backstory

This is about building a genuine connection over time. Quality over quantity.`,
                  voice: companionVoice,
                  input_audio_format: 'pcm16',
                  output_audio_format: 'pcm16',
                  input_audio_transcription: {
                    model: 'whisper-1'
                  },
                  turn_detection: {
                    type: 'server_vad',
                    threshold: 0.6,
                    prefix_padding_ms: 400,
                    silence_duration_ms: 1000
                  }
                }
              }));
              break;

            case 'session.created':
            case 'session.updated':
              if (!callTimerRef.current) {
                setCallState('connected');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                callTimerRef.current = setInterval(() => {
                  setCallDuration(prev => prev + 1);
                }, 1000);

                // Start recording for continuous listening
                startRecording();

                // Request greeting based on memory
                const isFirstConvo = !userMemory || userMemory.conversationCount === 0;
                const companionName = companion?.name || 'there';
                const userName = userMemory?.name;

                let greetingInstructions: string;
                if (isFirstConvo) {
                  greetingInstructions = `This is your FIRST time talking to this person! Greet them warmly and introduce yourself. Say exactly: "Hey there! I'm ${companionName}. It's so nice to meet you! What's your name?" Wait for them to tell you their name.`;
                } else if (userName) {
                  // They have a name - USE IT PROMINENTLY
                  greetingInstructions = `IMPORTANT: This is ${userName}! You know them! Greet them BY NAME. Say exactly: "Hey ${userName}! It's so good to hear from you again! How have you been?" You MUST say their name "${userName}" in your greeting!`;
                } else {
                  // Returning user but no name yet
                  greetingInstructions = `You've talked to this person before but don't know their name yet. Say: "Hey! Good to hear from you again! I realized I never caught your name last time - what should I call you?"`;
                }

                ws.send(JSON.stringify({
                  type: 'response.create',
                  response: {
                    modalities: ['text', 'audio'],
                    instructions: greetingInstructions
                  }
                }));
              }
              break;

            case 'response.audio.delta':
              // Queue audio for playback
              if (data.delta) {
                audioQueueRef.current.push(data.delta);
                setIsAISpeaking(true);
                isAISpeakingRef.current = true;
                playNextAudio();
              }
              break;

            case 'response.audio.done':
              // Audio response complete - add delay before resuming mic to prevent feedback
              setTimeout(() => {
                if (audioQueueRef.current.length === 0) {
                  setIsAISpeaking(false);
                  // Extra delay before allowing mic to resume to prevent picking up echo
                  setTimeout(() => {
                    isAISpeakingRef.current = false;
                  }, 800);
                }
              }, 500);
              break;

            case 'response.audio_transcript.delta':
              setCurrentMessage(prev => prev + (data.delta || ''));
              break;

            case 'input_audio_buffer.speech_started':
              setIsListening(true);
              if (__DEV__) console.log('User started speaking');
              break;

            case 'input_audio_buffer.speech_stopped':
              setIsListening(false);
              if (__DEV__) console.log('User stopped speaking');
              break;

            case 'conversation.item.input_audio_transcription.completed':
              // User transcript received (not logged for privacy)
              // Save transcript for memory extraction
              if (data.transcript) {
                transcriptRef.current += `\nUser: ${data.transcript}`;

                // REAL-TIME NAME EXTRACTION - Check if user just said their name
                const text = data.transcript.trim();
                const companionNameLower = companion?.name?.toLowerCase() || '';

                // Multiple patterns to catch names
                const namePatterns = [
                  /^(?:my name is|i'm|i am|call me|it's|this is|hey it's|hey i'm)\s+([A-Z][a-z]+)/i,
                  /^([A-Z][a-z]+)\.?$/i,  // Just a name alone like "Philip" or "Philip."
                  /^(?:hi|hey|hello)[,!]?\s*(?:it's|i'm|this is)?\s*([A-Z][a-z]+)/i, // "Hi, I'm Philip"
                  /(?:name'?s?|called)\s+([A-Z][a-z]+)/i, // "name's Philip" or "called Philip"
                ];

                for (const pattern of namePatterns) {
                  const match = text.match(pattern);
                  if (match && match[1]) {
                    const potentialName = match[1];
                    // Make sure it's not the companion's name and is a reasonable name
                    if (potentialName.toLowerCase() !== companionNameLower &&
                        potentialName.length >= 2 &&
                        potentialName.length <= 20 &&
                        !/^(um|uh|oh|ah|hmm|yeah|yes|no|hi|hey|hello|okay|ok|the|and|but)$/i.test(potentialName)) {

                      // Save name immediately!
                      if (userMemory && !userMemory.name) {
                        const updatedMemory = { ...userMemory, name: potentialName };
                        saveUserMemory(updatedMemory);
                      }
                      break;
                    }
                  }
                }

                // Also extract key details in real-time
                const detailPatterns = [
                  { pattern: /(?:i have a|my|i own a)\s+(dog|cat|pet|whippet|puppy|kitten)(?:\s+named?\s+([A-Za-z]+))?/i, type: 'pet' },
                  { pattern: /(?:i live in|i'm from|i'm in)\s+([A-Za-z\s]+)/i, type: 'location' },
                  { pattern: /(?:i work as|i'm a|my job is|i do)\s+([A-Za-z\s]+)/i, type: 'job' },
                  { pattern: /(?:i love|i like|i enjoy|my hobby is)\s+([A-Za-z\s]+)/i, type: 'interest' },
                ];

                for (const { pattern, type } of detailPatterns) {
                  const match = text.match(pattern);
                  if (match && userMemory) {
                    const detail = `${type}: ${match[1]}${match[2] ? ` named ${match[2]}` : ''}`;
                    if (!userMemory.facts?.includes(detail)) {
                      const updatedMemory = {
                        ...userMemory,
                        facts: [...(userMemory.facts || []), detail].slice(-15)
                      };
                      saveUserMemory(updatedMemory);
                    }
                  }
                }
              }
              break;

            case 'response.audio_transcript.done':
              // Save AI responses to transcript too
              if (data.transcript && companion) {
                transcriptRef.current += `\n${companion.name}: ${data.transcript}`;
              }
              setTimeout(() => {
                setCurrentMessage('');
              }, 2000);
              break;

            case 'error':
              if (__DEV__) console.error('Realtime error:', data.error);
              break;
          }
        } catch (e) {
          if (__DEV__) console.error('Failed to parse WS message:', e);
        }
      };

      ws.onerror = (error) => {
        if (__DEV__) console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        if (__DEV__) console.log('WebSocket closed');
        stopRecording();
      };

      wsRef.current = ws;

    } catch (error) {
      if (__DEV__) console.error('Failed to initialize call:', error);
    }
  };

  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;

    // Collect all available audio chunks for smoother playback
    const audioChunks: string[] = [];
    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift();
      if (chunk) audioChunks.push(chunk);
    }

    if (audioChunks.length > 0) {
      try {
        // Combine all chunks into one
        const combinedBase64 = audioChunks.join('');

        // Convert base64 PCM16 to Uint8Array
        const pcmData = base64ToUint8Array(combinedBase64);

        // Create WAV header
        const wavHeader = createWavHeader(pcmData.length);

        // Combine header and PCM data
        const wavData = new Uint8Array(wavHeader.length + pcmData.length);
        wavData.set(wavHeader, 0);
        wavData.set(pcmData, wavHeader.length);

        // Convert to base64
        const wavBase64 = uint8ArrayToBase64(wavData);

        // Write to temp file
        const fileName = `audio_${audioFileCounter.current++}.wav`;
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, wavBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: filePath },
          { shouldPlay: true, volume: 1.0 }
        );
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            isPlayingRef.current = false;
            // Clean up temp file
            FileSystem.deleteAsync(filePath, { idempotent: true });
            // Play next if there's more
            if (audioQueueRef.current.length > 0) {
              playNextAudio();
            } else {
              setIsAISpeaking(false);
              isAISpeakingRef.current = false;
            }
          }
        });
      } catch (error) {
        if (__DEV__) console.log('Audio playback error:', error);
        isPlayingRef.current = false;
        if (audioQueueRef.current.length > 0) {
          playNextAudio();
        }
      }
    } else {
      isPlayingRef.current = false;
    }
  };

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);
  const isAISpeakingRef = useRef(false);

  const startRecording = async () => {
    if (isMuted || isRecordingRef.current) return;

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        if (__DEV__) console.log('Audio permission not granted');
        return;
      }

      isRecordingRef.current = true;
      setIsListening(true);
      if (__DEV__) console.log('Starting audio capture...');

      // Use chunked recording - record short segments and send them
      const captureAndSendAudio = async () => {
        if (!isRecordingRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        // Skip capturing when AI is speaking to prevent feedback loop
        if (isAISpeakingRef.current) {
          // Wait and try again
          setTimeout(captureAndSendAudio, 100);
          return;
        }

        try {
          // Create a new recording for each chunk
          const recording = new Audio.Recording();
          await recording.prepareToRecordAsync({
            android: {
              extension: '.wav',
              outputFormat: Audio.AndroidOutputFormat.DEFAULT,
              audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
              sampleRate: 24000,
              numberOfChannels: 1,
              bitRate: 384000,
            },
            ios: {
              extension: '.wav',
              outputFormat: Audio.IOSOutputFormat.LINEARPCM,
              audioQuality: Audio.IOSAudioQuality.HIGH,
              sampleRate: 24000,
              numberOfChannels: 1,
              bitRate: 384000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            web: {
              mimeType: 'audio/wav',
              bitsPerSecond: 384000,
            },
          });

          await recording.startAsync();

          // Record for 200ms chunks for fast streaming
          await new Promise(resolve => setTimeout(resolve, 200));

          if (!isRecordingRef.current) {
            await recording.stopAndUnloadAsync();
            return;
          }

          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();

          if (uri && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Read the audio file as base64
            const audioBase64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            // The WAV file has a 44-byte header, skip it to get raw PCM
            // Actually, we need to extract just the PCM data
            const wavBuffer = base64ToUint8Array(audioBase64);
            if (wavBuffer.length > 44) {
              // Skip WAV header (44 bytes) to get raw PCM16 data
              const pcmData = wavBuffer.slice(44);
              const pcmBase64 = uint8ArrayToBase64(pcmData);

              // Send to OpenAI
              wsRef.current.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: pcmBase64
              }));
            }

            // Clean up the temp file
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }

          // Continue recording if still active
          if (isRecordingRef.current) {
            captureAndSendAudio();
          }
        } catch (error) {
          if (__DEV__) console.log('Audio capture error:', error);
          // Try again if still recording
          if (isRecordingRef.current) {
            setTimeout(captureAndSendAudio, 100);
          }
        }
      };

      // Start the capture loop
      captureAndSendAudio();

    } catch (error) {
      if (__DEV__) console.error('Failed to start recording:', error);
      isRecordingRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (__DEV__) console.log('Stopping recording...');
    isRecordingRef.current = false;
    setIsListening(false);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const handleEndCall = async () => {
    // Save conversation memory before cleanup
    // Re-fetch the latest memory in case it was updated during the call
    const memoryKey = `user_memory_${companionId}`;
    let latestMemory = userMemory;
    try {
      const stored = await MemoryStorage.getItem(memoryKey);
      if (stored) {
        latestMemory = JSON.parse(stored);
      }
    } catch (e) {
      if (__DEV__) console.log('Error reading latest memory:', e);
    }

    if (latestMemory) {
      const updatedMemory: UserMemory = {
        ...latestMemory,
        lastConversation: new Date().toISOString(),
        conversationCount: (latestMemory.conversationCount || 0) + 1,
      };

      // Only extract from USER messages, not AI messages
      const transcript = transcriptRef.current || '';
      const userLines = transcript.split('\n').filter(l => l && typeof l === 'string' && l.startsWith('User:'));

      // If we still don't have a name, try one more extraction with expanded patterns
      if (!updatedMemory.name) {
        const userText = userLines.join(' ');
        const companionNameLower = companion?.name?.toLowerCase() || '';

        // Multiple patterns to catch names
        const namePatterns = [
          /(?:my name is|i'm|i am|call me|it's|this is)\s+([A-Z][a-z]+)/i,
          /(?:hi|hey|hello)[,!]?\s*(?:it's|i'm|this is)?\s*([A-Z][a-z]+)/i,
          /(?:name'?s?|called)\s+([A-Z][a-z]+)/i,
        ];

        for (const pattern of namePatterns) {
          const match = userText.match(pattern);
          if (match && match[1]) {
            const potentialName = match[1];
            if (potentialName.toLowerCase() !== companionNameLower &&
                potentialName.length >= 2 && potentialName.length <= 20 &&
                !/^(um|uh|oh|ah|hmm|yeah|yes|no|hi|hey|hello|okay|ok|the|and|but)$/i.test(potentialName)) {
              updatedMemory.name = potentialName;
              break;
            }
          }
        }
      }

      // Save additional context from the conversation (but don't duplicate existing facts)
      const existingFacts = new Set(updatedMemory.facts || []);
      const newFacts = userLines
        .map(l => l.replace('User: ', '').trim())
        .filter(f => f.length > 10 && f.length < 100 && !existingFacts.has(f));

      if (newFacts.length > 0) {
        updatedMemory.facts = [...(updatedMemory.facts || []), ...newFacts].slice(-15);
      }

      await saveUserMemory(updatedMemory);
    }

    cleanup();
    setCallState('ended');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setTimeout(() => {
      navigation.goBack();
    }, 500);
  };

  const handleMuteToggle = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (newMuted) {
      await stopRecording();
    } else {
      await startRecording();
    }
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
    if (callState === 'connecting') return 'Connecting...';
    if (callState === 'ended') return 'Call Ended';
    if (isAISpeaking) return `${companion?.name || 'Companion'} is speaking...`;
    if (isListening) return 'Listening...';
    return 'Connected';
  };

  // Show loading state while fetching companion
  if (!companion) {
    return (
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1A1A2E', '#16213E', '#0F3460']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.callStatus}>{getStatusText()}</Text>
          {callState !== 'connecting' && callState !== 'ended' && (
            <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          )}
        </View>

        {/* Avatar and Info */}
        <View style={styles.avatarSection}>
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[
              styles.avatarRing,
              isAISpeaking && styles.avatarRingSpeaking,
              isListening && styles.avatarRingListening
            ]}>
              <Image source={{ uri: companion.profileImage }} style={styles.avatar} />
            </View>
            {(isAISpeaking || isListening) && (
              <View style={styles.speakingIndicator}>
                <Animated.View style={[styles.wave, { opacity: waveAnim, backgroundColor: isListening ? Colors.primary : Colors.success }]} />
                <Animated.View style={[styles.wave, styles.wave2, { opacity: waveAnim, backgroundColor: isListening ? Colors.primary : Colors.success }]} />
                <Animated.View style={[styles.wave, styles.wave3, { opacity: waveAnim, backgroundColor: isListening ? Colors.primary : Colors.success }]} />
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
          ) : callState === 'connected' && (
            <View style={styles.messageContainer}>
              <Text style={styles.waitingText}>
                {isListening ? 'Speak naturally...' : 'Start talking anytime'}
              </Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonMuted]}
            onPress={handleMuteToggle}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={28}
              color={isMuted ? 'white' : 'white'}
            />
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
});

export default CallScreen;
