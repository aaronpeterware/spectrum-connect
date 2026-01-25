// Course Service - Fetch courses/modules/lessons from Supabase
import { supabase } from '../config/supabase';
import { Module, Lesson, ConversationScenario, QuizQuestion, MODULES as STATIC_MODULES } from '../data/lessonData';

// Types for Supabase data
export interface SupabaseCourse {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  thumbnail_url: string | null;
  order_index: number;
  is_published: boolean;
  is_premium: boolean;
  release_date: string | null;
  created_at: string;
}

export interface SupabaseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  icon: string;
  color: string | null;
  week_range: string;
  order_index: number;
  is_published: boolean;
  release_date: string | null;
}

export interface SupabaseLesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  duration: string;
  xp_reward: number;
  skill_category: string;
  order_index: number;
  is_published: boolean;
  is_premium: boolean;
}

export interface SupabaseLessonContent {
  id: string;
  lesson_id: string;
  intro: string;
  key_points: string[];
  tips: string[];
  common_mistakes: string[];
  video_url: string | null;
  video_duration: number | null;
  audio_url: string | null;
}

export interface SupabaseScenario {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  setting: string;
  participants: string[];
  transcript: string;
  duration: string;
  audio_url: string | null;
  video_url: string | null;
  order_index: number;
  key_moments?: SupabaseKeyMoment[];
}

export interface SupabaseKeyMoment {
  id: string;
  scenario_id: string;
  timestamp: string;
  description: string;
  skill_demonstrated: string;
  order_index: number;
}

export interface SupabaseQuizQuestion {
  id: string;
  lesson_id: string | null;
  module_id: string | null;
  question: string;
  audio_context: string | null;
  options: string[];
  correct_index: number;
  explanation: string;
  points: number;
  question_type: 'lesson' | 'final_exam' | 'practice_exam';
  order_index: number;
}

export interface SupabasePracticePrompt {
  id: string;
  lesson_id: string;
  prompt_text: string;
  order_index: number;
}

// User progress types
export interface UserLessonProgress {
  lesson_id: string;
  completed: boolean;
  quiz_score: number | null;
  quiz_attempts: number;
  best_score: number;
  xp_earned: number;
  completed_at: string | null;
}

export interface UserLearningStats {
  total_xp: number;
  level: number;
  streak_days: number;
  longest_streak: number;
  lessons_completed: number;
  quizzes_passed: number;
  last_activity_date: string | null;
}

