import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { usePosts } from '../context/PostsContext';
import { useUser } from '../context/UserContext';

const categories = [
  { id: 'wins', label: 'Wins', icon: 'trophy' as const },
  { id: 'tips', label: 'Tips', icon: 'bulb' as const },
  { id: 'questions', label: 'Questions', icon: 'help-circle' as const },
  { id: 'stories', label: 'Stories', icon: 'book' as const },
];

// Sample users for tagging
const sampleUsers = [
  { id: '1', name: 'Sarah Mitchell', username: '@sarah_m', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
  { id: '2', name: 'Mike Thompson', username: '@mike_t', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
  { id: '3', name: 'Emma Lawrence', username: '@emma_l', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face' },
  { id: '4', name: 'David Kim', username: '@david_k', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
  { id: '5', name: 'Jessica Chen', username: '@jess_c', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face' },
  { id: '6', name: 'Alex Rivera', username: '@alex_r', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
  { id: '7', name: 'Rachel Green', username: '@rachel_g', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
  { id: '8', name: 'James Wilson', username: '@james_w', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' },
];

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const { addPost } = usePosts();
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const contentInputRef = useRef<TextInput>(null);

  const canPost = title.trim().length > 0 && content.trim().length > 0 && selectedCategory;

  const filteredUsers = sampleUsers.filter(
    user =>
      !taggedUsers.find(t => t.id === user.id) &&
      (user.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
        user.username.toLowerCase().includes(tagSearch.toLowerCase()))
  );

  const handleTagUser = (user: User) => {
    setTaggedUsers(prev => [...prev, user]);
    setTagSearch('');
    setShowTagModal(false);

    // Simulate sending notification
    // Notification would be sent to tagged users in production
  };

  const handleRemoveTag = (userId: string) => {
    setTaggedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handlePost = () => {
    if (!canPost) return;

    // Add the post using context with the current user's info
    addPost(
      {
        author: user.name,
        authorImage: user.profileImage,
        title: title.trim(),
        preview: content.trim(),
        category: selectedCategory,
        taggedUsers: taggedUsers.map(u => u.name),
      },
      user.name,
      user.profileImage
    );

    // Show success and notify tagged users
    const tagMessage = taggedUsers.length > 0
      ? `\n\nNotifications sent to: ${taggedUsers.map(u => u.name).join(', ')}`
      : '';

    Alert.alert(
      'Post Created!',
      `Your post has been shared with the community.${tagMessage}`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleContentChange = useCallback((text: string) => {
    setContent(text);

    // Check if user typed @ to trigger tag modal
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = text.slice(lastAtIndex + 1);
      // If @ is at end or followed by search text without space
      if (textAfterAt === '' || (!textAfterAt.includes(' ') && textAfterAt.length < 20)) {
        setTagSearch(textAfterAt);
        setShowTagModal(true);
      }
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.gray600} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          style={[styles.postButton, !canPost && styles.postButtonDisabled]}
        >
          <LinearGradient
            colors={canPost ? [Colors.gradientPurple, Colors.gradientBlue] : [Colors.gray300, Colors.gray300]}
            style={styles.postButtonGradient}
          >
            <Text style={styles.postButtonText}>Post</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Selection */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon}
                size={18}
                color={selectedCategory === category.id ? Colors.primary : Colors.gray500}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelSelected,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title Input */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="What's your post about?"
          placeholderTextColor={Colors.gray400}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Text style={styles.charCount}>{title.length}/100</Text>

        {/* Content Input */}
        <Text style={styles.label}>Your Story</Text>
        <TextInput
          ref={contentInputRef}
          style={styles.contentInput}
          placeholder="Share your experience, tips, or ask a question... Use @ to tag someone"
          placeholderTextColor={Colors.gray400}
          value={content}
          onChangeText={handleContentChange}
          multiline
          maxLength={2000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{content.length}/2000</Text>

        {/* Tag Users Section */}
        <View style={styles.tagSection}>
          <View style={styles.tagHeader}>
            <Text style={styles.label}>Tag People</Text>
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => setShowTagModal(true)}
            >
              <Ionicons name="person-add" size={18} color={Colors.primary} />
              <Text style={styles.addTagText}>Add</Text>
            </TouchableOpacity>
          </View>

          {taggedUsers.length > 0 && (
            <View style={styles.taggedUsersContainer}>
              {taggedUsers.map((user) => (
                <View key={user.id} style={styles.taggedUserChip}>
                  <Image source={{ uri: user.avatar }} style={styles.taggedUserAvatar} />
                  <Text style={styles.taggedUserName}>{user.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveTag(user.id)}
                    style={styles.removeTagButton}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.gray500} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Community Guidelines</Text>
            <Text style={styles.tipsText}>
              {'\u2022'} Be supportive and encouraging{'\n'}
              {'\u2022'} Share genuine experiences{'\n'}
              {'\u2022'} Respect others' privacy{'\n'}
              {'\u2022'} Keep it positive and helpful
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Tag User Modal */}
      <Modal
        visible={showTagModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTagModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tag People</Text>
            <TouchableOpacity onPress={() => setShowTagModal(false)}>
              <Ionicons name="close" size={24} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor={Colors.gray400}
              value={tagSearch}
              onChangeText={setTagSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userRow}
                onPress={() => handleTagUser(item)}
              >
                <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userUsername}>{item.username}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noResults}>No users found</Text>
            }
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  postButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  postButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
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
  categoryChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  categoryLabel: {
    ...Typography.body,
    color: Colors.gray500,
  },
  categoryLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  titleInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  contentInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
    minHeight: 150,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  charCount: {
    ...Typography.caption,
    color: Colors.gray400,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  tagSection: {
    marginTop: Spacing.md,
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  addTagText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  taggedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  taggedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.xs,
  },
  taggedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  taggedUserName: {
    ...Typography.bodySmall,
    color: Colors.gray700,
  },
  removeTagButton: {
    marginLeft: 2,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}10`,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  tipsContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  tipsTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  tipsText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    lineHeight: 22,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.gray900,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    ...Typography.body,
    color: Colors.gray900,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gray900,
  },
  userUsername: {
    ...Typography.bodySmall,
    color: Colors.gray500,
  },
  noResults: {
    ...Typography.body,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});

export default CreatePostScreen;
