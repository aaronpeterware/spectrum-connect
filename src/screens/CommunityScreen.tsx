import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { usePosts, Post, Comment } from '../context/PostsContext';
import { useUser } from '../context/UserContext';
import MenuModal from '../components/MenuModal';

type RootStackParamList = {
  CreatePost: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string; name: string; avatar?: string };
};

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  wins: 'trophy',
  tips: 'bulb',
  stories: 'book',
  questions: 'help-circle',
};

const categoryColors: Record<string, string> = {
  wins: Colors.success,
  tips: Colors.secondary,
  stories: Colors.primary,
  questions: Colors.accent,
};

interface PostCardProps {
  item: Post;
  onLike: (id: string) => void;
  onComment: (post: Post) => void;
  onPostPress: (postId: string) => void;
  onAuthorPress: (userId: string, name: string, avatar: string) => void;
}

const PostCard = ({ item, onLike, onComment, onPostPress, onAuthorPress }: PostCardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    // Animate the heart
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onLike(item.id);
  };

  return (
    <TouchableOpacity style={styles.postCard} activeOpacity={0.9} onPress={() => onPostPress(item.id)}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onAuthorPress(item.authorId, item.author, item.authorImage || '')}>
          {item.authorImage ? (
            <Image source={{ uri: item.authorImage }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[Colors.gradientPink, Colors.gradientPurple]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{item.author[0]}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.postMeta} onPress={() => onAuthorPress(item.authorId, item.author, item.authorImage || '')}>
          <Text style={styles.authorName}>{item.author}</Text>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColors[item.category]}15` }]}>
              <Ionicons
                name={categoryIcons[item.category]}
                size={12}
                color={categoryColors[item.category]}
              />
              <Text style={[styles.categoryText, { color: categoryColors[item.category] }]}>
                {item.category}
              </Text>
            </View>
            <Text style={styles.timeAgo}>{item.timeAgo}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postPreview} numberOfLines={2}>{item.preview}</Text>
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? Colors.error : Colors.gray500}
            />
          </Animated.View>
          <Text style={[styles.actionText, item.isLiked && styles.likedText]}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onComment(item)}>
          <Ionicons name="chatbubble-outline" size={18} color={Colors.gray500} />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Comment Item Component
const CommentItem = ({
  comment,
  onLike,
  onReply
}: {
  comment: Comment;
  onLike: () => void;
  onReply: (commentId: string, author: string) => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onLike();
  };

  return (
    <View style={[styles.commentItem, comment.parentId && styles.replyItem]}>
      <Image source={{ uri: comment.authorImage }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{comment.author}</Text>
          <Text style={styles.commentTime}>{comment.timeAgo}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.isLiked ? Colors.error : Colors.gray400}
              />
            </Animated.View>
            <Text style={[styles.commentActionText, comment.isLiked && styles.likedText]}>
              {comment.likes}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => onReply(comment.id, comment.author)}
          >
            <Ionicons name="arrow-undo-outline" size={16} color={Colors.gray400} />
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const CommunityScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { posts, toggleLike, getComments, addComment, toggleCommentLike } = usePosts();
  const { user } = useUser();
  const [activeFilter, setActiveFilter] = useState('all');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const filteredPosts = activeFilter === 'all'
    ? posts
    : posts.filter(p => p.category === activeFilter);

  const handleOpenComments = (post: Post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const handleCloseComments = () => {
    setCommentModalVisible(false);
    setSelectedPost(null);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedPost) {
      addComment(selectedPost.id, newComment.trim(), user.name, user.profileImage, replyingTo?.id);
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const handleReply = (commentId: string, author: string) => {
    setReplyingTo({ id: commentId, author });
    setNewComment(`@${author} `);
  };

  const handlePostPress = (postId: string) => {
    (navigation as any).navigate('PostDetail', { postId });
  };

  const handleAuthorPress = (userId: string, name: string, avatar: string) => {
    (navigation as any).navigate('UserProfile', { userId, name, avatar });
  };

  // Organize comments into threaded structure
  const getThreadedComments = (postId: string) => {
    const allComments = getComments(postId);
    const parentComments = allComments.filter(c => !c.parentId);
    const threadedComments: Comment[] = [];

    parentComments.forEach(parent => {
      threadedComments.push(parent);
      // Find all replies to this parent
      const replies = allComments.filter(c => c.parentId === parent.id);
      replies.forEach(reply => threadedComments.push(reply));
    });

    return threadedComments;
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      item={item}
      onLike={toggleLike}
      onComment={handleOpenComments}
      onPostPress={handlePostPress}
      onAuthorPress={handleAuthorPress}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => (navigation as any).navigate('CreatePost')}
        >
          <Ionicons name="add" size={28} color={Colors.gray700} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextSpectrum}>Spectrum</Text>
          <Text style={styles.logoTextConnect}>Connect</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color={Colors.gray900} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'wins' && styles.filterTabActive]}
          onPress={() => setActiveFilter('wins')}
        >
          <Ionicons name="trophy" size={16} color={activeFilter === 'wins' ? 'white' : Colors.gray500} />
          <Text style={[styles.filterText, activeFilter === 'wins' && styles.filterTextActive]}>Wins</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'tips' && styles.filterTabActive]}
          onPress={() => setActiveFilter('tips')}
        >
          <Ionicons name="bulb" size={16} color={activeFilter === 'tips' ? 'white' : Colors.gray500} />
          <Text style={[styles.filterText, activeFilter === 'tips' && styles.filterTextActive]}>Tips</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'questions' && styles.filterTabActive]}
          onPress={() => setActiveFilter('questions')}
        >
          <Ionicons name="help-circle" size={16} color={activeFilter === 'questions' ? 'white' : Colors.gray500} />
          <Text style={[styles.filterText, activeFilter === 'questions' && styles.filterTextActive]}>Q&A</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseComments}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={handleCloseComments} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.gray700} />
            </TouchableOpacity>
          </View>

          {selectedPost && (
            <>
              {/* Original Post Preview */}
              <View style={styles.postPreviewInModal}>
                <Image
                  source={{ uri: selectedPost.authorImage }}
                  style={styles.postPreviewAvatar}
                />
                <View style={styles.postPreviewContent}>
                  <Text style={styles.postPreviewAuthor}>{selectedPost.author}</Text>
                  <Text style={styles.postPreviewTitle}>{selectedPost.title}</Text>
                </View>
              </View>

              {/* Comments List - Threaded */}
              <FlatList
                data={getThreadedComments(selectedPost.id)}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
                contentContainerStyle={styles.commentsListContent}
                renderItem={({ item }) => (
                  <CommentItem
                    comment={item}
                    onLike={() => toggleCommentLike(selectedPost.id, item.id)}
                    onReply={handleReply}
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyComments}>
                    <Ionicons name="chatbubble-outline" size={48} color={Colors.gray300} />
                    <Text style={styles.emptyCommentsText}>No comments yet</Text>
                    <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
                  </View>
                }
              />

              {/* Comment Input */}
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={10}
              >
                <View style={styles.commentInputContainer}>
                  {replyingTo && (
                    <View style={styles.replyingToBar}>
                      <Text style={styles.replyingToText}>
                        Replying to <Text style={styles.replyingToName}>{replyingTo.author}</Text>
                      </Text>
                      <TouchableOpacity onPress={() => { setReplyingTo(null); setNewComment(''); }}>
                        <Ionicons name="close-circle" size={20} color={Colors.gray400} />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.commentInputRow}>
                    <Image
                      source={{ uri: user.profileImage }}
                      style={styles.commentInputAvatar}
                    />
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor={Colors.gray400}
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                      onPress={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      <Ionicons
                        name="send"
                        size={20}
                        color={newComment.trim() ? Colors.primary : Colors.gray300}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </>
          )}
        </SafeAreaView>
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
  newPostButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    ...Typography.bodySmall,
    color: Colors.gray500,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  list: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  postMeta: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  authorName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeAgo: {
    ...Typography.caption,
    color: Colors.gray400,
  },
  postTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  postPreview: {
    ...Typography.body,
    color: Colors.gray600,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    gap: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    ...Typography.bodySmall,
    color: Colors.gray500,
  },
  likedText: {
    color: Colors.error,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  postPreviewInModal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.gray50,
  },
  postPreviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  postPreviewContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  postPreviewAuthor: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray900,
  },
  postPreviewTitle: {
    ...Typography.caption,
    color: Colors.gray600,
    marginTop: 2,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    padding: Spacing.lg,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  replyItem: {
    marginLeft: 40,
    paddingLeft: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.gray200,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  commentContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray900,
  },
  commentTime: {
    ...Typography.caption,
    color: Colors.gray400,
    marginLeft: Spacing.sm,
  },
  commentText: {
    ...Typography.body,
    color: Colors.gray700,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    ...Typography.caption,
    color: Colors.gray400,
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyCommentsText: {
    ...Typography.body,
    color: Colors.gray500,
    marginTop: Spacing.md,
  },
  emptyCommentsSubtext: {
    ...Typography.caption,
    color: Colors.gray400,
    marginTop: 4,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.surface,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  replyingToBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  replyingToText: {
    ...Typography.caption,
    color: Colors.gray500,
  },
  replyingToName: {
    fontWeight: '600',
    color: Colors.primary,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    marginBottom: 4,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.gray900,
    maxHeight: 100,
  },
  sendButton: {
    padding: Spacing.sm,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CommunityScreen;
