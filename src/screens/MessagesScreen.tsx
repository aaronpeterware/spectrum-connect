import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Animated, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import MenuModal from '../components/MenuModal';

type RootStackParamList = {
  Chat: { conversationId: string; name: string; avatar?: string; isOnline?: boolean };
};

// Direct messages with real users (free messaging)
const conversations = [
  {
    id: '1',
    name: 'Emma',
    lastMessage: 'Hey! Nice to match with you 💕',
    time: 'Just now',
    unread: true,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Sophie',
    lastMessage: "That sounds fun! I'd love to hear more about it.",
    time: '1h ago',
    unread: true,
    avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=face',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Olivia',
    lastMessage: 'Thanks for the conversation yesterday!',
    time: '3h ago',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1557555187-23d685287bc3?w=200&h=200&fit=crop&crop=face',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Jake',
    lastMessage: 'Would you like to grab coffee sometime?',
    time: '5h ago',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    isOnline: true,
  },
  {
    id: '5',
    name: 'Ava',
    lastMessage: 'That movie recommendation was perfect!',
    time: '1d ago',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop&crop=face',
    isOnline: false,
  },
  {
    id: '6',
    name: 'Marcus',
    lastMessage: 'Great meeting you at the event!',
    time: '2d ago',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    isOnline: false,
  },
  {
    id: '7',
    name: 'Rachel',
    lastMessage: "Let's hang out this weekend!",
    time: '3d ago',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    isOnline: true,
  },
];

const MessagesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const toggleSearch = () => {
    if (searchVisible) {
      // Close search
      Keyboard.dismiss();
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setSearchVisible(false);
        setSearchQuery('');
      });
    } else {
      // Open search
      setSearchVisible(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        searchInputRef.current?.focus();
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.name.toLowerCase().includes(query) ||
      conv.lastMessage.toLowerCase().includes(query)
    );
  });

  const handleConversationPress = (conversation: typeof conversations[0]) => {
    // Navigate to Chat screen for direct messages with real users
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      name: conversation.name,
      avatar: conversation.avatar,
      isOnline: conversation.isOnline,
    });
  };

  const renderConversation = ({ item }: { item: typeof conversations[0] }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => handleConversationPress(item)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        ) : (
          <LinearGradient
            colors={[Colors.gradientPink, Colors.gradientPurple]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{item.name[0]}</Text>
          </LinearGradient>
        )}
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.conversationTime}>{item.time}</Text>
        </View>
        <Text
          style={[styles.conversationMessage, item.unread && styles.unreadMessage]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>

      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
          <Ionicons name={searchVisible ? "close" : "search"} size={22} color={Colors.gray600} />
        </TouchableOpacity>
        {searchVisible ? (
          <Animated.View style={[styles.searchInputContainer, {
            opacity: searchAnim,
            flex: searchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          }]}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor={Colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={Colors.gray400} />
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          <View style={styles.logoContainer}>
            <Text style={styles.logoTextSpectrum}>Spectrum</Text>
            <Text style={styles.logoTextConnect}>Connect</Text>
          </View>
        )}
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color={Colors.gray900} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>No messages found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoTextSpectrum: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray900,
    letterSpacing: -0.5,
  },
  logoTextConnect: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.primary,
    fontStyle: 'italic',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray900,
  },
  clearButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray500,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.gray400,
    marginTop: Spacing.xs,
  },
  coachCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  coachCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  coachIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  coachInfo: {
    flex: 1,
  },
  coachTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  coachSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachBadge: {
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  conversationTime: {
    ...Typography.caption,
    color: Colors.gray400,
  },
  conversationMessage: {
    ...Typography.bodySmall,
    color: Colors.gray500,
  },
  unreadMessage: {
    color: Colors.gray700,
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
});

export default MessagesScreen;
