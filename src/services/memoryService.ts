// Memory Service for Haven - SQLite-based per-user companion memory
// Handles persistent storage of user interactions, facts, and relationship data

import * as SQLite from 'expo-sqlite';
import {
  UserMemory,
  LearnedFact,
  ConversationSummary,
  EmotionalEntry,
  MemoryContext,
} from '../types/companion';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Initialize the database
export const initMemoryDatabase = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabaseAsync('haven_memory.db');

    // Create tables
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS companion_memory (
        id TEXT PRIMARY KEY,
        companion_id TEXT NOT NULL,
        user_name TEXT,
        relationship_level INTEGER DEFAULT 1,
        total_call_time INTEGER DEFAULT 0,
        last_interaction TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS learned_facts (
        id TEXT PRIMARY KEY,
        companion_id TEXT NOT NULL,
        fact TEXT NOT NULL,
        importance TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'personal',
        learned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (companion_id) REFERENCES companion_memory(companion_id)
      );

      CREATE TABLE IF NOT EXISTS conversation_summaries (
        id TEXT PRIMARY KEY,
        companion_id TEXT NOT NULL,
        date TEXT NOT NULL,
        duration INTEGER NOT NULL,
        summary TEXT NOT NULL,
        mood TEXT,
        key_topics TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (companion_id) REFERENCES companion_memory(companion_id)
      );

      CREATE TABLE IF NOT EXISTS emotional_log (
        id TEXT PRIMARY KEY,
        companion_id TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        mood TEXT NOT NULL,
        context TEXT,
        intensity INTEGER DEFAULT 5,
        FOREIGN KEY (companion_id) REFERENCES companion_memory(companion_id)
      );

      CREATE INDEX IF NOT EXISTS idx_facts_companion ON learned_facts(companion_id);
      CREATE INDEX IF NOT EXISTS idx_summaries_companion ON conversation_summaries(companion_id);
      CREATE INDEX IF NOT EXISTS idx_emotional_companion ON emotional_log(companion_id);
    `);

    console.log('[MemoryService] Database initialized successfully');
  } catch (error) {
    console.error('[MemoryService] Database initialization error:', error);
    throw error;
  }
};

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Ensure companion memory record exists
const ensureCompanionMemory = async (companionId: string): Promise<void> => {
  if (!db) await initMemoryDatabase();

  const existing = await db!.getFirstAsync<{ id: string }>(
    'SELECT id FROM companion_memory WHERE companion_id = ?',
    [companionId]
  );

  if (!existing) {
    await db!.runAsync(
      `INSERT INTO companion_memory (id, companion_id) VALUES (?, ?)`,
      [generateId(), companionId]
    );
  }
};

// ============================================
// LEARNED FACTS
// ============================================

export const saveLearnedFact = async (
  companionId: string,
  fact: string,
  importance: 'low' | 'medium' | 'high' = 'medium',
  category: 'personal' | 'preference' | 'experience' | 'emotion' | 'relationship' = 'personal'
): Promise<string> => {
  if (!db) await initMemoryDatabase();
  await ensureCompanionMemory(companionId);

  const id = generateId();

  await db!.runAsync(
    `INSERT INTO learned_facts (id, companion_id, fact, importance, category) VALUES (?, ?, ?, ?, ?)`,
    [id, companionId, fact, importance, category]
  );

  // Update relationship level slightly when learning facts
  await updateRelationshipLevel(companionId, 0.1);

  console.log(`[MemoryService] Saved fact for ${companionId}: ${fact}`);
  return id;
};

export const getLearnedFacts = async (
  companionId: string,
  limit: number = 20
): Promise<LearnedFact[]> => {
  if (!db) await initMemoryDatabase();

  const rows = await db!.getAllAsync<{
    id: string;
    fact: string;
    importance: string;
    category: string;
    learned_at: string;
  }>(
    `SELECT id, fact, importance, category, learned_at
     FROM learned_facts
     WHERE companion_id = ?
     ORDER BY
       CASE importance WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       learned_at DESC
     LIMIT ?`,
    [companionId, limit]
  );

  return rows.map(row => ({
    id: row.id,
    fact: row.fact,
    importance: row.importance as 'low' | 'medium' | 'high',
    category: row.category as 'personal' | 'preference' | 'experience' | 'emotion' | 'relationship',
    learnedAt: new Date(row.learned_at),
  }));
};

export const deleteLearnedFact = async (factId: string): Promise<void> => {
  if (!db) await initMemoryDatabase();
  await db!.runAsync('DELETE FROM learned_facts WHERE id = ?', [factId]);
};

// ============================================
// CONVERSATION SUMMARIES
// ============================================

export const saveConversationSummary = async (
  companionId: string,
  duration: number,
  summary: string,
  mood?: string,
  keyTopics?: string[]
): Promise<string> => {
  if (!db) await initMemoryDatabase();
  await ensureCompanionMemory(companionId);

  const id = generateId();
  const date = new Date().toISOString();
  const topicsJson = keyTopics ? JSON.stringify(keyTopics) : null;

  await db!.runAsync(
    `INSERT INTO conversation_summaries (id, companion_id, date, duration, summary, mood, key_topics)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, companionId, date, duration, summary, mood || null, topicsJson]
  );

  // Update total call time and last interaction
  await db!.runAsync(
    `UPDATE companion_memory
     SET total_call_time = total_call_time + ?,
         last_interaction = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE companion_id = ?`,
    [duration, date, companionId]
  );

  // Increase relationship based on call duration
  const relationshipBoost = Math.min(duration / 600, 0.5); // Max 0.5 boost per 10-min call
  await updateRelationshipLevel(companionId, relationshipBoost);

  console.log(`[MemoryService] Saved conversation summary for ${companionId}`);
  return id;
};

