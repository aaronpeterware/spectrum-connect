// Companion Types for Haven Voice AI
// Comprehensive type definitions for companion profiles and voice configurations

export type Gender = 'female' | 'male';
export type Country = 'australia' | 'usa';

export interface CompanionBackstory {
  childhood: string;
  family: string;
  education: string;
  career: string;
  friends: string;
  loveLife: string;
  dailyLife: string;
}

export interface PersonalityTraits {
  primary: string[];
  secondary: string[];
  quirks: string[];
  speechPatterns: string[];
  emotionalStyle: string;
  empathyApproach: string;
}

export interface CompanionProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  country: Country;
  location: string;
  profileImage: string;
  gallery: string[];
  role: string;
  description: string;
  backstory: CompanionBackstory;
  personality: PersonalityTraits;
  interests: string[];
  conversationStyle: string;
  voiceId: string;
  elevenLabsVoiceName: string;
  funFact: string;
}

export interface VoiceConfig {
  voiceId: string;
  voiceName: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speakerBoost: boolean;
}

export interface UserMemory {
  companionId: string;
  userName?: string;
  facts: LearnedFact[];
  conversationSummaries: ConversationSummary[];
  emotionalLog: EmotionalEntry[];
  relationshipLevel: number;
  totalCallTime: number;
  lastInteraction?: Date;
}

export interface LearnedFact {
  id: string;
  fact: string;
  importance: 'low' | 'medium' | 'high';
  category: 'personal' | 'preference' | 'experience' | 'emotion' | 'relationship';
  learnedAt: Date;
}

export interface ConversationSummary {
  id: string;
  date: Date;
  duration: number;
  summary: string;
  mood: string;
  keyTopics: string[];
}

export interface EmotionalEntry {
  id: string;
  timestamp: Date;
  mood: string;
  context: string;
  intensity: number;
}

export interface MemoryContext {
  userName?: string;
  relationshipLevel: number;
  recentTopics: string[];
  userPreferences: string[];
  lastConversationSummary?: string;
  emotionalContext?: string;
  keyFacts: string[];
}
