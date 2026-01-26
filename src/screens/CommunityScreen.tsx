import React, { useRef, useState, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, ThemeColors } from '../constants/theme';
import { usePosts, Post, Comment } from '../context/PostsContext';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../hooks/useTheme';
import MenuModal from '../components/MenuModal';
import {
  trackPostLiked,
  trackScreen,
} from '../services/analyticsService';

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
  isOwnPost: boolean;
  onMenuPress: (post: Post) => void;
  onReportPress: (post: Post) => void;
  currentUserImage?: string;
  colors: any;
  isDark: boolean;
}

const PostCard = ({ item, onLike, onComment, onPostPress, onAuthorPress, isOwnPost, onMenuPress, onReportPress, currentUserImage, colors, isDark }: PostCardProps) => {
  // Use current user's image for their own posts (in case it was updated after post creation)
  // Ensure we have a valid non-empty image URL, otherwise show gradient fallback
  const userImg = isOwnPost && currentUserImage && currentUserImage.trim() ? currentUserImage : null;
  const postImg = item.authorImage && item.authorImage.trim() ? item.authorImage : null;
  const displayImage = userImg || postImg;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imageError, setImageError] = useState(false);

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
    <TouchableOpacity
      style={[styles.postCard, { backgroundColor: colors.cardBackground }]}
      activeOpacity={0.9}
      onPress={() => onPostPress(item.id)}
    >
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onAuthorPress(item.authorId, item.author, displayImage || '')}>
          {displayImage && displayImage.length > 0 && !imageError ? (
            <Image
              source={{ uri: displayImage }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <LinearGradient
              colors={[Colors.gradientPink, Colors.gradientPurple]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{item.author?.[0] || '?'}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.postMeta} onPress={() => onAuthorPress(item.authorId, item.author, displayImage || '')}>
          <Text style={[styles.authorName, { color: colors.text }]}>{item.author}</Text>
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
            <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>{item.timeAgo}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.postMenuButton}
          onPress={() => isOwnPost ? onMenuPress(item) : onReportPress(item)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.postTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.postPreview, { color: colors.textSecondary }]} numberOfLines={2}>{item.preview}</Text>
      <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? Colors.error : colors.textSecondary}
            />
          </Animated.View>
          <Text style={[styles.actionText, { color: colors.textSecondary }, item.isLiked && styles.likedText]}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onComment(item)}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.comments}</Text>
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

const categories = [
  { id: 'wins', label: 'Wins', icon: 'trophy' as const },
  { id: 'tips', label: 'Tips', icon: 'bulb' as const },
  { id: 'questions', label: 'Questions', icon: 'help-circle' as const },
  { id: 'stories', label: 'Stories', icon: 'book' as const },
];

const CommunityScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { posts, toggleLike, getComments, addComment, toggleCommentLike, deletePost, updatePost } = usePosts();
  const { user, userId } = useUser();
  const { triggerHaptic } = useSettings();
  const { colors, isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [postMenuPost, setPostMenuPost] = useState<Post | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [reportMenuVisible, setReportMenuVisible] = useState(false);
  const [reportMenuPost, setReportMenuPost] = useState<Post | null>(null);

  const filteredPosts = activeFilter === 'all'
    ? posts
    : posts.filter(p => p.category === activeFilter);

  // Wrapper for toggleLike with haptic feedback
  const handleLikeWithHaptic = (postId: string) => {
    triggerHaptic('light');
    trackPostLiked(postId);
    toggleLike(postId);
  };

  // Wrapper for filter selection with haptic feedback
  const handleFilterChange = (filter: string) => {
    triggerHaptic('selection');
    setActiveFilter(filter);
  };

  const handleOpenComments = (post: Post) => {
    triggerHaptic('light');
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
      triggerHaptic('light');
      addComment(selectedPost.id, newComment.trim(), user.name, user.profileImage, replyingTo?.id);
      setNewComment('');
      setReplyingTo(null);
    }
  };

  // Wrapper for comment likes with haptic feedback
  const handleCommentLikeWithHaptic = (postId: string, commentId: string) => {
    triggerHaptic('light');
    toggleCommentLike(postId, commentId);
  };

  const handleReply = (commentId: string, author: string) => {
    setReplyingTo({ id: commentId, author });
    setNewComment(`@${author} `);
  };

  const handlePostPress = (postId: string) => {
    (navigation as any).navigate('PostDetail', { postId });
  };

  const handleAuthorPress = (targetUserId: string, name: string, avatar: string) => {
    // Don't navigate if clicking on own profile
    if (targetUserId === userId) {
      (navigation as any).navigate('Profile');
      return;
    }
    (navigation as any).navigate('UserProfile', { userId: targetUserId, name, avatar });
  };

  const handlePostMenuPress = (post: Post) => {
    setPostMenuPost(post);
    setPostMenuVisible(true);
  };

  const handleDeletePost = () => {
    if (!postMenuPost) return;
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePost(postMenuPost.id);
            setPostMenuVisible(false);
            setPostMenuPost(null);
          },
        },
      ]
    );
  };

  const handleEditPost = () => {
    if (!postMenuPost) return;
    setEditTitle(postMenuPost.title);
    setEditContent(postMenuPost.preview);
    setEditCategory(postMenuPost.category);
    setPostMenuVisible(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!postMenuPost || !editTitle.trim() || !editContent.trim() || !editCategory) return;
    updatePost(postMenuPost.id, {
      title: editTitle.trim(),
      preview: editContent.trim(),
      category: editCategory,
    });
    setEditModalVisible(false);
    setPostMenuPost(null);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setPostMenuPost(null);
  };

  const handleReportMenuPress = (post: Post) => {
    setReportMenuPost(post);
    setReportMenuVisible(true);
  };

  const handleReportPost = () => {
    if (!reportMenuPost) return;
    Alert.alert(
      'Report Content',
      'Thank you for helping keep Haven safe. This content will be reviewed by our team within 24 hours.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setReportMenuVisible(false);
            setReportMenuPost(null);
          },
        },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            // In production, this would send to backend
            console.log('Reported post:', reportMenuPost.id);
            setReportMenuVisible(false);
            setReportMenuPost(null);
            Alert.alert('Report Submitted', 'Our team will review this content and take appropriate action.');
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    if (!reportMenuPost) return;
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${reportMenuPost.author}? You won't see their posts or messages anymore.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setReportMenuVisible(false);
            setReportMenuPost(null);
          },
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // In production, this would update backend and filter posts
            console.log('Blocked user:', reportMenuPost.authorId);
            setReportMenuVisible(false);
            setReportMenuPost(null);
            Alert.alert('User Blocked', `You have blocked ${reportMenuPost.author}. Their content has been removed from your feed.`);
          },
        },
      ]
    );
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

  const renderPost = ({ item }: { item: Post }) => {
    // Check if this is the user's own post - by ID match OR by name match (for legacy posts)
    const isOwnPost = item.authorId === userId || (user.name && item.author === user.name);

    return (
      <PostCard
        item={item}
        onLike={handleLikeWithHaptic}
        onComment={handleOpenComments}
        onPostPress={handlePostPress}
        onAuthorPress={handleAuthorPress}
        isOwnPost={isOwnPost}
        onMenuPress={handlePostMenuPress}
        onReportPress={handleReportMenuPress}
        currentUserImage={user.profileImage}
        colors={colors}
        isDark={isDark}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => (navigation as any).navigate('CreatePost')}
        >
          <Ionicons name="add" size={28} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoTextSpectrum, { color: colors.text }]}>Haven</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: activeFilter === 'all' ? Colors.primary : colors.surface },
          ]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterText, { color: activeFilter === 'all' ? 'white' : colors.textSecondary }]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: activeFilter === 'wins' ? Colors.primary : colors.surface },
          ]}
          onPress={() => handleFilterChange('wins')}
        >
          <Ionicons name="trophy" size={16} color={activeFilter === 'wins' ? 'white' : colors.textSecondary} />
          <Text style={[styles.filterText, { color: activeFilter === 'wins' ? 'white' : colors.textSecondary }]}>Wins</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: activeFilter === 'tips' ? Colors.primary : colors.surface },
          ]}
          onPress={() => handleFilterChange('tips')}
        >
          <Ionicons name="bulb" size={16} color={activeFilter === 'tips' ? 'white' : colors.textSecondary} />
          <Text style={[styles.filterText, { color: activeFilter === 'tips' ? 'white' : colors.textSecondary }]}>Tips</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: activeFilter === 'questions' ? Colors.primary : colors.surface },
          ]}
          onPress={() => handleFilterChange('questions')}
        >
          <Ionicons name="help-circle" size={16} color={activeFilter === 'questions' ? 'white' : colors.textSecondary} />
          <Text style={[styles.filterText, { color: activeFilter === 'questions' ? 'white' : colors.textSecondary }]}>Q&A</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: activeFilter === 'stories' ? Colors.primary : colors.surface },
          ]}
          onPress={() => handleFilterChange('stories')}
        >
          <Ionicons name="book" size={16} color={activeFilter === 'stories' ? 'white' : colors.textSecondary} />
          <Text style={[styles.filterText, { color: activeFilter === 'stories' ? 'white' : colors.textSecondary }]}>Stories</Text>
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
                    onLike={() => handleCommentLikeWithHaptic(selectedPost.id, item.id)}
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

      {/* Post Menu Modal */}
      <Modal
        visible={postMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPostMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.postMenuOverlay}
          activeOpacity={1}
          onPress={() => setPostMenuVisible(false)}
        >
          <View style={styles.postMenuContainer}>
            <View style={styles.postMenuHandle} />
            <TouchableOpacity style={styles.postMenuItem} onPress={handleEditPost}>
              <Ionicons name="pencil" size={22} color={Colors.primary} />
              <Text style={styles.postMenuItemText}>Edit Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postMenuItem} onPress={handleDeletePost}>
              <Ionicons name="trash" size={22} color={Colors.error} />
              <Text style={[styles.postMenuItemText, { color: Colors.error }]}>Delete Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postMenuItem, styles.postMenuItemCancel]}
              onPress={() => setPostMenuVisible(false)}
            >
              <Text style={styles.postMenuItemCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Post Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseEditModal}
      >
        <SafeAreaView style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity onPress={handleCloseEditModal}>
              <Text style={styles.editModalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Edit Post</Text>
            <TouchableOpacity
              onPress={handleSaveEdit}
              disabled={!editTitle.trim() || !editContent.trim() || !editCategory}
            >
              <Text style={[
                styles.editModalSave,
                (!editTitle.trim() || !editContent.trim() || !editCategory) && styles.editModalSaveDisabled
              ]}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editModalContent}>
            <Text style={styles.editModalLabel}>Category</Text>
            <View style={styles.editCategoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.editCategoryChip,
                    editCategory === category.id && styles.editCategoryChipSelected,
                  ]}
                  onPress={() => setEditCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon}
                    size={16}
                    color={editCategory === category.id ? Colors.primary : Colors.gray500}
                  />
                  <Text
                    style={[
                      styles.editCategoryLabel,
                      editCategory === category.id && styles.editCategoryLabelSelected,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.editModalLabel}>Title</Text>
            <TextInput
              style={styles.editTitleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              maxLength={100}
              placeholder="Title"
              placeholderTextColor={Colors.gray400}
            />

            <Text style={styles.editModalLabel}>Content</Text>
            <TextInput
              style={styles.editContentInput}
              value={editContent}
              onChangeText={setEditContent}
              maxLength={2000}
              multiline
              textAlignVertical="top"
              placeholder="Content"
              placeholderTextColor={Colors.gray400}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Report/Block Menu Modal */}
      <Modal
        visible={reportMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReportMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.postMenuOverlay}
          activeOpacity={1}
          onPress={() => setReportMenuVisible(false)}
        >
          <View style={styles.postMenuContainer}>
            <View style={styles.postMenuHandle} />
            <TouchableOpacity style={styles.postMenuItem} onPress={handleReportPost}>
              <Ionicons name="flag" size={22} color={Colors.warning} />
              <Text style={[styles.postMenuItemText, { color: Colors.warning }]}>Report Content</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postMenuItem} onPress={handleBlockUser}>
              <Ionicons name="ban" size={22} color={Colors.error} />
              <Text style={[styles.postMenuItemText, { color: Colors.error }]}>Block User</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postMenuItem, styles.postMenuItemCancel]}
              onPress={() => setReportMenuVisible(false)}
            >
              <Text style={styles.postMenuItemCancelText}>Cancel</Text>
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
    gap: 4,
  },
  filterText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  list: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  postCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
  },
  postTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  postPreview: {
    ...Typography.body,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    ...Typography.bodySmall,
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
  // Post menu button styles
  postMenuButton: {
    padding: Spacing.xs,
  },
  // Post menu modal styles
  postMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  postMenuContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: Spacing.md,
  },
  postMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  postMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  postMenuItemText: {
    ...Typography.body,
    color: Colors.gray900,
    fontWeight: '500',
  },
  postMenuItemCancel: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    justifyContent: 'center',
  },
  postMenuItemCancelText: {
    ...Typography.body,
    color: Colors.gray500,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Edit modal styles
  editModalContainer: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  editModalTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  editModalCancel: {
    ...Typography.body,
    color: Colors.gray500,
  },
  editModalSave: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  editModalSaveDisabled: {
    color: Colors.gray300,
  },
  editModalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  editModalLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  editCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  editCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.gray200,
    gap: Spacing.xs,
  },
  editCategoryChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  editCategoryLabel: {
    ...Typography.body,
    color: Colors.gray500,
  },
  editCategoryLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  editTitleInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  editContentInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
    minHeight: 150,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
});

export default CommunityScreen;
