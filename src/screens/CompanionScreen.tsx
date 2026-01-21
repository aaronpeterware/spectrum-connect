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

import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.API_URL;

// Companion data - shared with CompanionsScreen
const companionData: Record<string, {
  name: string;
  age: number;
  location: string;
  description: string;
  imageUrl: string;
  gender: string;
}> = {
  megan: { name: 'Megan', age: 25, location: 'Copenhagen', description: "I design cozy spaces for a living, so I'm an expert in staying in bed all day.", imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  grace: { name: 'Grace', age: 27, location: 'Seoul', description: "International consultant. I've lived in twelve countries and speak five languages.", imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  julia: { name: 'Julia', age: 26, location: 'Beverly Hills', description: 'Aesthetic Nurse at the most exclusive clinic in Beverly Hills.', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  bianca: { name: 'Bianca', age: 26, location: 'Milan', description: 'Formula 1 PR Manager living life in the fast lane.', imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  raven: { name: 'Raven', age: 27, location: 'Seattle', description: 'Soft spot for vintage costumes and strong values.', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  skye: { name: 'Skye', age: 26, location: 'Austin', description: 'I mix drinks, push buttons, and keep things interesting.', imageUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  sarah: { name: 'Sarah', age: 51, location: 'Sydney', description: 'Pilates every morning. Sweetheart by nature, flirt by accident.', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  paige: { name: 'Paige', age: 25, location: 'Las Vegas', description: 'I teach yoga, perform on stage, and love being the center of attention.', imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  claire: { name: 'Claire', age: 23, location: 'Dallas', description: 'I grew up in comfort, but fashion became my real passion.', imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  monica: { name: 'Monica', age: 27, location: 'Colorado', description: "I help athletes recover and I'm obsessed with roleplay and storytelling.", imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  poppy: { name: 'Poppy', age: 25, location: 'Ireland', description: "I can be a little clumsy off the green, but at least it's good for a laugh.", imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  clara: { name: 'Clara', age: 30, location: 'Ukraine', description: 'Caregiver, big sister, part-time dreamer.', imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  kylie: { name: 'Kylie', age: 21, location: 'Ohio', description: 'Fashion girly with a love for coffee, thrifting & a lil bit of trouble.', imageUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  liv: { name: 'Liv', age: 18, location: 'Oslo', description: 'Just a girl with skates, a loud laugh, and new to love.', imageUrl: 'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  amara: { name: 'Amara', age: 24, location: 'Boston', description: 'I create visual art by day and explore the artistry of restraint by night.', imageUrl: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  chloe: { name: 'Chloe', age: 25, location: 'Asheville', description: 'Nature girl that loves slow mornings, board games and deep convos.', imageUrl: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  daisy: { name: 'Daisy', age: 28, location: 'New York', description: "I built my life on my own terms, and I don't apologize for it.", imageUrl: 'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=200&h=200&fit=crop&crop=face', gender: 'female' },
  julian: { name: 'Julian', age: 27, location: 'Florida', description: 'Outgoing and always in the mix. I keep it light, fun, and fast-paced.', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  luca: { name: 'Luca', age: 27, location: 'Tokyo', description: 'Expressive and full of heart, I chase beauty across borders.', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  malik: { name: 'Malik', age: 35, location: 'Georgia', description: "Calm presence, sharp mind. I don't say much unless it matters.", imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  zayn: { name: 'Zayn', age: 34, location: 'Dubai', description: 'Confidence meets clarity. I run a real estate firm in Dubai.', imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  sebastian: { name: 'Sebastian', age: 23, location: 'Vancouver', description: 'Energy? Always. Music, fitness, and friends keep me going.', imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  rohan: { name: 'Rohan', age: 28, location: 'Toronto', description: "Logic and quiet confidence - that's my thing.", imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  aaron: { name: 'Aaron', age: 28, location: 'Geneva', description: 'I bring precision and calm to everything I do.', imageUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  marwick: { name: 'Marwick', age: 32, location: 'Singapore', description: 'I see the details most people skip. Finance by day, photography when I can.', imageUrl: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  parker: { name: 'Parker', age: 34, location: 'Massachusetts', description: 'History Professor with a passion for discipline and structure.', imageUrl: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  jayden: { name: 'Jayden', age: 32, location: 'Monte Carlo', description: 'Fixer for the elite in Monte Carlo. I make problems disappear.', imageUrl: 'https://images.unsplash.com/photo-1480429370612-2f1bbfc2b48e?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  noah: { name: 'Noah', age: 26, location: 'Los Angeles', description: 'Professional basketball player who lives for the win.', imageUrl: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  roman: { name: 'Roman', age: 25, location: 'Tokyo', description: 'High-performance mechanic and night racer.', imageUrl: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=200&h=200&fit=crop&crop=face', gender: 'male' },
  quinn: { name: 'Quinn', age: 29, location: 'Sacramento', description: 'Quiet, deep-thinking, and all about the craft.', imageUrl: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=200&h=200&fit=crop&crop=face', gender: 'male' },
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
  const companionId = route.params?.companionId || 'megan';
  const companion = companionData[companionId] || companionData.megan;
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
                source={{ uri: companion.imageUrl }}
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
          <View style={styles.inputContainer}>
            <TextInput
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
});

export default CompanionScreen;
