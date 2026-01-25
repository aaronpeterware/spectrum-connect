// Haven App Configuration
// This file extends app.json with environment-specific configuration

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      // ElevenLabs API Key for voice conversations
      elevenLabsApiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',

      // Supabase configuration (for user auth)
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

      // API URLs
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://app-eight-gamma-63.vercel.app',
    },
    plugins: [
      ...(config.plugins || []),
      // Add ElevenLabs audio permissions if needed
    ],
  };
};
