import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { TypingIndicator } from '../components/ai/TypingIndicator';
import { CalmBackground } from '../components/backgrounds/CalmBackground';
import { getCompanionById, COMPANIONS } from '../data/companionProfiles';
import { getLocalImage } from '../data/localImages';

import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.API_URL;

// Suggested messages / icebreakers
const SUGGESTED_MESSAGES = {
  default: [
    "What's something you're really into lately?",
    "Tell me about your favorite way to relax",
    "What's your current hyperfixation?",
    "What made you smile today?",
  ],
  feelings: [
    "I'm feeling a bit anxious today",
    "I had a really good day!",
    "I'm not sure how I'm feeling",
    "Something's been on my mind",
  ],
  advice: [
    "Can you help me with something?",
    "What do you think about...",
    "I need some advice about socializing",
    "How do I handle awkward silences?",
  ],
  practice: [
    "Can we practice small talk?",
    "Help me prepare for a conversation",
    "Let's roleplay a social scenario",
    "How do I start a conversation?",
  ],
};

type RootStackParamList = {
  Companion: { companionId: string };
  Call: { companionId: string };
};

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type AIState = 'online' | 'thinking' | 'speaking' | 'listening';

const CompanionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Companion'>>();
  const companionId = route.params?.companionId || 'sophia';
  const companionProfile = getCompanionById(companionId) || COMPANIONS[0];
  const companion = {
    name: companionProfile.name,
    age: companionProfile.age,
    location: companionProfile.location,
    description: companionProfile.description,
    imageUrl: companionProfile.profileImage,
    gender: companionProfile.gender,
  };
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hey! I'm ${companion.name} from ${companion.location}. ${companion.description} What's on your mind?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [aiState, setAIState] = useState<AIState>('online');
  const [isTyping, setIsTyping] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionCategory, setSuggestionCategory] = useState<keyof typeof SUGGESTED_MESSAGES>('default');
  const inputRef = useRef<TextInput>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    // Show typing indicator
    setIsTyping(true);
    setAIState('thinking');

    try {
      // Build conversation history for API
      const conversationHistory = [
        ...messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
        { role: 'user', content: currentInput },
      ];

      // Call the Anthropic-powered API
      const response = await fetch(`${API_URL}/api/companion-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
          companionId: companionId,
          stream: false,
        }),
      });

      const data = await response.json();

      setAIState('speaking');

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || "I'm here for you. Tell me more.",
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);

      setTimeout(() => setAIState('online'), 1000);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      if (__DEV__) console.error('Chat API error:', error);
      setAIState('online');
      setIsTyping(false);

      // Fallback response if API fails
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Hmm, I'm having a little connection issue. Can you try saying that again?",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackResponse]);
    }
  };

  const toggleCalmMode = () => {
    setCalmMode(!calmMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputText(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
    // Cycle through suggestion categories
    if (!showSuggestions) {
      const categories = Object.keys(SUGGESTED_MESSAGES) as (keyof typeof SUGGESTED_MESSAGES)[];
      const currentIndex = categories.indexOf(suggestionCategory);
      const nextIndex = (currentIndex + 1) % categories.length;
      setSuggestionCategory(categories[nextIndex]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.aiMessage,
        ]}
      >
        {isUser ? (
          <LinearGradient
            colors={[Colors.gradientPurple, Colors.gradientBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userBubble}
          >
            <Text style={styles.userText}>{item.text}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>{item.text}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Calming animated background */}
      <CalmBackground calmMode={calmMode} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.gray700} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            {!imageError ? (
              <Image
                source={getLocalImage(companionId) || { uri: companion.imageUrl }}
                style={styles.headerAvatar}
                onError={() => setImageError(true)}
              />
            ) : (
              <LinearGradient
                colors={[Colors.gradientPink, Colors.gradientPurple]}
                style={styles.headerAvatar}
              >
                <Text style={styles.headerAvatarText}>{companion.name[0]}</Text>
              </LinearGradient>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{companion.name}</Text>
              <Text style={[styles.headerStatus, { color: getStatusColor(aiState) }]}>
                {getStatusText(aiState)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.callButton}
            onPress={() => navigation.navigate('Call', { companionId })}
          >
            <Ionicons name="call" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.calmButton, calmMode && styles.calmButtonActive]}
            onPress={toggleCalmMode}
          >
            <Ionicons name="moon" size={20} color={calmMode ? Colors.primary : Colors.gray500} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            isTyping ? <TypingIndicator calmMode={calmMode} /> : null
          }
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Suggestions / Icebreakers */}
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
                <Text style={styles.suggestionsLabel}>Suggestions</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScroll}
              >
                {SUGGESTED_MESSAGES[suggestionCategory].map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => handleSelectSuggestion(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.suggestionButton, showSuggestions && styles.suggestionButtonActive]}
              onPress={toggleSuggestions}
            >
              <Ionicons
                name="bulb"
                size={22}
                color={showSuggestions ? Colors.primary : Colors.gray400}
              />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.gray400}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={
                  inputText.trim()
                    ? [Colors.gradientPurple, Colors.gradientBlue]
                    : [Colors.gray300, Colors.gray300]
                }
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const getStatusColor = (state: AIState): string => {
  switch (state) {
    case 'thinking':
      return Colors.warning;
    case 'speaking':
      return Colors.primary;
    case 'listening':
      return Colors.blue;
    default:
      return Colors.success;
  }
};

const getStatusText = (state: AIState): string => {
  switch (state) {
    case 'thinking':
      return 'Thinking...';
    case 'speaking':
      return 'Speaking';
    case 'listening':
      return 'Listening...';
    default:
      return 'Online';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  headerInfo: {
    marginLeft: Spacing.sm,
  },
  headerName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  headerStatus: {
    ...Typography.caption,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  calmButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calmButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  calmButtonText: {
    fontSize: 18,
  },
  messagesList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  messageContainer: {
    marginBottom: Spacing.md,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  userBubble: {
    borderRadius: BorderRadius.xl,
    borderBottomRightRadius: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  userText: {
    ...Typography.body,
    color: 'white',
  },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  aiText: {
    ...Typography.body,
    color: Colors.gray800,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  // Suggestions styles
  suggestionsContainer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    gap: 6,
  },
  suggestionsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  suggestionsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.gray700,
    fontWeight: '500',
  },
  suggestionButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
  },
  suggestionButtonActive: {
    backgroundColor: `${Colors.primary}15`,
  },
});

export default CompanionScreen;