export const getConversationSummaries = async (
  companionId: string,
  limit: number = 10
): Promise<ConversationSummary[]> => {
  if (!db) await initMemoryDatabase();

  const rows = await db!.getAllAsync<{
    id: string;
    date: string;
    duration: number;
    summary: string;
    mood: string | null;
    key_topics: string | null;
  }>(
    `SELECT id, date, duration, summary, mood, key_topics
     FROM conversation_summaries
     WHERE companion_id = ?
     ORDER BY date DESC
     LIMIT ?`,
    [companionId, limit]
  );

  return rows.map(row => ({
    id: row.id,
    date: new Date(row.date),
    duration: row.duration,
    summary: row.summary,
    mood: row.mood || 'neutral',
    keyTopics: row.key_topics ? JSON.parse(row.key_topics) : [],
  }));
};

export const getLastConversationSummary = async (
  companionId: string
): Promise<ConversationSummary | null> => {
  const summaries = await getConversationSummaries(companionId, 1);
  return summaries.length > 0 ? summaries[0] : null;
};

// ============================================
// EMOTIONAL LOG
// ============================================

export const recordEmotionalState = async (
  companionId: string,
  mood: string,
  context?: string,
  intensity: number = 5
): Promise<string> => {
  if (!db) await initMemoryDatabase();
  await ensureCompanionMemory(companionId);

  const id = generateId();

  await db!.runAsync(
    `INSERT INTO emotional_log (id, companion_id, mood, context, intensity)
     VALUES (?, ?, ?, ?, ?)`,
    [id, companionId, mood, context || null, Math.max(1, Math.min(10, intensity))]
  );

  console.log(`[MemoryService] Recorded emotional state for ${companionId}: ${mood}`);
  return id;
};

export const getEmotionalHistory = async (
  companionId: string,
  limit: number = 20
): Promise<EmotionalEntry[]> => {
  if (!db) await initMemoryDatabase();

  const rows = await db!.getAllAsync<{
    id: string;
    timestamp: string;
    mood: string;
    context: string | null;
    intensity: number;
  }>(
    `SELECT id, timestamp, mood, context, intensity
     FROM emotional_log
     WHERE companion_id = ?
     ORDER BY timestamp DESC
     LIMIT ?`,
    [companionId, limit]
  );

  return rows.map(row => ({
    id: row.id,
    timestamp: new Date(row.timestamp),
    mood: row.mood,
    context: row.context || '',
    intensity: row.intensity,
  }));
};

export const getRecentMood = async (companionId: string): Promise<string | null> => {
  const history = await getEmotionalHistory(companionId, 1);
  return history.length > 0 ? history[0].mood : null;
};

// ============================================
// RELATIONSHIP LEVEL
// ============================================

