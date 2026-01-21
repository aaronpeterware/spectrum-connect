import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { usePosts, Post, Comment } from '../context/PostsContext';
import { useUser } from '../context/UserContext';

type RouteParams = {
  PostDetail: {
    postId: string;
  };
};

type RootStackParamList = {
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

// Comment Item Component
const CommentItem = ({
  comment,
  onLike,
  onReply,
  onProfilePress,
}: {
  comment: Comment;
  onLike: () => void;
  onReply: (commentId: string, author: string) => void;
  onProfilePress: (userId: string, name: string, avatar: string) => void;
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
      <TouchableOpacity onPress={() => onProfilePress(comment.authorId, comment.author, comment.authorImage)}>
        <Image source={{ uri: comment.authorImage }} style={styles.commentAvatar} />
      </TouchableOpacity>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <TouchableOpacity onPress={() => onProfilePress(comment.authorId, comment.author, comment.authorImage)}>
            <Text style={styles.commentAuthor}>{comment.author}</Text>
          </TouchableOpacity>
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

const PostDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'PostDetail'>>();
  const { postId } = route.params;

  const { posts, toggleLike, getComments, addComment, toggleCommentLike } = usePosts();
  const { user } = useUser();
  const post = posts.find(p => p.id === postId);

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const likeScaleAnim = useRef(new Animated.Value(1)).current;

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(likeScaleAnim, {
        toValue: 1.3,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(likeScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
    toggleLike(post.id);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(post.id, newComment.trim(), user.name, user.profileImage, replyingTo?.id);
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const handleReply = (commentId: string, author: string) => {
    setReplyingTo({ id: commentId, author });
    setNewComment(`@${author} `);
  };

  const handleProfilePress = (userId: string, name: string, avatar: string) => {
    navigation.navigate('UserProfile', { userId, name, avatar });
  };

  // Organize comments into threaded structure
  const getThreadedComments = () => {
    const allComments = getComments(post.id);
    const parentComments = allComments.filter(c => !c.parentId);
    const threadedComments: Comment[] = [];

    parentComments.forEach(parent => {
      threadedComments.push(parent);
      const replies = allComments.filter(c => c.parentId === parent.id);
      replies.forEach(reply => threadedComments.push(reply));
    });

    return threadedComments;
  };

  const comments = getThreadedComments();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.gray600} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={10}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Post Content */}
          <View style={styles.postContainer}>
            {/* Author Header */}
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => handleProfilePress(post.authorId, post.author, post.authorImage || '')}
            >
              {post.authorImage ? (
                <Image source={{ uri: post.authorImage }} style={styles.authorAvatar} />
              ) : (
                <LinearGradient
                  colors={[Colors.gradientPink, Colors.gradientPurple]}
                  style={styles.authorAvatar}
                >
                  <Text style={styles.avatarText}>{post.author[0]}</Text>
                </LinearGradient>
              )}
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{post.author}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: `${categoryColors[post.category]}15` }]}>
                    <Ionicons
                      name={categoryIcons[post.category]}
                      size={12}
                      color={categoryColors[post.category]}
                    />
                    <Text style={[styles.categoryText, { color: categoryColors[post.category] }]}>
                      {post.category}
                    </Text>
                  </View>
                  <Text style={styles.timeAgo}>{post.timeAgo}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Post Title & Content */}
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.preview}</Text>

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Animated.View style={{ transform: [{ scale: likeScaleAnim }] }}>
                  <Ionicons
                    name={post.isLiked ? 'heart' : 'heart-outline'}
                    size={24}
                    color={post.isLiked ? Colors.error : Colors.gray500}
                  />
                </Animated.View>
                <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
                  {post.likes} likes
                </Text>
              </TouchableOpacity>
              <View style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={22} color={Colors.gray500} />
                <Text style={styles.actionText}>{post.comments} comments</Text>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comments</Text>

            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-outline" size={40} color={Colors.gray300} />
                <Text style={styles.emptyText}>No comments yet</Text>
                <Text style={styles.emptySubtext}>Be the first to comment!</Text>
              </View>
            ) : (
              comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onLike={() => toggleCommentLike(post.id, comment.id)}
                  onReply={handleReply}
                  onProfilePress={handleProfilePress}
                />
              ))
            )}
          </View>

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Comment Input */}
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
              style={styles.inputAvatar}
            />
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    ...Typography.body,
    color: Colors.gray500,
  },
  postContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  authorInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  authorName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  metaRow: {
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
    ...Typography.h2,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  postContent: {
    ...Typography.body,
    color: Colors.gray700,
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },
  postActions: {
    flexDirection: 'row',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    gap: Spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    ...Typography.body,
    color: Colors.gray500,
  },
  likedText: {
    color: Colors.error,
    fontWeight: '600',
  },
  commentsSection: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
    padding: Spacing.lg,
  },
  commentsTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.lg,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.gray500,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.gray400,
    marginTop: 4,
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
    borderRadius: 12,
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
  inputAvatar: {
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

export default PostDetailScreen;
