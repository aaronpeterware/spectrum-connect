// API Configuration for Haven
// ElevenLabs Conversational AI with Gemini Flash

import Constants from 'expo-constants';

// Get environment variables from app config
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return Constants.expoConfig?.extra?.[key] || process.env[`EXPO_PUBLIC_${key.toUpperCase()}`] || defaultValue;
};

// Set to true to use local server, false for production
// Currently using Vercel backend for ElevenLabs agent endpoints
const USE_LOCAL = false;

export const API_CONFIG = {
  // Base URL for the API server (for user auth, companion data, etc.)
  API_URL: USE_LOCAL
    ? 'http://192.168.1.104:3000'
    : getEnvVar('apiUrl', 'https://app-eight-gamma-63.vercel.app'),

  // ElevenLabs API Key
  ELEVENLABS_API_KEY: getEnvVar('elevenLabsApiKey'),

  // Supabase URLs (for user authentication)
  SUPABASE_URL: getEnvVar('supabaseUrl'),
  SUPABASE_ANON_KEY: getEnvVar('supabaseAnonKey'),
};

// Helper to check if API is configured for production
export const isProductionReady = (): boolean => {
  return !API_CONFIG.API_URL.includes('192.168');
};

// Helper to check if ElevenLabs is configured
export const isElevenLabsConfigured = (): boolean => {
  return !!API_CONFIG.ELEVENLABS_API_KEY && API_CONFIG.ELEVENLABS_API_KEY.startsWith('sk_');
};

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!API_CONFIG.SUPABASE_URL && !!API_CONFIG.SUPABASE_ANON_KEY;
};

export default API_CONFIG;
