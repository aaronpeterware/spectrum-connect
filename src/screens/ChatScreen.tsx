import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';

type ChatRouteParams = {
  Chat: { conversationId: string; name: string; avatar?: string; isOnline?: boolean };
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
};

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
  const { name, avatar, isOnline } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ type: 'image' | 'video' | 'gif'; uri: string } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const attachmentMenuAnim = useRef(new Animated.Value(0)).current;

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
    hideAttachmentMenu();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingAttachment({ type: 'image', uri: result.assets[0].uri });
    }
  };

  const handlePickVideo = async () => {
    hideAttachmentMenu();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingAttachment({ type: 'video', uri: result.assets[0].uri });
    }
  };

  const handleTakePhoto = async () => {
    hideAttachmentMenu();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingAttachment({ type: 'image', uri: result.assets[0].uri });
    }
  };

  const handleSelectGif = () => {
    hideAttachmentMenu();
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

  const sendMessage = () => {
    if (!inputText.trim() && !pendingAttachment) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: pendingAttachment || undefined,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setPendingAttachment(null);

    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[Colors.gradientPink, Colors.gradientPurple]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{name[0]}</Text>
            </LinearGradient>
          )
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleUser : styles.messageBubbleOther,
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
            <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
              {item.text}
            </Text>
          ) : null}
          <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <View style={styles.headerAvatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.headerAvatarImage} />
          ) : (
            <LinearGradient
              colors={[Colors.gradientPink, Colors.gradientPurple]}
              style={styles.headerAvatar}
            >
              <Text style={styles.headerAvatarText}>{name[0]}</Text>
            </LinearGradient>
          )}
          {isOnline && <View style={styles.headerOnlineIndicator} />}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={[styles.headerStatus, !isOnline && styles.headerStatusOffline]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
                <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.gray600} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messagesList, messages.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyAvatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.emptyAvatar} />
              ) : (
                <LinearGradient
                  colors={[Colors.gradientPink, Colors.gradientPurple]}
                  style={styles.emptyAvatar}
                >
                  <Text style={styles.emptyAvatarText}>{name[0]}</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={styles.emptyTitle}>You matched with {name}!</Text>
            <Text style={styles.emptySubtitle}>Say hello and start a conversation</Text>
          </View>
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Pending Attachment Preview */}
        {pendingAttachment && (
          <View style={styles.pendingAttachmentContainer}>
            <Image source={{ uri: pendingAttachment.uri }} style={styles.pendingAttachmentImage} />
            <TouchableOpacity style={styles.removeAttachmentButton} onPress={clearPendingAttachment}>
              <Ionicons name="close-circle" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={showAttachmentMenu}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.gray400}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() && !pendingAttachment) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() && !pendingAttachment}
          >
            <LinearGradient
              colors={(inputText.trim() || pendingAttachment) ? [Colors.gradientPurple, Colors.gradientBlue] : [Colors.gray300, Colors.gray300]}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="white" />
            </LinearGradient>
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
    marginBottom: Spacing.md,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  messageBubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageBubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    ...Typography.body,
    color: Colors.gray900,
  },
  messageTextUser: {
    color: 'white',
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.gray400,
    marginTop: 4,
    fontSize: 10,
  },
  timestampUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  attachButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  input: {
    ...Typography.body,
    color: Colors.gray900,
    maxHeight: 80,
  },
  sendButton: {
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default ChatScreen;
