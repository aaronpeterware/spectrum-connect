// useConversationMemory Hook
// Manages loading, saving, and updating companion memory during conversations

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserMemory,
  LearnedFact,
  ConversationSummary,
  MemoryContext,
} from '../types/companion';
import {
  initMemoryDatabase,
  getMemoryContext,
  buildMemoryPromptSection,
  getFullCompanionMemory,
  saveLearnedFact,
  saveConversationSummary,
  recordEmotionalState,
  saveUserName,
  getUserName,
  getRelationshipLevel,
  updateRelationshipLevel,
  getConversationSummaries,
  getLearnedFacts,
} from '../services/memoryService';
import { ConversationMessage } from '../services/elevenLabsVoice';

interface UseConversationMemoryOptions {
  companionId: string;
  autoInitialize?: boolean;
}

interface UseConversationMemoryReturn {
  // State
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;

  // Memory data
  memory: UserMemory | null;
  memoryContext: MemoryContext | null;
  promptSection: string;
  userName: string | null;
  relationshipLevel: number;
  recentFacts: LearnedFact[];
  recentSummaries: ConversationSummary[];

  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  saveFact: (fact: string, importance?: 'low' | 'medium' | 'high', category?: 'personal' | 'preference' | 'experience' | 'emotion' | 'relationship') => Promise<void>;
  saveSummary: (duration: number, summary: string, mood?: string, topics?: string[]) => Promise<void>;
  saveEmotionalState: (mood: string, context?: string, intensity?: number) => Promise<void>;
  saveUserName: (name: string) => Promise<void>;
  updateRelationship: (delta: number) => Promise<number>;
  processConversationEnd: (messages: ConversationMessage[], duration: number) => Promise<void>;
}

