// Companion Voice Configuration for ElevenLabs TTS
// Each companion has a unique ElevenLabs voice matching their personality and origin

import { VoiceConfig } from '../types/companion';
import { VOICE_CONFIGS, ELEVENLABS_VOICES } from './companions';

// Re-export from companions for backward compatibility
export { VOICE_CONFIGS, ELEVENLABS_VOICES };

// Get voice config for a companion
export const getCompanionVoice = (companionId: string): VoiceConfig | undefined => {
  return VOICE_CONFIGS[companionId];
};

// Default voice for unknown companions (Australian female)
export const DEFAULT_VOICE: VoiceConfig = {
  voiceId: ELEVENLABS_VOICES.addison_au,
  voiceName: 'Addison (AU)',
  stability: 0.65,
  similarityBoost: 0.75,
  style: 0.5,
  speakerBoost: true,
};

// Voice settings interface for ElevenLabs API
export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

// Convert VoiceConfig to ElevenLabs API format
export const toElevenLabsSettings = (config: VoiceConfig): ElevenLabsVoiceSettings => {
  return {
    stability: config.stability,
    similarity_boost: config.similarityBoost,
    style: config.style,
    use_speaker_boost: config.speakerBoost,
  };
};

// Get all Australian voices
export const getAustralianVoices = () => {
  return {
    female: [
      ELEVENLABS_VOICES.addison_au,
      ELEVENLABS_VOICES.hannah_au,
      ELEVENLABS_VOICES.charlotte_au,
      ELEVENLABS_VOICES.jessica_au,
      ELEVENLABS_VOICES.lily_au,
    ],
    male: [
      ELEVENLABS_VOICES.stuart_au,
      ELEVENLABS_VOICES.charlie_au,
      ELEVENLABS_VOICES.george_au,
      ELEVENLABS_VOICES.harry_au,
      ELEVENLABS_VOICES.callum_au,
    ],
  };
};

// Get all American voices
export const getAmericanVoices = () => {
  return {
    female: [
      ELEVENLABS_VOICES.rachel,
      ELEVENLABS_VOICES.sarah,
      ELEVENLABS_VOICES.grace,
      ELEVENLABS_VOICES.aria,
      ELEVENLABS_VOICES.nicole,
    ],
    male: [
      ELEVENLABS_VOICES.drew,
      ELEVENLABS_VOICES.antoni,
      ELEVENLABS_VOICES.thomas,
      ELEVENLABS_VOICES.aaron,
      ELEVENLABS_VOICES.josh,
    ],
  };
};
