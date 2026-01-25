import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Animated,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalImage } from '../data/localImages';
import { API_CONFIG } from '../config/api';
import { usePurchases } from '../context/PurchaseContext';
import { supabase } from '../config/supabase';
import { getUserId } from '../services/profileService';
import { simulateFakeUserResponse } from '../services/matchingService';
import { useTheme } from '../hooks/useTheme';
import { sendMessageNotification } from '../services/notificationService';

// Opening messages for companions - natural, warm, showing they're also on the spectrum
const COMPANION_OPENERS: Record<string, string[]> = {
  sophia: [
    "Hey! I noticed you checked out my profile 😊",
    "I have to admit, I'm a bit nervous messaging first... but I figured why not, right?",
    "I love how this app actually gets what it's like for us. So what made you want to connect?"
  ],
  emma: [
    "Hi there! I saw we have some things in common",
    "I'm not always great at starting conversations, but I'm really trying to put myself out there more",
    "What's something you're really into lately? I'd love to hear about it"
  ],
  olivia: [
    "Hey! Thanks for being here 💕",
    "I find it so much easier to express myself through text... does that make sense?",
    "Tell me something about yourself that most people don't ask about"
  ],
  mia: [
    "Hi! I hope this isn't too forward, but I wanted to say hey",
    "I've been trying to meet people who actually understand what it's like, you know?",
    "What's your favorite way to spend a quiet evening?"
  ],
  grace: [
    "Hey there 🌸",
    "I'm always a bit anxious about first messages, but here goes nothing!",
    "I'd really love to get to know you better. What brings you joy?"
  ],
  lily: [
    "Hi! I'm so glad you're here",
    "I think it's really cool that we can connect like this",
    "So tell me, what's something you could talk about for hours?"
  ],
  james: [
    "Hey, what's up?",
    "I'll be honest - small talk isn't my strong suit, but real conversations? I'm all in",
    "What's something you're passionate about?"
  ],
  noah: [
    "Hi there! Hope you're having a good day",
    "I've been wanting to meet someone who gets me, you know?",
    "What's something that always makes you smile?"
  ],
  liam: [
    "Hey! Glad we connected",
    "I'm much better at texting than talking in person, if I'm being honest 😅",
    "What's on your mind today?"
  ],
  ethan: [
    "Hi! I saw your profile and just had to say hello",
    "I hope that's okay - I'm trying to be more open about reaching out",
    "What's something you wish more people understood about you?"
  ],
};

type RootStackParamList = {
  Chat: {
    conversationId: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    companionId?: string;
    recipientId?: string;
    isFakeUser?: boolean;
  };
  Call: { companionId: string };
  UserProfile: { userId: string; name: string; avatar?: string };
  CompanionProfile: { companionId: string };
};

type ChatRouteParams = {
  Chat: {
    conversationId: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    companionId?: string;
    recipientId?: string;
    isFakeUser?: boolean;
  };
};

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
  attachment?: {
    type: 'image' | 'video' | 'gif';
    uri: string;
  };
  replyTo?: {
    id: string;
    text: string;
    sender: 'user' | 'other';
  };
};

// iMessage blue color
const IMESSAGE_BLUE = '#007AFF';

// Suggested messages / icebreakers
const SUGGESTED_MESSAGES = {
  default: [
    "What's something you're really into lately?",
    "Tell me about your favorite way to relax",
    "What's your current hyperfixation?",
    "What made you smile today?",
  ],
  gettingToKnow: [
    "What do you do for fun?",
    "Are you more of a morning or night person?",
    "What's your favorite comfort food?",
    "Do you have any pets?",
  ],
  deeperConnection: [
    "What's something you wish more people understood about you?",
    "What's a goal you're working towards?",
    "What helps you feel calm when you're overwhelmed?",
    "What's your favorite memory?",
  ],
  continuingConvo: [
    "That's really interesting! Tell me more",
    "I feel the same way about that",
    "What made you interested in that?",
    "How long have you been into that?",
  ],
};

const ChatScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
  const { triggerHaptic } = useSettings();
  const { trackChatUsage, momentsBalance } = usePurchases();
  const { name, avatar, isOnline, companionId, recipientId, isFakeUser, conversationId } = route.params;

  // Determine chat type: companion (AI paid), fake user (simulated), or real user
  const isCompanionChat = !!companionId;
  const isFakeUserChat = !!isFakeUser && !!recipientId;
  const isRealUserChat = !isCompanionChat && !isFakeUserChat && !!recipientId;

  // Get local image for companion if available
  const localImage = companionId ? getLocalImage(companionId) : undefined;
  const avatarSource = localImage || (avatar ? { uri: avatar } : undefined);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ type: 'image' | 'video' | 'gif'; uri: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionCategory, setSuggestionCategory] = useState<keyof typeof SUGGESTED_MESSAGES>('default');
  const [reportMenuVisible, setReportMenuVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const attachmentMenuAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Use companionId if available, otherwise fall back to conversationId
  const chatId = companionId || conversationId;
  const STORAGE_KEY = chatId ? `spectrum_chat_${chatId}` : null;

  // Get current user ID on mount
  useEffect(() => {
    getUserId().then(setCurrentUserId);
  }, []);

  // Keep a ref to current messages for saving
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  // Helper to save messages immediately
  const saveMessagesToStorage = useCallback(async (msgs: Message[]) => {
    if (!STORAGE_KEY || msgs.length === 0) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
      console.log('Saved', msgs.length, 'messages to', STORAGE_KEY);
    } catch (e: any) {
      console.log('Save error:', e.message);
    }
  }, [STORAGE_KEY]);

  // Load messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) {
        console.log('No chatId');
        return;
      }

      // For user-to-user chats (fake or real), load from Supabase
      if ((isFakeUserChat || isRealUserChat) && conversationId) {
        try {
          const { data: dbMessages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('Error loading messages from Supabase:', error);
          } else if (dbMessages && dbMessages.length > 0) {
            const userId = await getUserId();
            const loadedMessages: Message[] = dbMessages.map(msg => ({
              id: msg.id,
              text: msg.message_text,
              sender: msg.sender_id === userId ? 'user' : 'other',
              timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              attachment: msg.attachment_url ? { type: msg.attachment_type as any || 'image', uri: msg.attachment_url } : undefined,
            }));
            setMessages(loadedMessages);
            console.log('Loaded', loadedMessages.length, 'messages from Supabase');
            return;
          }
        } catch (err) {
          console.error('Error loading messages:', err);
        }
        return;
      }

      // For companion chats, use local storage
      if (!STORAGE_KEY) return;

      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        console.log('Loading from', STORAGE_KEY, '- found:', stored ? 'yes' : 'no');

        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }

        // No stored messages - create openers only for companions
        if (companionId && COMPANION_OPENERS[companionId]) {
          const openers = COMPANION_OPENERS[companionId];
          const initialMessages: Message[] = openers.map((text, index) => ({
            id: `opener-${companionId}-${index}`,
            text,
            sender: 'other',
            timestamp: new Date(Date.now() - (openers.length - index) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(initialMessages);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialMessages));
          console.log('Created openers for', companionId);
        }
      } catch (error: any) {
        console.log('Load error:', error.message);
      }
    };

    loadMessages();
  }, [STORAGE_KEY, chatId, companionId, conversationId, isFakeUserChat, isRealUserChat]);

  // Subscribe to real-time messages for user-to-user chats
  useEffect(() => {
    if (!conversationId || (!isFakeUserChat && !isRealUserChat)) return;

    const subscription = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          const userId = await getUserId();

          // Only add if it's from the other user (our own messages are added immediately)
          if (newMsg.sender_id !== userId) {
            const message: Message = {
              id: newMsg.id,
              text: newMsg.message_text,
              sender: 'other',
              timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              attachment: newMsg.attachment_url ? { type: newMsg.attachment_type || 'image', uri: newMsg.attachment_url } : undefined,
            };

            setMessages(prev => {
              // Avoid duplicates
              if (prev.find(m => m.id === message.id)) return prev;
              return [...prev, message];
            });

            // Mark as read
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);

            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversationId, isFakeUserChat, isRealUserChat]);

  const showAttachmentMenu = () => {
    setAttachmentMenuVisible(true);
    Animated.spring(attachmentMenuAnim, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  };

  const hideAttachmentMenu = () => {
    Animated.timing(attachmentMenuAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setAttachmentMenuVisible(false));
  };

  const handlePickImage = async () => {
    // Close menu first
    setAttachmentMenuVisible(false);

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Media library permission denied');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPendingAttachment({ type: 'image', uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handlePickVideo = async () => {
    // Close menu first
    setAttachmentMenuVisible(false);

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Media library permission denied');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPendingAttachment({ type: 'video', uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Video picker error:', error);
    }
  };

  const handleTakePhoto = async () => {
    // Close menu first
    setAttachmentMenuVisible(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.log('Camera permission denied');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPendingAttachment({ type: 'image', uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleSelectGif = () => {
    // Close menu first
    setAttachmentMenuVisible(false);

    // For now, use a placeholder GIF - in a real app, you'd integrate with a GIF API like Giphy
    const sampleGifs = [
      'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
      'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
      'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    ];
    const randomGif = sampleGifs[Math.floor(Math.random() * sampleGifs.length)];
    setPendingAttachment({ type: 'gif', uri: randomGif });
  };

  const clearPendingAttachment = () => {
    setPendingAttachment(null);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
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

  const handleReportUser = () => {
    setReportMenuVisible(false);
    Alert.alert(
      'Report User',
      'Thank you for helping keep Haven safe. What would you like to report?',
      [
        { text: 'Inappropriate Content', onPress: () => Alert.alert('Report Submitted', 'Our team will review this report.') },
        { text: 'Abusive Behaviour', onPress: () => Alert.alert('Report Submitted', 'Our team will review this report.') },
        { text: 'Spam', onPress: () => Alert.alert('Report Submitted', 'Our team will review this report.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleBlockUser = () => {
    setReportMenuVisible(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${name}? You won't see their messages anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            Alert.alert('User Blocked', `${name} has been blocked.`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !pendingAttachment) return;

    // Haptic feedback when sending
    triggerHaptic('light');

    const userText = inputText.trim();
    const messageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: Message = {
      id: messageId,
      text: userText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: pendingAttachment || undefined,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        sender: replyingTo.sender,
      } : undefined,
    };

    // Update state and save immediately
    const updatedMessages = [...messagesRef.current, newMessage];
    setMessages(updatedMessages);
    setInputText('');
    setPendingAttachment(null);
    setReplyingTo(null);

    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Handle user-to-user chat (fake or real)
    if ((isFakeUserChat || isRealUserChat) && conversationId && recipientId) {
      try {
        const userId = await getUserId();

        // Save message to Supabase
        const { data: savedMsg, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            recipient_id: recipientId,
            message_text: userText,
            attachment_url: pendingAttachment?.uri,
            attachment_type: pendingAttachment?.type,
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving message to Supabase:', error);
        } else {
          // Update message ID with the real one from Supabase
          setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, id: savedMsg.id } : m
          ));
        }

        // Update conversation's last message
        await supabase
          .from('conversations')
          .update({
            last_message_text: userText,
            last_message_at: new Date().toISOString(),
            last_message_sender_id: userId,
          })
          .eq('id', conversationId);

        // Send push notification to recipient (for real user chats)
        if (isRealUserChat && recipientId && userText) {
          // Get user profile for sender name
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('name')
            .eq('id', userId)
            .single();

          const senderName = userProfile?.name || 'Someone';
          sendMessageNotification(recipientId, senderName, userText, conversationId);
        }

        // For fake user chats, simulate a response
        if (isFakeUserChat && userText) {
          setIsTyping(true);

          try {
            // Build conversation history for AI context
            const conversationHistory = messages.slice(-10).map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text,
            }));

            // Get fake user response (includes random delay)
            const response = await simulateFakeUserResponse(recipientId, userText, conversationId, conversationHistory);

            const fakeUserMessage: Message = {
              id: `fake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: response,
              sender: 'other',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            // Save fake user's response to Supabase
            const { data: savedFakeMsg } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                sender_id: recipientId,
                recipient_id: userId,
                message_text: response,
              })
              .select()
              .single();

            if (savedFakeMsg) {
              fakeUserMessage.id = savedFakeMsg.id;
            }

            // Update conversation's last message
            await supabase
              .from('conversations')
              .update({
                last_message_text: response,
                last_message_at: new Date().toISOString(),
                last_message_sender_id: recipientId,
              })
              .eq('id', conversationId);

            // Add message only if not already added by real-time subscription
            setMessages(prev => {
              if (prev.find(m => m.id === fakeUserMessage.id)) return prev;
              return [...prev, fakeUserMessage];
            });

            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          } catch (err) {
            console.error('Error getting fake user response:', err);
          } finally {
            setIsTyping(false);
          }
        }
      } catch (err) {
        console.error('Error in user-to-user chat:', err);
      }
      return;
    }

    // Save to local storage for companion chats
    saveMessagesToStorage(updatedMessages);

    // Get companion response
    if (companionId && userText) {
      setIsTyping(true);

      try {
        // Build messages array for API (include conversation history)
        const apiMessages = updatedMessages
          .filter(m => m.text)
          .map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          }));

        const response = await fetch(`${API_CONFIG.API_URL}/api/companion-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            companionId,
          }),
        });

        const data = await response.json();

        if (data.message) {
          // Track usage - 1 moment per AI response (uses PurchaseContext)
          const trackResult = await trackChatUsage();
          if (__DEV__) {
            console.log('Moment tracking:', trackResult.success ? `Used 1 moment, new balance: ${trackResult.newBalance}` : 'Failed');
          }

          const companionMessage: Message = {
            id: `companion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: data.message,
            sender: 'other',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          // Update state and save immediately
          const withCompanionMsg = [...messagesRef.current, companionMessage];
          setMessages(withCompanionMsg);
          saveMessagesToStorage(withCompanionMsg);

          // Scroll to bottom after companion response
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);

          // Warn user if balance is low
          if (trackResult.success && trackResult.newBalance <= 10) {
            console.log('Low moment balance warning:', trackResult.newBalance);
          }
        }
      } catch (error) {
        console.error('Chat error:', error);
        // Add a fallback message if API fails - still track usage since we're providing a response
        await trackChatUsage();

        const fallbackMessage: Message = {
          id: `companion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: "Sorry, I got a bit distracted there 😅 What were you saying?",
          sender: 'other',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const withFallback = [...messagesRef.current, fallbackMessage];
        setMessages(withFallback);
        saveMessagesToStorage(withFallback);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleReply(item)}
        style={[styles.messageRow, isUser && styles.messageRowUser]}
      >
        {!isUser && (
          avatarSource ? (
            <Image source={avatarSource} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[Colors.gradientPink, Colors.gradientPurple]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{name[0]}</Text>
            </LinearGradient>
          )
        )}
        <View style={[styles.messageContainer, isUser && styles.messageContainerUser]}>
          {/* Reply preview */}
          {item.replyTo && (
            <View style={[styles.replyPreview, isUser && styles.replyPreviewUser]}>
              <View style={[styles.replyBar, isUser && styles.replyBarUser]} />
              <Text style={[styles.replyName, isUser && styles.replyNameUser]} numberOfLines={1}>
                {item.replyTo.sender === 'user' ? 'You' : name}
              </Text>
              <Text style={[styles.replyText, { color: colors.textSecondary }, isUser && styles.replyTextUser]} numberOfLines={1}>
                {item.replyTo.text}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.messageBubbleUser : [styles.messageBubbleOther, { backgroundColor: isDark ? colors.cardBackground : '#E9E9EB' }],
              item.attachment && styles.messageBubbleWithAttachment,
            ]}
          >
            {item.attachment && (
              <Image
                source={{ uri: item.attachment.uri }}
                style={styles.attachmentImage}
                resizeMode="cover"
              />
            )}
            {item.text ? (
              <Text style={[styles.messageText, { color: isUser ? 'white' : colors.text }]}>
                {item.text}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfileTouchable}
          onPress={() => {
            if (isCompanionChat && companionId) {
              navigation.navigate('CompanionProfile', { companionId });
            } else if (recipientId) {
              navigation.navigate('UserProfile', {
                userId: recipientId,
                name,
                avatar: avatar
              });
            }
          }}
        >
          <View style={styles.headerAvatarContainer}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.headerAvatarImage} />
            ) : (
              <LinearGradient
                colors={[Colors.gradientPink, Colors.gradientPurple]}
                style={styles.headerAvatar}
              >
                <Text style={styles.headerAvatarText}>{name[0]}</Text>
              </LinearGradient>
            )}
            {isOnline && <View style={[styles.headerOnlineIndicator, { borderColor: colors.surface }]} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.headerStatus, !isOnline && styles.headerStatusOffline]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>
        {isCompanionChat && companionId && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => navigation.navigate('Call', { companionId })}
          >
            <Ionicons name="call" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.moreButton} onPress={() => setReportMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={[styles.messagesList, messages.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingContainer}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={[Colors.gradientPink, Colors.gradientPurple]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{name[0]}</Text>
                </LinearGradient>
              )}
              <View style={[styles.typingBubble, { backgroundColor: isDark ? colors.cardBackground : Colors.surface }]}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyAvatarContainer}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.emptyAvatar} />
              ) : (
                <LinearGradient
                  colors={[Colors.gradientPink, Colors.gradientPurple]}
                  style={styles.emptyAvatar}
                >
                  <Text style={styles.emptyAvatarText}>{name[0]}</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Start chatting with {name}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Send a message to begin your conversation</Text>
          </View>
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Reply Preview */}
        {replyingTo && (
          <View style={[styles.replyingToContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.replyingToContent}>
              <View style={styles.replyingToBar} />
              <View style={styles.replyingToText}>
                <Text style={styles.replyingToName}>
                  Replying to {replyingTo.sender === 'user' ? 'yourself' : name}
                </Text>
                <Text style={[styles.replyingToMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                  {replyingTo.text}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Attachment Preview */}
        {pendingAttachment && (
          <View style={[styles.pendingAttachmentContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Image source={{ uri: pendingAttachment.uri }} style={styles.pendingAttachmentImage} />
            <TouchableOpacity style={styles.removeAttachmentButton} onPress={clearPendingAttachment}>
              <Ionicons name="close-circle" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Suggestions / Icebreakers */}
        {showSuggestions && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.suggestionsHeader}>
              <Ionicons name="sparkles" size={14} color={Colors.primary} />
              <Text style={[styles.suggestionsLabel, { color: colors.textSecondary }]}>Suggestions</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {SUGGESTED_MESSAGES[suggestionCategory].map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionChip, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                  onPress={() => handleSelectSuggestion(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.attachButton} onPress={showAttachmentMenu}>
            <Ionicons name="add-circle" size={28} color={IMESSAGE_BLUE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.suggestionButton, { backgroundColor: isDark ? colors.cardBackground : Colors.gray100 }, showSuggestions && styles.suggestionButtonActive]}
            onPress={toggleSuggestions}
          >
            <Ionicons
              name="bulb"
              size={22}
              color={showSuggestions ? Colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
          <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="iMessage"
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() && !pendingAttachment) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() && !pendingAttachment}
          >
            <View style={[styles.sendButtonCircle, (inputText.trim() || pendingAttachment) && styles.sendButtonCircleActive]}>
              <Ionicons name="arrow-up" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Menu Modal */}
      <Modal
        visible={attachmentMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideAttachmentMenu}
      >
        <TouchableOpacity
          style={styles.attachmentOverlay}
          activeOpacity={1}
          onPress={hideAttachmentMenu}
        >
          <Animated.View
            style={[
              styles.attachmentMenu,
              {
                transform: [
                  {
                    translateY: attachmentMenuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, 0],
                    }),
                  },
                ],
                opacity: attachmentMenuAnim,
              },
            ]}
          >
            <View style={styles.attachmentMenuHandle} />
            <Text style={styles.attachmentMenuTitle}>Send Attachment</Text>

            <View style={styles.attachmentOptions}>
              <TouchableOpacity style={styles.attachmentOption} onPress={handleTakePhoto}>
                <View style={[styles.attachmentOptionIcon, { backgroundColor: '#FF6B6B' }]}>
                  <Ionicons name="camera" size={24} color="white" />
                </View>
                <Text style={styles.attachmentOptionText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentOption} onPress={handlePickImage}>
                <View style={[styles.attachmentOptionIcon, { backgroundColor: '#4ECDC4' }]}>
                  <Ionicons name="images" size={24} color="white" />
                </View>
                <Text style={styles.attachmentOptionText}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentOption} onPress={handlePickVideo}>
                <View style={[styles.attachmentOptionIcon, { backgroundColor: '#45B7D1' }]}>
                  <Ionicons name="videocam" size={24} color="white" />
                </View>
                <Text style={styles.attachmentOptionText}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentOption} onPress={handleSelectGif}>
                <View style={[styles.attachmentOptionIcon, { backgroundColor: '#96CEB4' }]}>
                  <Ionicons name="film" size={24} color="white" />
                </View>
                <Text style={styles.attachmentOptionText}>GIF</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={hideAttachmentMenu}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Report/Block Menu Modal */}
      <Modal
        visible={reportMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReportMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.reportMenuOverlay}
          activeOpacity={1}
          onPress={() => setReportMenuVisible(false)}
        >
          <View style={[styles.reportMenuContainer, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity style={styles.reportMenuItem} onPress={handleReportUser}>
              <Ionicons name="flag" size={22} color={Colors.warning} />
              <Text style={[styles.reportMenuItemText, { color: colors.text }]}>Report User</Text>
            </TouchableOpacity>
            <View style={[styles.reportMenuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.reportMenuItem} onPress={handleBlockUser}>
              <Ionicons name="ban" size={22} color={Colors.error} />
              <Text style={[styles.reportMenuItemText, { color: Colors.error }]}>Block User</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerProfileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  headerOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  headerStatus: {
    ...Typography.caption,
    color: Colors.success,
  },
  headerStatusOffline: {
    color: Colors.gray400,
  },
  callButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  moreButton: {
    padding: Spacing.xs,
  },
  messagesList: {
    padding: Spacing.lg,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyAvatarContainer: {
    marginBottom: Spacing.lg,
  },
  emptyAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAvatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: 'white',
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.gray500,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  messageContainer: {
    maxWidth: '70%',
  },
  messageContainerUser: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  messageBubbleOther: {
    backgroundColor: '#E9E9EB',
    borderBottomLeftRadius: 4,
  },
  messageBubbleUser: {
    backgroundColor: '#007AFF',  // iMessage blue
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
  },
  messageTextUser: {
    color: 'white',
  },
  timestamp: {
    fontSize: 11,
    color: Colors.gray400,
    marginTop: 2,
    marginHorizontal: 4,
  },
  timestampUser: {
    color: Colors.gray400,
  },
  // Reply styles
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingLeft: 8,
  },
  replyPreviewUser: {
    justifyContent: 'flex-end',
    paddingLeft: 0,
    paddingRight: 8,
  },
  replyBar: {
    width: 3,
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginRight: 8,
  },
  replyBarUser: {
    marginRight: 0,
    marginLeft: 8,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
  },
  replyNameUser: {
    color: '#007AFF',
  },
  replyText: {
    fontSize: 12,
    color: Colors.gray500,
    flex: 1,
  },
  replyTextUser: {
    textAlign: 'right',
  },
  // Reply input preview
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.gray100,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  replyingToContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyingToBar: {
    width: 3,
    height: 36,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginRight: 10,
  },
  replyingToText: {
    flex: 1,
  },
  replyingToName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  replyingToMessage: {
    fontSize: 13,
    color: Colors.gray600,
  },
  cancelReplyButton: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 34,
    backgroundColor: '#F6F6F6',
    borderTopWidth: 0.5,
    borderTopColor: '#C8C8C8',
  },
  attachButton: {
    padding: 4,
    marginRight: 2,
    marginBottom: 4,
  },
  suggestionButton: {
    padding: 6,
    marginRight: 4,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
  },
  suggestionButtonActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#C8C8C8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    color: '#000000',
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonCircleActive: {
    backgroundColor: '#007AFF',
  },
  // Attachment styles
  messageBubbleWithAttachment: {
    padding: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.lg,
    marginBottom: 4,
  },
  pendingAttachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  pendingAttachmentImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  removeAttachmentButton: {
    marginLeft: Spacing.sm,
  },
  attachmentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachmentMenu: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  attachmentMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  attachmentMenuTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  attachmentOption: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  attachmentOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentOptionText: {
    ...Typography.caption,
    color: Colors.gray700,
    fontWeight: '500',
  },
  cancelButton: {
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.gray700,
    fontWeight: '600',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  typingBubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray400,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  // Suggestions styles
  suggestionsContainer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: '#F6F6F6',
    borderTopWidth: 0.5,
    borderTopColor: '#C8C8C8',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
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
    paddingHorizontal: Spacing.md,
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
  reportMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportMenuContainer: {
    width: '80%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  reportMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: 12,
  },
  reportMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  reportMenuDivider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
});

export default ChatScreen;