// Cache for modules to reduce API calls
let modulesCache: Module[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch all modules with their lessons from Supabase
export const fetchModules = async (forceRefresh: boolean = false): Promise<Module[]> => {
  // Check cache
  if (!forceRefresh && modulesCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return modulesCache;
  }

  try {
    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('is_published', true)
      .order('order_index');

    if (modulesError || !modules || modules.length === 0) {
      console.log('No dynamic modules found, using static data');
      return STATIC_MODULES;
    }

    // Fetch all lessons for these modules
    const moduleIds = modules.map(m => m.id);
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds)
      .eq('is_published', true)
      .order('order_index');

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return STATIC_MODULES;
    }

    // Fetch lesson content
    const lessonIds = lessons?.map(l => l.id) || [];
    const { data: lessonContent } = await supabase
      .from('lesson_content')
      .select('*')
      .in('lesson_id', lessonIds);

    // Fetch scenarios with key moments
    const { data: scenarios } = await supabase
      .from('scenarios')
      .select(`
        *,
        key_moments (*)
      `)
      .in('lesson_id', lessonIds)
      .order('order_index');

    // Fetch quiz questions for lessons
    const { data: quizQuestions } = await supabase
      .from('quiz_questions')
      .select('*')
      .or(`lesson_id.in.(${lessonIds.join(',')}),module_id.in.(${moduleIds.join(',')})`)
      .order('order_index');

    // Fetch practice prompts
    const { data: practicePrompts } = await supabase
      .from('practice_prompts')
      .select('*')
      .in('lesson_id', lessonIds)
      .order('order_index');

    // Transform to Module format
    const transformedModules: Module[] = modules.map(module => {
      const moduleLessons = lessons?.filter(l => l.module_id === module.id) || [];

      const transformedLessons: Lesson[] = moduleLessons.map(lesson => {
        const content = lessonContent?.find(c => c.lesson_id === lesson.id);
        const lessonScenarios = scenarios?.filter(s => s.lesson_id === lesson.id) || [];
        const lessonQuiz = quizQuestions?.filter(q => q.lesson_id === lesson.id && q.question_type === 'lesson') || [];
        const lessonPrompts = practicePrompts?.filter(p => p.lesson_id === lesson.id) || [];

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          duration: lesson.duration || '10 min',
          xpReward: lesson.xp_reward || 50,
          skillCategory: lesson.skill_category || 'General',
          content: {
            intro: content?.intro || '',
            keyPoints: content?.key_points || [],
            tips: content?.tips || [],
            commonMistakes: content?.common_mistakes || [],
          },
          scenarios: lessonScenarios.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description || '',
            setting: s.setting || '',
            participants: s.participants || [],
            audioUrl: s.audio_url,
            transcript: s.transcript || '',
            duration: s.duration || '30 sec',
            keyMoments: (s.key_moments || []).map((km: SupabaseKeyMoment) => ({
              timestamp: km.timestamp,
              description: km.description,
              skillDemonstrated: km.skill_demonstrated,
            })),
          })) as ConversationScenario[],
          quiz: lessonQuiz.map(q => ({
            id: q.id,
            question: q.question,
            audioContext: q.audio_context || undefined,
            options: q.options,
            correctIndex: q.correct_index,
            explanation: q.explanation || '',
            points: q.points || 10,
          })) as QuizQuestion[],
          practicePrompts: lessonPrompts.map(p => p.prompt_text),
        };
      });

      const finalExamQuestions = quizQuestions?.filter(
        q => q.module_id === module.id && q.question_type === 'final_exam'
      ) || [];

      return {
        id: module.id,
        title: module.title,
        description: module.description || '',
        icon: module.icon || 'book',
        color: module.color || '#6366F1',
        weekRange: module.week_range || '',
        lessons: transformedLessons,
        finalExam: finalExamQuestions.map(q => ({
          id: q.id,
          question: q.question,
          audioContext: q.audio_context || undefined,
          options: q.options,
          correctIndex: q.correct_index,
          explanation: q.explanation || '',
          points: q.points || 15,
        })) as QuizQuestion[],
      };
    });

    // Update cache
    modulesCache = transformedModules;
    cacheTimestamp = Date.now();

    return transformedModules;
  } catch (error) {
    console.error('Error fetching modules:', error);
    return STATIC_MODULES;
  }
};

// Fetch a single module by ID
export const fetchModule = async (moduleId: string): Promise<Module | null> => {
  const modules = await fetchModules();
  return modules.find(m => m.id === moduleId) || null;
};

// Fetch a single lesson by ID
export const fetchLesson = async (lessonId: string): Promise<{ lesson: Lesson; module: Module } | null> => {
  const modules = await fetchModules();

  for (const module of modules) {
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (lesson) {
      return { lesson, module };
    }
  }

  return null;
};

// Clear the cache (call after admin updates)
export const clearModulesCache = () => {
  modulesCache = null;
  cacheTimestamp = 0;
};

// =====================================================
// USER PROGRESS FUNCTIONS
// =====================================================

// Get user's learning stats
export const getUserLearningStats = async (userId: string): Promise<UserLearningStats | null> => {
  try {
    const { data, error } = await supabase
      .from('user_learning_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Create default stats if not exists
      const defaultStats: UserLearningStats = {
        total_xp: 0,
        level: 1,
        streak_days: 0,
        longest_streak: 0,
        lessons_completed: 0,
        quizzes_passed: 0,
        last_activity_date: null,
      };

      await supabase.from('user_learning_stats').insert({
        user_id: userId,
        ...defaultStats,
      });

      return defaultStats;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user learning stats:', error);
    return null;
  }
};

// Get user's progress for all lessons
export const getUserLessonProgress = async (userId: string): Promise<UserLessonProgress[]> => {
  try {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching lesson progress:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return [];
  }
};

// Save lesson completion
export const saveLessonProgress = async (
  userId: string,
  lessonId: string,
  quizScore: number,
  xpEarned: number
): Promise<boolean> => {
  try {
    // Upsert lesson progress
    const { error: progressError } = await supabase
      .from('user_lesson_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        quiz_score: quizScore,
        quiz_attempts: 1, // Will be incremented on conflict
        best_score: quizScore,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lesson_id',
      });

    if (progressError) {
      console.error('Error saving lesson progress:', progressError);
      return false;
    }

    // Update user stats
    await updateUserStats(userId, xpEarned);

    return true;
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    return false;
  }
};