export const getRelationshipLevel = async (companionId: string): Promise<number> => {
  if (!db) await initMemoryDatabase();
  await ensureCompanionMemory(companionId);

  const result = await db!.getFirstAsync<{ relationship_level: number }>(
    'SELECT relationship_level FROM companion_memory WHERE companion_id = ?',
    [companionId]
  );

  return result?.relationship_level || 1;
};

export const updateRelationshipLevel = async (
  companionId: string,
  delta: number
): Promise<number> => {
  if (!db) await initMemoryDatabase();
  await ensureCompanionMemory(companionId);

  // Get current level
  const current = await getRelationshipLevel(companionId);
  const newLevel = Math.max(1, Math.min(10, current + delta));

  await db!.runAsync(
    `UPDATE companion_memory
     SET relationship_level = ?, updated_at = CURRENT_TIMESTAMP
     WHERE companion_id = ?`,
    [newLevel, companionId]
  );

  return newLevel;
};

// ============================================
// USER NAME
// ============================================

export const saveUserName = async (companionId: string, userName: string): Promise<void> => {
  if (!db) await initMemoryDatabase();
  await ensureCompanionMemory(companionId);

  await db!.runAsync(
    `UPDATE companion_memory
     SET user_name = ?, updated_at = CURRENT_TIMESTAMP
     WHERE companion_id = ?`,
    [userName, companionId]
  );

  // Also save as a high-importance fact
  await saveLearnedFact(companionId, `User's name is ${userName}`, 'high', 'personal');

  console.log(`[MemoryService] Saved user name for ${companionId}: ${userName}`);
};

export const getUserName = async (companionId: string): Promise<string | null> => {
  if (!db) await initMemoryDatabase();

  const result = await db!.getFirstAsync<{ user_name: string | null }>(
    'SELECT user_name FROM companion_memory WHERE companion_id = ?',
    [companionId]
  );

  return result?.user_name || null;
};

// ============================================
// MEMORY CONTEXT (for prompts)
// ============================================

export const getMemoryContext = async (companionId: string): Promise<MemoryContext> => {
  if (!db) await initMemoryDatabase();

  // Get all relevant memory data
  const [
    userName,
    relationshipLevel,
    facts,
    lastSummary,
    recentMood,
    summaries,
  ] = await Promise.all([
    getUserName(companionId),
    getRelationshipLevel(companionId),
    getLearnedFacts(companionId, 15),
    getLastConversationSummary(companionId),
    getRecentMood(companionId),
    getConversationSummaries(companionId, 5),
  ]);

  // Extract recent topics from summaries
  const recentTopics = summaries
    .flatMap(s => s.keyTopics)
    .filter((topic, index, self) => self.indexOf(topic) === index)
    .slice(0, 10);

  // Extract preferences from facts
  const userPreferences = facts
    .filter(f => f.category === 'preference')
    .map(f => f.fact);

  // Build emotional context
  let emotionalContext: string | undefined;
  if (recentMood && lastSummary) {
    emotionalContext = `Last conversation mood: ${lastSummary.mood}. Recent emotional state: ${recentMood}.`;
  }

  // Build key facts list
  const keyFacts = facts
    .filter(f => f.importance === 'high' || f.importance === 'medium')
    .map(f => f.fact);

  return {
    userName: userName || undefined,
    relationshipLevel,
    recentTopics,
    userPreferences,
    lastConversationSummary: lastSummary?.summary,
    emotionalContext,
    keyFacts,
  };
};

export const buildMemoryPromptSection = async (companionId: string): Promise<string> => {
  const context = await getMemoryContext(companionId);

  const sections: string[] = [];

  if (context.userName) {
    sections.push(`User's name: ${context.userName}`);
  }

  sections.push(`Relationship level: ${context.relationshipLevel}/10 (${getRelationshipDescription(context.relationshipLevel)})`);

  if (context.keyFacts.length > 0) {
    sections.push(`Things you know about them:\n${context.keyFacts.map(f => `- ${f}`).join('\n')}`);
  }

  if (context.userPreferences.length > 0) {
    sections.push(`Their preferences:\n${context.userPreferences.map(p => `- ${p}`).join('\n')}`);
  }

  if (context.recentTopics.length > 0) {
    sections.push(`Previous conversation topics: ${context.recentTopics.join(', ')}`);
  }

  if (context.lastConversationSummary) {
    sections.push(`Last conversation: ${context.lastConversationSummary}`);
  }

  if (context.emotionalContext) {
    sections.push(context.emotionalContext);
  }

  return sections.join('\n\n');
};

