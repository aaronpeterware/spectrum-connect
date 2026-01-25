import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { getUserId } from '../services/profileService';
import { COMMUNITY_USERS, SAMPLE_POSTS } from '../data/communityUsers';
import { sendPostLikeNotification, sendPostCommentNotification } from '../services/notificationService';

const STORAGE_KEYS = {
  POSTS: '@haven_posts',
  COMMENTS: '@haven_comments',
};

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: string;
  authorImage: string;
  text: string;
  likes: number;
  isLiked: boolean;
  timeAgo: string;
  createdAt: Date;
  replies: Comment[];
  parentId?: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: string;
  authorImage?: string;
  title: string;
  preview: string;
  likes: number;
  comments: number;
  category: string;
  timeAgo: string;
  createdAt: Date;
  isLiked: boolean;
  taggedUsers?: string[];
}

interface PostsContextType {
  posts: Post[];
  comments: Record<string, Comment[]>;
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'timeAgo' | 'createdAt' | 'isLiked' | 'authorId'>, authorName: string, authorImage: string) => void;
  toggleLike: (postId: string) => void;
  getPost: (postId: string) => Post | undefined;
  getComments: (postId: string) => Comment[];
  addComment: (postId: string, text: string, authorName: string, authorImage: string, parentId?: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  deletePost: (postId: string) => void;
  updatePost: (postId: string, updates: { title: string; preview: string; category: string }) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

// Use community users from data file
const sampleUsers = COMMUNITY_USERS.map(user => ({
  id: user.id,
  name: user.name,
  avatar: user.profileImage,
}));

// Map community category to app category
const categoryMap: Record<string, string> = {
  'success': 'wins',
  'question': 'questions',
  'tip': 'tips',
  'vent': 'stories',
  'introduction': 'stories',
};

// Generate initial posts from community data
const initialPosts: Post[] = SAMPLE_POSTS.slice(0, 5).map((post, index) => {
  const author = COMMUNITY_USERS.find(u => u.id === post.authorId) || COMMUNITY_USERS[index % COMMUNITY_USERS.length];
  const hoursDiff = [2, 5, 24, 48, 72][index];
  return {
    id: post.id,
    authorId: post.authorId,
    author: author.name,
    authorImage: author.profileImage,
    title: post.content.slice(0, 50) + (post.content.length > 50 ? '...' : ''),
    preview: post.content,
    likes: post.likes,
    comments: post.comments.length,
    category: categoryMap[post.category] || 'stories',
    timeAgo: hoursDiff < 24 ? `${hoursDiff}h ago` : `${Math.floor(hoursDiff / 24)}d ago`,
    createdAt: new Date(Date.now() - hoursDiff * 60 * 60 * 1000),
    isLiked: false,
  };
});

// Generate initial comments from community data
const initialComments: Record<string, Comment[]> = {};
SAMPLE_POSTS.slice(0, 5).forEach(post => {
  initialComments[post.id] = post.comments.map((comment, idx) => {
    const author = COMMUNITY_USERS.find(u => u.id === comment.authorId) || COMMUNITY_USERS[idx % COMMUNITY_USERS.length];
    return {
      id: comment.id,
      postId: post.id,
      authorId: comment.authorId,
      author: author.name,
      authorImage: author.profileImage,
      text: comment.content,
      likes: comment.likes,
      isLiked: false,
      timeAgo: '1h ago',
      createdAt: new Date(comment.createdAt),
      replies: [],
    };
  });
});

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [comments, setComments] = useState<Record<string, Comment[]>>(initialComments);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved data on mount - try Supabase first, then local cache
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const userId = await getUserId();

        // Try to load from Supabase first
        const { data: supabasePosts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabasePosts && supabasePosts.length > 0 && !postsError) {
          // Map Supabase posts to our format
          const mappedPosts: Post[] = supabasePosts.map((post: any) => ({
            id: post.id,
            authorId: post.user_id,
            author: post.author_name || 'Anonymous',
            authorImage: post.author_image,
            title: post.title || post.content?.slice(0, 50) || '',
            preview: post.content || '',
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
            category: post.category || 'stories',
            timeAgo: getTimeAgo(new Date(post.created_at)),
            createdAt: new Date(post.created_at),
            isLiked: false, // Will be updated when we load user likes
          }));

          // Merge with sample posts (keeping unique posts)
          const existingIds = new Set(mappedPosts.map(p => p.id));
          const uniqueInitialPosts = initialPosts.filter(p => !existingIds.has(p.id));
          setPosts([...mappedPosts, ...uniqueInitialPosts]);

          // Cache locally
          await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([...mappedPosts, ...uniqueInitialPosts]));
        } else {
          // Fall back to local storage
          const savedPosts = await AsyncStorage.getItem(STORAGE_KEYS.POSTS);
          if (savedPosts) {
            const parsedPosts = JSON.parse(savedPosts).map((post: any) => ({
              ...post,
              createdAt: new Date(post.createdAt),
            }));
            setPosts(parsedPosts);
          }
        }

        // Load comments from Supabase
        const { data: supabaseComments, error: commentsError } = await supabase
          .from('post_comments')
          .select('*')
          .order('created_at', { ascending: true });

        if (supabaseComments && supabaseComments.length > 0 && !commentsError) {
          const mappedComments: Record<string, Comment[]> = { ...initialComments };

          supabaseComments.forEach((comment: any) => {
            const mapped: Comment = {
              id: comment.id,
              postId: comment.post_id,
              authorId: comment.user_id,
              author: comment.author_name || 'Anonymous',
              authorImage: comment.author_image || '',
              text: comment.content,
              likes: comment.likes_count || 0,
              isLiked: false,
              timeAgo: getTimeAgo(new Date(comment.created_at)),
              createdAt: new Date(comment.created_at),
              replies: [],
              parentId: comment.parent_id,
            };

            if (!mappedComments[comment.post_id]) {
              mappedComments[comment.post_id] = [];
            }
            mappedComments[comment.post_id].push(mapped);
          });

          setComments(mappedComments);
          await AsyncStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(mappedComments));
        } else {
          // Fall back to local storage
          const savedComments = await AsyncStorage.getItem(STORAGE_KEYS.COMMENTS);
          if (savedComments) {
            const parsedComments = JSON.parse(savedComments);
            Object.keys(parsedComments).forEach(postId => {
              parsedComments[postId] = parsedComments[postId].map((comment: any) => ({
                ...comment,
                createdAt: new Date(comment.createdAt),
              }));
            });
            setComments(parsedComments);
          }
        }
      } catch (error) {
        if (__DEV__) console.log('Error loading posts data:', error);

        // Fall back to local cache on error
        try {
          const savedPosts = await AsyncStorage.getItem(STORAGE_KEYS.POSTS);
          if (savedPosts) {
            const parsedPosts = JSON.parse(savedPosts).map((post: any) => ({
              ...post,
              createdAt: new Date(post.createdAt),
            }));
            setPosts(parsedPosts);
          }
        } catch (e) {
          console.log('Error loading local posts cache:', e);
        }
      } finally {
        setIsLoaded(true);
      }
    };

    loadSavedData();
  }, []);

  // Save posts whenever they change (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    const savePosts = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      } catch (error) {
        if (__DEV__) console.log('Error saving posts:', error);
      }
    };
    savePosts();
  }, [posts, isLoaded]);

  // Save comments whenever they change (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    const saveComments = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
      } catch (error) {
        if (__DEV__) console.log('Error saving comments:', error);
      }
    };
    saveComments();
  }, [comments, isLoaded]);

  const addPost = useCallback(async (newPost: Omit<Post, 'id' | 'likes' | 'comments' | 'timeAgo' | 'createdAt' | 'isLiked' | 'authorId'>, authorName: string, authorImage: string) => {
    const userId = await getUserId();
    const postId = Date.now().toString();

    const post: Post = {
      ...newPost,
      id: postId,
      authorId: userId,
      author: authorName,
      authorImage: authorImage,
      likes: 0,
      comments: 0,
      timeAgo: 'Just now',
      createdAt: new Date(),
      isLiked: false,
    };

    // Add to local state immediately
    setPosts(prev => [post, ...prev]);
    setComments(prev => ({ ...prev, [post.id]: [] }));

    // Save to Supabase in background
    try {
      await supabase.from('posts').insert({
        id: postId,
        user_id: userId,
        author_name: authorName,
        author_image: authorImage,
        title: newPost.title,
        content: newPost.preview,
        category: newPost.category,
        likes_count: 0,
        comments_count: 0,
      });
    } catch (error) {
      console.log('Error saving post to Supabase:', error);
    }
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    const userId = await getUserId();
    const post = posts.find(p => p.id === postId);
    const wasLiked = post?.isLiked;

    // Update local state immediately
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1,
        };
      }
      return p;
    }));

    // Sync with Supabase in background
    try {
      if (wasLiked) {
        // Unlike - remove from post_likes
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        // Update likes count
        await supabase
          .from('posts')
          .update({ likes_count: Math.max(0, (post?.likes || 1) - 1) })
          .eq('id', postId);
      } else {
        // Like - add to post_likes
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });

        // Update likes count
        await supabase
          .from('posts')
          .update({ likes_count: (post?.likes || 0) + 1 })
          .eq('id', postId);

        // Send notification to post author (if not liking own post)
        if (post && post.authorId !== userId) {
          // Get liker's profile for notification
          const { data: likerProfile } = await supabase
            .from('user_profiles')
            .select('name')
            .eq('id', userId)
            .single();

          const likerName = likerProfile?.name || 'Someone';
          sendPostLikeNotification(post.authorId, likerName, postId);
        }
      }
    } catch (error) {
      console.log('Error syncing like to Supabase:', error);
    }
  }, [posts]);

  const getPost = useCallback((postId: string) => {
    return posts.find(p => p.id === postId);
  }, [posts]);

  const getComments = useCallback((postId: string) => {
    return comments[postId] || [];
  }, [comments]);

  const addComment = useCallback(async (postId: string, text: string, authorName: string, authorImage: string, parentId?: string) => {
    const userId = await getUserId();
    const commentId = `c${Date.now()}`;

    const newComment: Comment = {
      id: commentId,
      postId,
      authorId: userId,
      author: authorName,
      authorImage: authorImage,
      text,
      likes: 0,
      isLiked: false,
      timeAgo: 'Just now',
      createdAt: new Date(),
      replies: [],
      parentId,
    };

    // Add to local state immediately
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    // Update comment count on post
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, comments: post.comments + 1 };
      }
      return post;
    }));

    // Save to Supabase in background
    try {
      await supabase.from('post_comments').insert({
        id: commentId,
        post_id: postId,
        user_id: userId,
        author_name: authorName,
        author_image: authorImage,
        content: text,
        parent_id: parentId,
        likes_count: 0,
      });

      // Update post comments count in Supabase
      const post = posts.find(p => p.id === postId);
      if (post) {
        await supabase
          .from('posts')
          .update({ comments_count: post.comments + 1 })
          .eq('id', postId);

        // Send notification to post author (if not commenting on own post)
        if (post.authorId !== userId) {
          sendPostCommentNotification(post.authorId, authorName, postId);
        }
      }
    } catch (error) {
      console.log('Error saving comment to Supabase:', error);
    }
  }, [posts]);

  const toggleCommentLike = useCallback((postId: string, commentId: string) => {
    setComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        return comment;
      }),
    }));
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    // Update local state immediately
    setPosts(prev => prev.filter(post => post.id !== postId));
    setComments(prev => {
      const newComments = { ...prev };
      delete newComments[postId];
      return newComments;
    });

    // Delete from Supabase in background
    try {
      await supabase.from('posts').delete().eq('id', postId);
    } catch (error) {
      console.log('Error deleting post from Supabase:', error);
    }
  }, []);

  const updatePost = useCallback(async (postId: string, updates: { title: string; preview: string; category: string }) => {
    // Update local state immediately
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          title: updates.title,
          preview: updates.preview,
          category: updates.category,
        };
      }
      return post;
    }));

    // Update in Supabase
    try {
      await supabase
        .from('posts')
        .update({
          title: updates.title,
          content: updates.preview,
          category: updates.category,
        })
        .eq('id', postId);
    } catch (error) {
      console.log('Error updating post in Supabase:', error);
    }
  }, []);

  // Update timeAgo periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPosts(prev => prev.map(post => ({
        ...post,
        timeAgo: getTimeAgo(post.createdAt),
      })));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <PostsContext.Provider value={{
      posts,
      comments,
      addPost,
      toggleLike,
      getPost,
      getComments,
      addComment,
      toggleCommentLike,
      deletePost,
      updatePost,
    }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}