// Update user's overall learning stats
export const updateUserStats = async (userId: string, xpToAdd: number): Promise<void> => {
  try {
    // First get current stats
    const { data: currentStats } = await supabase
      .from('user_learning_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = currentStats?.last_activity_date;
    const isConsecutiveDay = lastActivity &&
      new Date(today).getTime() - new Date(lastActivity).getTime() <= 24 * 60 * 60 * 1000;

    const newStreak = isConsecutiveDay ? (currentStats?.streak_days || 0) + 1 : 1;
    const newTotalXp = (currentStats?.total_xp || 0) + xpToAdd;
    const newLevel = Math.floor(newTotalXp / 100) + 1;

    await supabase
      .from('user_learning_stats')
      .upsert({
        user_id: userId,
        total_xp: newTotalXp,
        level: newLevel,
        streak_days: newStreak,
        longest_streak: Math.max(newStreak, currentStats?.longest_streak || 0),
        lessons_completed: (currentStats?.lessons_completed || 0) + 1,
        quizzes_passed: (currentStats?.quizzes_passed || 0) + 1,
        last_activity_date: today,
      }, {
        onConflict: 'user_id',
      });
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

// =====================================================
// ADMIN FUNCTIONS (for course management)
// =====================================================

// Create a new course
export const createCourse = async (course: Partial<SupabaseCourse>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return null;
    }

    clearModulesCache();
    return data?.id || null;
  } catch (error) {
    console.error('Error creating course:', error);
    return null;
  }
};

// Create a new module
export const createModule = async (module: Partial<SupabaseModule>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .insert(module)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating module:', error);
      return null;
    }

    clearModulesCache();
    return data?.id || null;
  } catch (error) {
    console.error('Error creating module:', error);
    return null;
  }
};

// Create a new lesson with content
export const createLesson = async (
  lesson: Partial<SupabaseLesson>,
  content: Partial<SupabaseLessonContent>
): Promise<string | null> => {
  try {
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .insert(lesson)
      .select('id')
      .single();

    if (lessonError || !lessonData) {
      console.error('Error creating lesson:', lessonError);
      return null;
    }

    // Create lesson content
    await supabase
      .from('lesson_content')
      .insert({
        ...content,
        lesson_id: lessonData.id,
      });

    clearModulesCache();
    return lessonData.id;
  } catch (error) {
    console.error('Error creating lesson:', error);
    return null;
  }
};

// Add a scenario to a lesson
export const addScenario = async (
  scenario: Partial<SupabaseScenario>,
  keyMoments: Partial<SupabaseKeyMoment>[]
): Promise<string | null> => {
  try {
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .insert(scenario)
      .select('id')
      .single();

    if (scenarioError || !scenarioData) {
      console.error('Error creating scenario:', scenarioError);
      return null;
    }

    // Add key moments
    if (keyMoments.length > 0) {
      await supabase
        .from('key_moments')
        .insert(keyMoments.map(km => ({
          ...km,
          scenario_id: scenarioData.id,
        })));
    }

    clearModulesCache();
    return scenarioData.id;
  } catch (error) {
    console.error('Error creating scenario:', error);
    return null;
  }
};

// Add a quiz question
export const addQuizQuestion = async (question: Partial<SupabaseQuizQuestion>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(question)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating quiz question:', error);
      return null;
    }

    clearModulesCache();
    return data?.id || null;
  } catch (error) {
    console.error('Error creating quiz question:', error);
    return null;
  }
};

// Update course/module/lesson publish status
export const updatePublishStatus = async (
  table: 'courses' | 'modules' | 'lessons',
  id: string,
  isPublished: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(table)
      .update({ is_published: isPublished })
      .eq('id', id);

    if (error) {
      console.error(`Error updating ${table} publish status:`, error);
      return false;
    }

    clearModulesCache();
    return true;
  } catch (error) {
    console.error(`Error updating ${table} publish status:`, error);
    return false;
  }
};

export default {
  fetchModules,
  fetchModule,
  fetchLesson,
  clearModulesCache,
  getUserLearningStats,
  getUserLessonProgress,
  saveLessonProgress,
  updateUserStats,
  createCourse,
  createModule,
  createLesson,
  addScenario,
  addQuizQuestion,
  updatePublishStatus,
};
