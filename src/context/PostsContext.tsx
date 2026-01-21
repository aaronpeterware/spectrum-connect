import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  POSTS: '@spectrum_posts',
  COMMENTS: '@spectrum_comments',
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
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

// Sample user data with IDs and Unsplash avatars
const sampleUsers = [
  { id: 'user1', name: 'Sarah Mitchell', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
  { id: 'user2', name: 'Mike Thompson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
  { id: 'user3', name: 'Emma Lawrence', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face' },
  { id: 'user4', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
  { id: 'user5', name: 'Jessica Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face' },
  { id: 'user6', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
  { id: 'user7', name: 'Rachel Green', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
  { id: 'user8', name: 'Jordan Taylor', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' },
];

const initialPosts: Post[] = [
  {
    id: '1',
    authorId: 'user1',
    author: 'Sarah Mitchell',
    authorImage: sampleUsers[0].avatar,
    title: 'First date success story!',
    preview: 'After practicing with the AI companions for weeks, I finally had the confidence to go on my first date in years. It went amazing! We talked for hours about everything - travel, food, our dreams. The conversation just flowed naturally. I think what helped most was all the practice I got here. Thank you all for the support!',
    likes: 42,
    comments: 3,
    category: 'wins',
    timeAgo: '2h ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isLiked: false,
  },
  {
    id: '2',
    authorId: 'user2',
    author: 'Mike Thompson',
    authorImage: sampleUsers[1].avatar,
    title: 'Tips for conversation starters',
    preview: 'Here are some openers that have worked really well for me. The key is to be genuine and show interest in the other person. Ask open-ended questions about their passions. Comment on something specific about them. And most importantly, listen actively and ask follow-up questions!',
    likes: 89,
    comments: 4,
    category: 'tips',
    timeAgo: '5h ago',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isLiked: false,
  },
  {
    id: '3',
    authorId: 'user3',
    author: 'Emma Lawrence',
    authorImage: sampleUsers[2].avatar,
    title: 'Dealing with rejection',
    preview: "It happens to everyone. Here's how I learned to handle it and not let it affect my confidence. First, remember that rejection is not a reflection of your worth. Second, give yourself time to feel the disappointment, but don't dwell on it. Third, focus on what you can learn from the experience.",
    likes: 156,
    comments: 5,
    category: 'stories',
    timeAgo: '1d ago',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isLiked: false,
  },
  {
    id: '4',
    authorId: 'user4',
    author: 'David Kim',
    authorImage: sampleUsers[3].avatar,
    title: 'How do you handle awkward silences?',
    preview: "I always freeze up when there's a pause in conversation. Any tips from the community? I've tried having backup topics ready but I always forget them in the moment. Would love to hear what works for you all!",
    likes: 34,
    comments: 3,
    category: 'questions',
    timeAgo: '2d ago',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    isLiked: false,
  },
  {
    id: '5',
    authorId: 'user5',
    author: 'Jessica Chen',
    authorImage: sampleUsers[4].avatar,
    title: 'Finally asked someone out!',
    preview: 'Thanks to everyone here for the encouragement. I took the plunge and asked my coworker to coffee. She said yes! I was so nervous but I remembered all the advice about being confident and genuine. We\'re meeting this Saturday!',
    likes: 234,
    comments: 2,
    category: 'wins',
    timeAgo: '3d ago',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    isLiked: false,
  },
];

// Initial comments for posts
const initialComments: Record<string, Comment[]> = {
  '1': [
    { id: 'c1', postId: '1', authorId: 'user2', author: 'Mike Thompson', authorImage: sampleUsers[1].avatar, text: 'Congratulations! This is so inspiring!', likes: 5, isLiked: false, timeAgo: '1h ago', createdAt: new Date(Date.now() - 60 * 60 * 1000), replies: [] },
    { id: 'c2', postId: '1', authorId: 'user3', author: 'Emma Lawrence', authorImage: sampleUsers[2].avatar, text: 'So happy for you! Keep us posted on how it goes!', likes: 3, isLiked: false, timeAgo: '1h ago', createdAt: new Date(Date.now() - 65 * 60 * 1000), replies: [] },
    { id: 'c3', postId: '1', authorId: 'user4', author: 'David Kim', authorImage: sampleUsers[3].avatar, text: 'This gives me hope! Thanks for sharing.', likes: 2, isLiked: false, timeAgo: '30m ago', createdAt: new Date(Date.now() - 30 * 60 * 1000), replies: [] },
  ],
  '2': [
    { id: 'c4', postId: '2', authorId: 'user1', author: 'Sarah Mitchell', authorImage: sampleUsers[0].avatar, text: 'These are great tips! The one about asking follow-up questions really works.', likes: 8, isLiked: false, timeAgo: '4h ago', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), replies: [] },
    { id: 'c5', postId: '2', authorId: 'user5', author: 'Jessica Chen', authorImage: sampleUsers[4].avatar, text: 'I tried the compliment one and it worked perfectly!', likes: 4, isLiked: false, timeAgo: '3h ago', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), replies: [] },
    { id: 'c6', postId: '2', authorId: 'user6', author: 'Alex Rivera', authorImage: sampleUsers[5].avatar, text: 'Could you share more examples?', likes: 2, isLiked: false, timeAgo: '2h ago', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), replies: [] },
    { id: 'c7', postId: '2', authorId: 'user2', author: 'Mike Thompson', authorImage: sampleUsers[1].avatar, text: '@Alex Sure! I\'ll make a follow-up post with more details.', likes: 6, isLiked: false, timeAgo: '1h ago', createdAt: new Date(Date.now() - 60 * 60 * 1000), replies: [], parentId: 'c6' },
  ],
  '3': [
    { id: 'c8', postId: '3', authorId: 'user4', author: 'David Kim', authorImage: sampleUsers[3].avatar, text: 'This is exactly what I needed to read today. Thank you.', likes: 12, isLiked: false, timeAgo: '20h ago', createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000), replies: [] },
    { id: 'c9', postId: '3', authorId: 'user1', author: 'Sarah Mitchell', authorImage: sampleUsers[0].avatar, text: 'Rejection is just redirection!', likes: 15, isLiked: false, timeAgo: '18h ago', createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000), replies: [] },
    { id: 'c10', postId: '3', authorId: 'user2', author: 'Mike Thompson', authorImage: sampleUsers[1].avatar, text: 'Great perspective. It took me a while to learn this.', likes: 7, isLiked: false, timeAgo: '12h ago', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), replies: [] },
    { id: 'c11', postId: '3', authorId: 'user7', author: 'Rachel Green', authorImage: sampleUsers[6].avatar, text: 'Could you share what specifically helped you the most?', likes: 4, isLiked: false, timeAgo: '8h ago', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), replies: [] },
    { id: 'c12', postId: '3', authorId: 'user3', author: 'Emma Lawrence', authorImage: sampleUsers[2].avatar, text: '@Rachel Definitely journaling and talking to friends. Will share more in a future post!', likes: 9, isLiked: false, timeAgo: '6h ago', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), replies: [], parentId: 'c11' },
  ],
  '4': [
    { id: 'c13', postId: '4', authorId: 'user3', author: 'Emma Lawrence', authorImage: sampleUsers[2].avatar, text: 'I usually ask a fun question like "What\'s the best meal you\'ve had recently?"', likes: 11, isLiked: false, timeAgo: '1d ago', createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000), replies: [] },
    { id: 'c14', postId: '4', authorId: 'user2', author: 'Mike Thompson', authorImage: sampleUsers[1].avatar, text: 'Embrace the silence! Sometimes it\'s okay to just be present.', likes: 8, isLiked: false, timeAgo: '1d ago', createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000), replies: [] },
    { id: 'c15', postId: '4', authorId: 'user5', author: 'Jessica Chen', authorImage: sampleUsers[4].avatar, text: 'I keep a mental list of interesting topics to bring up!', likes: 6, isLiked: false, timeAgo: '20h ago', createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000), replies: [] },
  ],
  '5': [
    { id: 'c16', postId: '5', authorId: 'user1', author: 'Sarah Mitchell', authorImage: sampleUsers[0].avatar, text: 'YES! So proud of you! Keep us updated!', likes: 18, isLiked: false, timeAgo: '2d ago', createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000), replies: [] },
    { id: 'c17', postId: '5', authorId: 'user4', author: 'David Kim', authorImage: sampleUsers[3].avatar, text: 'This is amazing! You\'ve inspired me to do the same.', likes: 10, isLiked: false, timeAgo: '2d ago', createdAt: new Date(Date.now() - 55 * 60 * 60 * 1000), replies: [] },
  ],
};

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

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [savedPosts, savedComments] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.POSTS),
          AsyncStorage.getItem(STORAGE_KEYS.COMMENTS),
        ]);

        if (savedPosts) {
          const parsedPosts = JSON.parse(savedPosts).map((post: any) => ({
            ...post,
            createdAt: new Date(post.createdAt),
          }));
          setPosts(parsedPosts);
        }

        if (savedComments) {
          const parsedComments = JSON.parse(savedComments);
          // Convert createdAt strings back to Date objects
          Object.keys(parsedComments).forEach(postId => {
            parsedComments[postId] = parsedComments[postId].map((comment: any) => ({
              ...comment,
              createdAt: new Date(comment.createdAt),
            }));
          });
          setComments(parsedComments);
        }
      } catch (error) {
        if (__DEV__) console.log('Error loading posts data:', error);
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

  const addPost = useCallback((newPost: Omit<Post, 'id' | 'likes' | 'comments' | 'timeAgo' | 'createdAt' | 'isLiked' | 'authorId'>, authorName: string, authorImage: string) => {
    const post: Post = {
      ...newPost,
      id: Date.now().toString(),
      authorId: 'currentUser',
      author: authorName,
      authorImage: authorImage,
      likes: 0,
      comments: 0,
      timeAgo: 'Just now',
      createdAt: new Date(),
      isLiked: false,
    };
    setPosts(prev => [post, ...prev]);
    setComments(prev => ({ ...prev, [post.id]: [] }));
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  }, []);

  const getPost = useCallback((postId: string) => {
    return posts.find(p => p.id === postId);
  }, [posts]);

  const getComments = useCallback((postId: string) => {
    return comments[postId] || [];
  }, [comments]);

  const addComment = useCallback((postId: string, text: string, authorName: string, authorImage: string, parentId?: string) => {
    const newComment: Comment = {
      id: `c${Date.now()}`,
      postId,
      authorId: 'currentUser',
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
  }, []);

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