const getRelationshipDescription = (level: number): string => {
  if (level <= 2) return 'just met';
  if (level <= 4) return 'getting to know each other';
  if (level <= 6) return 'friendly';
  if (level <= 8) return 'close friends';
  return 'very close';
};

// ============================================
// FULL MEMORY RETRIEVAL
// ============================================

export const getFullCompanionMemory = async (companionId: string): Promise<UserMemory | null> => {
  if (!db) await initMemoryDatabase();

  const memoryRow = await db!.getFirstAsync<{
    companion_id: string;
    user_name: string | null;
    relationship_level: number;
    total_call_time: number;
    last_interaction: string | null;
  }>(
    'SELECT companion_id, user_name, relationship_level, total_call_time, last_interaction FROM companion_memory WHERE companion_id = ?',
    [companionId]
  );

  if (!memoryRow) return null;

  const [facts, summaries, emotional] = await Promise.all([
    getLearnedFacts(companionId, 50),
    getConversationSummaries(companionId, 20),
    getEmotionalHistory(companionId, 30),
  ]);

  return {
    companionId: memoryRow.companion_id,
    userName: memoryRow.user_name || undefined,
    facts,
    conversationSummaries: summaries,
    emotionalLog: emotional,
    relationshipLevel: memoryRow.relationship_level,
    totalCallTime: memoryRow.total_call_time,
    lastInteraction: memoryRow.last_interaction ? new Date(memoryRow.last_interaction) : undefined,
  };
};

// ============================================
// DATA MANAGEMENT
// ============================================

export const clearCompanionMemory = async (companionId: string): Promise<void> => {
  if (!db) await initMemoryDatabase();

  await db!.runAsync('DELETE FROM learned_facts WHERE companion_id = ?', [companionId]);
  await db!.runAsync('DELETE FROM conversation_summaries WHERE companion_id = ?', [companionId]);
  await db!.runAsync('DELETE FROM emotional_log WHERE companion_id = ?', [companionId]);
  await db!.runAsync('DELETE FROM companion_memory WHERE companion_id = ?', [companionId]);

  console.log(`[MemoryService] Cleared all memory for ${companionId}`);
};

export const clearAllMemory = async (): Promise<void> => {
  if (!db) await initMemoryDatabase();

  await db!.runAsync('DELETE FROM learned_facts');
  await db!.runAsync('DELETE FROM conversation_summaries');
  await db!.runAsync('DELETE FROM emotional_log');
  await db!.runAsync('DELETE FROM companion_memory');

  console.log('[MemoryService] Cleared all memory');
};

export const getMemoryStats = async (): Promise<{
  totalCompanions: number;
  totalFacts: number;
  totalConversations: number;
  totalCallTime: number;
}> => {
  if (!db) await initMemoryDatabase();

  const companionsResult = await db!.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM companion_memory'
  );
  const factsResult = await db!.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM learned_facts'
  );
  const conversationsResult = await db!.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM conversation_summaries'
  );
  const callTimeResult = await db!.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(total_call_time), 0) as total FROM companion_memory'
  );

  return {
    totalCompanions: companionsResult?.count || 0,
    totalFacts: factsResult?.count || 0,
    totalConversations: conversationsResult?.count || 0,
    totalCallTime: callTimeResult?.total || 0,
  };
};

// Export the init function as default for easy importing
export default {
  init: initMemoryDatabase,
  saveLearnedFact,
  getLearnedFacts,
  deleteLearnedFact,
  saveConversationSummary,
  getConversationSummaries,
  getLastConversationSummary,
  recordEmotionalState,
  getEmotionalHistory,
  getRecentMood,
  getRelationshipLevel,
  updateRelationshipLevel,
  saveUserName,
  getUserName,
  getMemoryContext,
  buildMemoryPromptSection,
  getFullCompanionMemory,
  clearCompanionMemory,
  clearAllMemory,
  getMemoryStats,
};
