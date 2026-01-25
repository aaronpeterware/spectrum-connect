// User Progress Service - Cloud persistence for learning progress, XP, and scores
import { supabase } from '../config/supabase';
import { getUserId } from './profileService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local storage key for offline caching
const PROGRESS_CACHE_KEY = '@haven_user_progress';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  quizScore?: number;
  quizAttempts: number;
  bestScore: number;
  completedAt?: string;
}

export interface ModuleProgress {
  moduleId: string;
  lessonsCompleted: number;
  totalLessons: number;
  examScore?: number;
  examPassed: boolean;
}

export interface ExamScore {
  examId: string;
  score: number;
  passed: boolean;
  attempts: number;
  bestScore: number;
  completedAt?: string;
}

export interface UserProgress {
  totalXP: number;
  level: number;
  lessonsCompleted: LessonProgress[];
  modulesProgress: ModuleProgress[];
  examScores: ExamScore[];
  streakDays: number;
  lastActivityDate?: string;
}

// Default empty progress
const DEFAULT_PROGRESS: UserProgress = {
  totalXP: 0,
  level: 1,
  lessonsCompleted: [],
  modulesProgress: [],
  examScores: [],
  streakDays: 0,
  lastActivityDate: undefined,
};

// Calculate level from XP
export const calculateLevel = (xp: number): number => {
  // Simple level calculation: level up every 500 XP
  return Math.floor(xp / 500) + 1;
};

// Calculate streak from last activity
const calculateStreak = (lastActivityDate: string | undefined, currentStreak: number): number => {
  if (!lastActivityDate) return 1;

  const last = new Date(lastActivityDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day, keep streak
    return currentStreak;
  } else if (diffDays === 1) {
    // Next day, increment streak
    return currentStreak + 1;
  } else {
    // Streak broken, reset to 1
    return 1;
  }
};

// Get user progress from Supabase (with local cache fallback)
export const getUserProgress = async (): Promise<UserProgress> => {
  try {
    const userId = await getUserId();

    // Try to fetch from Supabase
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      const progress: UserProgress = {
        totalXP: data.total_xp || 0,
        level: data.level || 1,
        lessonsCompleted: data.lessons_completed || [],
        modulesProgress: data.modules_progress || [],
        examScores: data.exam_scores || [],
        streakDays: data.streak_days || 0,
        lastActivityDate: data.last_activity_date,
      };

      // Cache locally for offline access
      await AsyncStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(progress));

      return progress;
    }

    // If no data in Supabase, try local cache
    const cached = await AsyncStorage.getItem(PROGRESS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    // Return default progress for new users
    return DEFAULT_PROGRESS;
  } catch (error) {
    console.error('Error getting user progress:', error);

    // Try local cache on error
    try {
      const cached = await AsyncStorage.getItem(PROGRESS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (cacheError) {
      console.error('Error reading cache:', cacheError);
    }

    return DEFAULT_PROGRESS;
  }
};

// Save user progress to Supabase (and local cache)
export const saveUserProgress = async (progress: UserProgress): Promise<boolean> => {
  try {
    const userId = await getUserId();

    // Update streak based on activity
    const updatedStreak = calculateStreak(progress.lastActivityDate, progress.streakDays);
    const updatedProgress = {
      ...progress,
      streakDays: updatedStreak,
      lastActivityDate: new Date().toISOString(),
      level: calculateLevel(progress.totalXP),
    };

    // Save to Supabase
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        total_xp: updatedProgress.totalXP,
        level: updatedProgress.level,
        lessons_completed: updatedProgress.lessonsCompleted,
        modules_progress: updatedProgress.modulesProgress,
        exam_scores: updatedProgress.examScores,
        streak_days: updatedProgress.streakDays,
        last_activity_date: updatedProgress.lastActivityDate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Supabase save error:', error);
      // Still save locally even if Supabase fails
    }

    // Always cache locally for offline access
    await AsyncStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(updatedProgress));

    return !error;
  } catch (error) {
    console.error('Error saving user progress:', error);

    // Save locally as fallback
    try {
      await AsyncStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(progress));
    } catch (cacheError) {
      console.error('Error saving to cache:', cacheError);
    }

    return false;
  }
};