export const useConversationMemory = ({
  companionId,
  autoInitialize = true,
}: UseConversationMemoryOptions): UseConversationMemoryReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [memoryContext, setMemoryContext] = useState<MemoryContext | null>(null);
  const [promptSection, setPromptSection] = useState('');
  const [userName, setUserNameState] = useState<string | null>(null);
  const [relationshipLevel, setRelationshipLevel] = useState(1);
  const [recentFacts, setRecentFacts] = useState<LearnedFact[]>([]);
  const [recentSummaries, setRecentSummaries] = useState<ConversationSummary[]>([]);

  const companionIdRef = useRef(companionId);

  // Initialize database and load memory
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize SQLite database
      await initMemoryDatabase();

      // Load all memory data in parallel
      const [
        fullMemory,
        context,
        prompt,
        name,
        level,
        facts,
        summaries,
      ] = await Promise.all([
        getFullCompanionMemory(companionId),
        getMemoryContext(companionId),
        buildMemoryPromptSection(companionId),
        getUserName(companionId),
        getRelationshipLevel(companionId),
        getLearnedFacts(companionId, 10),
        getConversationSummaries(companionId, 5),
      ]);

      setMemory(fullMemory);
      setMemoryContext(context);
      setPromptSection(prompt);
      setUserNameState(name);
      setRelationshipLevel(level);
      setRecentFacts(facts);
      setRecentSummaries(summaries);

      setIsInitialized(true);
      console.log(`[useConversationMemory] Initialized for ${companionId}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize memory');
      setError(error);
      console.error('[useConversationMemory] Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [companionId]);

  // Refresh memory data
  const refresh = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const [context, prompt, level, facts, summaries] = await Promise.all([
        getMemoryContext(companionId),
        buildMemoryPromptSection(companionId),
        getRelationshipLevel(companionId),
        getLearnedFacts(companionId, 10),
        getConversationSummaries(companionId, 5),
      ]);

      setMemoryContext(context);
      setPromptSection(prompt);
      setRelationshipLevel(level);
      setRecentFacts(facts);
      setRecentSummaries(summaries);

      console.log('[useConversationMemory] Memory refreshed');
    } catch (err) {
      console.error('[useConversationMemory] Refresh error:', err);
    }
  }, [companionId, isInitialized]);

  // Save a learned fact
  const saveFact = useCallback(async (
    fact: string,
    importance: 'low' | 'medium' | 'high' = 'medium',
    category: 'personal' | 'preference' | 'experience' | 'emotion' | 'relationship' = 'personal'
  ) => {
    try {
      await saveLearnedFact(companionId, fact, importance, category);
      await refresh();
      console.log(`[useConversationMemory] Saved fact: ${fact}`);
    } catch (err) {
      console.error('[useConversationMemory] Save fact error:', err);
    }
  }, [companionId, refresh]);

  // Save conversation summary
  const saveSummaryAction = useCallback(async (
    duration: number,
    summary: string,
    mood?: string,
    topics?: string[]
  ) => {
    try {
      await saveConversationSummary(companionId, duration, summary, mood, topics);
      await refresh();
      console.log('[useConversationMemory] Saved conversation summary');
    } catch (err) {
      console.error('[useConversationMemory] Save summary error:', err);
    }
  }, [companionId, refresh]);

  // Save emotional state
  const saveEmotionalStateAction = useCallback(async (
    mood: string,
    context?: string,
    intensity: number = 5
  ) => {
    try {
      await recordEmotionalState(companionId, mood, context, intensity);
      console.log(`[useConversationMemory] Recorded emotional state: ${mood}`);
    } catch (err) {
      console.error('[useConversationMemory] Save emotional state error:', err);
    }
  }, [companionId]);

  // Save user name
  const saveUserNameAction = useCallback(async (name: string) => {
    try {
      await saveUserName(companionId, name);
      setUserNameState(name);
      await refresh();
      console.log(`[useConversationMemory] Saved user name: ${name}`);
    } catch (err) {
      console.error('[useConversationMemory] Save user name error:', err);
    }
  }, [companionId, refresh]);

  // Update relationship level
  const updateRelationshipAction = useCallback(async (delta: number): Promise<number> => {
    try {
      const newLevel = await updateRelationshipLevel(companionId, delta);
      setRelationshipLevel(newLevel);
      console.log(`[useConversationMemory] Updated relationship: ${newLevel}`);
      return newLevel;
    } catch (err) {
      console.error('[useConversationMemory] Update relationship error:', err);
      return relationshipLevel;
    }
  }, [companionId, relationshipLevel]);

  // Process end of conversation - extract and save all relevant data
  const processConversationEnd = useCallback(async (
    messages: ConversationMessage[],
    duration: number
  ) => {
    if (messages.length === 0) {
      console.log('[useConversationMemory] No messages to process');
      return;
    }

    try {
      console.log(`[useConversationMemory] Processing ${messages.length} messages`);

      // Extract user messages for analysis
      const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
      const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);
      const allText = [...userMessages, ...assistantMessages].join(' ').toLowerCase();

      // ===== FACT EXTRACTION =====

      // Name detection
      for (const msg of userMessages) {
        const namePatterns = [
          /(?:my name is|my name's)\s+([A-Z][a-z]{2,15})/i,
          /(?:i'm|i am)\s+([A-Z][a-z]{2,15})(?:\s|$|,|\.)/i,
          /(?:call me)\s+([A-Z][a-z]{2,15})/i,
        ];

        for (const pattern of namePatterns) {
          const match = msg.match(pattern);
          if (match && match[1]) {
            const name = match[1];
            // Validate it's not a common word
            const invalidNames = ['happy', 'good', 'fine', 'great', 'okay', 'here', 'there'];
            if (!invalidNames.includes(name.toLowerCase())) {
              await saveUserName(companionId, name);
              setUserNameState(name);
              break;
            }
          }
        }
      }

      // Job detection
      for (const msg of userMessages) {
        const jobMatch = msg.match(/(?:i work as|i'm a|my job is|i do)\s+([^.,!?]+)/i);
        if (jobMatch && jobMatch[1] && !jobMatch[1].includes('?')) {
          await saveLearnedFact(companionId, `Works as ${jobMatch[1].trim()}`, 'medium', 'personal');
        }
      }

      // Location detection
      for (const msg of userMessages) {
        const locMatch = msg.match(/(?:i live in|i'm from|i'm in)\s+([^.,!?]+)/i);
        if (locMatch && locMatch[1]) {
          await saveLearnedFact(companionId, `Lives in/from ${locMatch[1].trim()}`, 'medium', 'personal');
        }
      }

      // Hobby/interest detection
      for (const msg of userMessages) {
        const hobbyMatch = msg.match(/(?:i love|i enjoy|i like|my hobby is)\s+([^.,!?]+)/i);
        if (hobbyMatch && hobbyMatch[1] && !hobbyMatch[1].includes('?')) {
          await saveLearnedFact(companionId, `Enjoys ${hobbyMatch[1].trim()}`, 'low', 'preference');
        }
      }

      // ===== EMOTIONAL ANALYSIS =====

      const positiveWords = ['happy', 'excited', 'great', 'good', 'love', 'amazing', 'wonderful', 'fantastic'];
      const negativeWords = ['sad', 'stressed', 'worried', 'anxious', 'bad', 'terrible', 'hard', 'difficult'];
      const anxietyWords = ['anxious', 'anxiety', 'nervous', 'panic', 'overwhelmed'];

      const positiveCount = positiveWords.filter(w => allText.includes(w)).length;
      const negativeCount = negativeWords.filter(w => allText.includes(w)).length;
      const hasAnxiety = anxietyWords.some(w => allText.includes(w));

      let mood = 'neutral';
      let intensity = 5;

      if (hasAnxiety) {
        mood = 'anxious';
        intensity = 7;
        await saveLearnedFact(companionId, 'Experiences anxiety', 'high', 'emotion');
      } else if (positiveCount > negativeCount + 2) {
        mood = 'very positive';
        intensity = 8;
      } else if (positiveCount > negativeCount) {
        mood = 'positive';
        intensity = 6;
      } else if (negativeCount > positiveCount + 2) {
        mood = 'distressed';
        intensity = 7;
      } else if (negativeCount > positiveCount) {
        mood = 'concerned';
        intensity = 6;
      }

      if (mood !== 'neutral') {
        await recordEmotionalState(companionId, mood, undefined, intensity);
      }

      // ===== TOPIC EXTRACTION =====

      const topicKeywords = [
        'work', 'job', 'career', 'family', 'friends', 'relationship', 'health',
        'music', 'movies', 'books', 'travel', 'food', 'sports', 'gaming',
        'weekend', 'plans', 'goals', 'dreams', 'memories', 'hobbies',
      ];

      const keyTopics = topicKeywords.filter(topic => allText.includes(topic)).slice(0, 5);

      // ===== GENERATE SUMMARY =====

      const messageCount = messages.length;
      const userTurns = userMessages.length;

      let summaryPrefix = 'Had a brief exchange';
      if (userTurns > 10) summaryPrefix = 'Had an extended conversation';
      else if (userTurns > 5) summaryPrefix = 'Had a good conversation';
      else if (userTurns > 2) summaryPrefix = 'Had a short conversation';

      const topicSummary = keyTopics.length > 0
        ? ` discussing ${keyTopics.slice(0, 3).join(', ')}`
        : '';

      const moodSummary = mood !== 'neutral'
        ? `. User seemed ${mood.replace('very ', '')}`
        : '';

      const summary = `${summaryPrefix}${topicSummary}${moodSummary}.`;

      // Save conversation summary
      await saveConversationSummary(companionId, duration, summary, mood, keyTopics);

      // Refresh memory state
      await refresh();

      console.log('[useConversationMemory] Conversation processing complete');
      console.log(`  - Summary: ${summary}`);
      console.log(`  - Mood: ${mood}`);
      console.log(`  - Topics: ${keyTopics.join(', ')}`);

    } catch (err) {
      console.error('[useConversationMemory] Process conversation error:', err);
    }
  }, [companionId, refresh]);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && companionIdRef.current === companionId) {
      initialize();
    }
    companionIdRef.current = companionId;
  }, [companionId, autoInitialize, initialize]);

  // Re-initialize when companion changes
  useEffect(() => {
    if (isInitialized && companionIdRef.current !== companionId) {
      companionIdRef.current = companionId;
      initialize();
    }
  }, [companionId, isInitialized, initialize]);

  return {
    // State
    isLoading,
    isInitialized,
    error,

    // Memory data
    memory,
    memoryContext,
    promptSection,
    userName,
    relationshipLevel,
    recentFacts,
    recentSummaries,

    // Actions
    initialize,
    refresh,
    saveFact,
    saveSummary: saveSummaryAction,
    saveEmotionalState: saveEmotionalStateAction,
    saveUserName: saveUserNameAction,
    updateRelationship: updateRelationshipAction,
    processConversationEnd,
  };
};

export default useConversationMemory;
