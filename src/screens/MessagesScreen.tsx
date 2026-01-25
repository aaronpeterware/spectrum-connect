import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Animated, Keyboard, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import MenuModal from '../components/MenuModal';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
import { getMutualMatches, Match } from '../services/matchingService';
import { supabase } from '../config/supabase';
import { getUserId } from '../services/profileService';

type RootStackParamList = {
  Chat: {
    conversationId: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    recipientId?: string;
    isFakeUser?: boolean;
  };
};

interface ConversationItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  avatar: string;
  isOnline: boolean;
  recipientId: string;
  isFakeUser: boolean;
}

const MessagesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { clearUnread } = useUser();
  const { colors, isDark } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(0)).current;

  // Format time ago
  const formatTimeAgo = (dateString: string | undefined): string => {
    if (!dateString) return 'New match';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Load conversations from matching service
  const loadConversations = useCallback(async () => {
    try {
      const matches = await getMutualMatches();

      const convItems: ConversationItem[] = matches.map((match: Match) => ({
        id: match.conversationId,
        name: match.profile.name,
        lastMessage: match.lastMessage || 'Say hello!',
        time: formatTimeAgo(match.lastMessageAt),
        unread: match.unreadCount > 0,
        avatar: match.profile.profilePhotos[0] || '',
        isOnline: Math.random() > 0.5, // Randomize for now, could track real online status
        recipientId: match.profile.id,
        isFakeUser: match.profile.isFake,
      }));

      setConversations(convItems);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      clearUnread();
      loadConversations();
    }, [clearUnread, loadConversations])
  );

  // Subscribe to real-time conversation updates
  useEffect(() => {
    let subscription: any;

    const setupSubscription = async () => {
      const userId = await getUserId();

      subscription = supabase
        .channel('conversations-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
          },
          (payload) => {
            // Reload conversations when there's an update
            loadConversations();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            // Reload when new message arrives
            loadConversations();
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [loadConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
  }, [loadConversations]);

  const toggleSearch = () => {
    if (searchVisible) {
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

  const handleConversationPress = (conversation: ConversationItem) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      name: conversation.name,
      avatar: conversation.avatar,
      isOnline: conversation.isOnline,
      recipientId: conversation.recipientId,
      isFakeUser: conversation.isFakeUser,
    });
  };

  const renderConversation = ({ item }: { item: ConversationItem }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: colors.cardBackground }]}
      onPress={() => handleConversationPress(item)}
      activeOpacity={0.7}
    >
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
        {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: colors.cardBackground }]} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.conversationTime, { color: colors.textSecondary }]}>{item.time}</Text>
        </View>
        <Text
          style={[styles.conversationMessage, { color: colors.textSecondary }, item.unread && { color: colors.text, fontWeight: '500' }]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>

      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <View style={styles.header}>
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.surface }]} onPress={toggleSearch}>
          <Ionicons name={searchVisible ? "close" : "search"} size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        {searchVisible ? (
          <Animated.View style={[styles.searchInputContainer, { backgroundColor: colors.surface }, {
            opacity: searchAnim,
            flex: searchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          }]}>
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search messages..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          <View style={styles.logoContainer}>
            <Text style={[styles.logoTextSpectrum, { color: colors.text }]}>Messages</Text>
          </View>
        )}
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No messages found' : 'No matches yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {searchQuery ? 'Try a different search term' : 'Start swiping to find matches!'}
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    marginTop: Spacing.md,
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
  list: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
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