// Mark a lesson as completed and award XP
export const completeLesson = async (
  lessonId: string,
  quizScore?: number,
  xpReward: number = 50
): Promise<UserProgress> => {
  const progress = await getUserProgress();

  // Find existing lesson progress or create new
  const existingIndex = progress.lessonsCompleted.findIndex(l => l.lessonId === lessonId);

  if (existingIndex >= 0) {
    // Update existing
    const existing = progress.lessonsCompleted[existingIndex];
    progress.lessonsCompleted[existingIndex] = {
      ...existing,
      completed: true,
      quizScore: quizScore ?? existing.quizScore,
      quizAttempts: existing.quizAttempts + (quizScore !== undefined ? 1 : 0),
      bestScore: Math.max(existing.bestScore, quizScore ?? 0),
      completedAt: new Date().toISOString(),
    };

    // Only award XP if this is first completion
    if (!existing.completed) {
      progress.totalXP += xpReward;
    }
  } else {
    // Add new
    progress.lessonsCompleted.push({
      lessonId,
      completed: true,
      quizScore,
      quizAttempts: quizScore !== undefined ? 1 : 0,
      bestScore: quizScore ?? 0,
      completedAt: new Date().toISOString(),
    });
    progress.totalXP += xpReward;
  }

  progress.level = calculateLevel(progress.totalXP);

  await saveUserProgress(progress);
  return progress;
};

// Update quiz score for a lesson
export const updateQuizScore = async (
  lessonId: string,
  score: number
): Promise<UserProgress> => {
  const progress = await getUserProgress();

  const existingIndex = progress.lessonsCompleted.findIndex(l => l.lessonId === lessonId);

  if (existingIndex >= 0) {
    const existing = progress.lessonsCompleted[existingIndex];
    progress.lessonsCompleted[existingIndex] = {
      ...existing,
      quizScore: score,
      quizAttempts: existing.quizAttempts + 1,
      bestScore: Math.max(existing.bestScore, score),
    };
  } else {
    progress.lessonsCompleted.push({
      lessonId,
      completed: false,
      quizScore: score,
      quizAttempts: 1,
      bestScore: score,
    });
  }

  await saveUserProgress(progress);
  return progress;
};

// Complete an exam
export const completeExam = async (
  examId: string,
  score: number,
  passingScore: number,
  xpReward: number = 100
): Promise<UserProgress> => {
  const progress = await getUserProgress();

  const passed = score >= passingScore;
  const existingIndex = progress.examScores.findIndex(e => e.examId === examId);

  if (existingIndex >= 0) {
    const existing = progress.examScores[existingIndex];
    const isFirstPass = !existing.passed && passed;

    progress.examScores[existingIndex] = {
      ...existing,
      score,
      passed: existing.passed || passed,
      attempts: existing.attempts + 1,
      bestScore: Math.max(existing.bestScore, score),
      completedAt: new Date().toISOString(),
    };

    // Award XP only on first pass
    if (isFirstPass) {
      progress.totalXP += xpReward;
    }
  } else {
    progress.examScores.push({
      examId,
      score,
      passed,
      attempts: 1,
      bestScore: score,
      completedAt: new Date().toISOString(),
    });

    if (passed) {
      progress.totalXP += xpReward;
    }
  }

  progress.level = calculateLevel(progress.totalXP);

  await saveUserProgress(progress);
  return progress;
};

// Add XP (for various activities)
export const addXP = async (amount: number): Promise<UserProgress> => {
  const progress = await getUserProgress();
  progress.totalXP += amount;
  progress.level = calculateLevel(progress.totalXP);

  await saveUserProgress(progress);
  return progress;
};

// Get lesson progress
export const getLessonProgress = async (lessonId: string): Promise<LessonProgress | undefined> => {
  const progress = await getUserProgress();
  return progress.lessonsCompleted.find(l => l.lessonId === lessonId);
};

// Get exam score
export const getExamScore = async (examId: string): Promise<ExamScore | undefined> => {
  const progress = await getUserProgress();
  return progress.examScores.find(e => e.examId === examId);
};

// Sync local progress to cloud (call after coming online)
export const syncProgressToCloud = async (): Promise<boolean> => {
  try {
    const cached = await AsyncStorage.getItem(PROGRESS_CACHE_KEY);
    if (!cached) return true;

    const progress: UserProgress = JSON.parse(cached);
    return await saveUserProgress(progress);
  } catch (error) {
    console.error('Error syncing progress to cloud:', error);
    return false;
  }
};

// Clear all progress (for testing/account reset)
export const clearProgress = async (): Promise<void> => {
  try {
    const userId = await getUserId();

    await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    await AsyncStorage.removeItem(PROGRESS_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing progress:', error);
  }
};

export default {
  getUserProgress,
  saveUserProgress,
  completeLesson,
  updateQuizScore,
  completeExam,
  addXP,
  getLessonProgress,
  getExamScore,
  syncProgressToCloud,
  clearProgress,
  calculateLevel,
};
