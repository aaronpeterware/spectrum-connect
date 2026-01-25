// Companion Profiles - Backward Compatibility Layer
// Re-exports from the new comprehensive companions.ts

import { CompanionProfile as NewCompanionProfile, Gender } from '../types/companion';
import {
  COMPANIONS as NEW_COMPANIONS,
  getCompanionById as getNewCompanionById,
  getCompanionsByGender as getNewCompanionsByGender,
  VOICE_CONFIGS,
} from './companions';

// Legacy interface for backward compatibility
export interface CompanionProfile {
  id: string;
  name: string;
  age: number;
  gender: 'female' | 'male';
  location: string;
  profileImage: string;
  gallery: string[];
  description: string;
  personality: string;
  interests: string[];
  conversationStyle: string;
  voiceId: string;
  traits: string[];
  funFact: string;
}

// Convert new profile format to legacy format
const convertToLegacy = (profile: NewCompanionProfile): CompanionProfile => {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    gender: profile.gender,
    location: profile.location,
    profileImage: profile.profileImage,
    gallery: profile.gallery,
    description: profile.description,
    personality: profile.personality.primary.join(', '),
    interests: profile.interests,
    conversationStyle: profile.conversationStyle,
    voiceId: profile.voiceId,
    traits: profile.personality.primary,
    funFact: profile.funFact,
  };
};

// Legacy VOICES object for backward compatibility
export const VOICES = Object.fromEntries(
  Object.entries(VOICE_CONFIGS).map(([key, config]) => [key, config.voiceId])
);

// Export companions in legacy format
export const COMPANIONS: CompanionProfile[] = NEW_COMPANIONS.map(convertToLegacy);

// Legacy getCompanionById
export const getCompanionById = (id: string): CompanionProfile | undefined => {
  const profile = getNewCompanionById(id);
  return profile ? convertToLegacy(profile) : undefined;
};

// Legacy getCompanionsByGender
export const getCompanionsByGender = (gender: 'female' | 'male'): CompanionProfile[] => {
  return getNewCompanionsByGender(gender).map(convertToLegacy);
};

export default COMPANIONS;
