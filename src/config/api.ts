// API Configuration
// In production, these should come from environment variables

// For development, change this to your local IP
// For production, change to your actual API server URL
export const API_CONFIG = {
  // Base URL for the API server
  API_URL: __DEV__
    ? 'http://192.168.1.104:3000'  // Development - change to your local IP
    : 'https://api.spectrumconnect.app', // Production URL (update when you have one)

  // WebSocket URL for real-time features
  WS_URL: __DEV__
    ? 'ws://192.168.1.104:3001'   // Development
    : 'wss://ws.spectrumconnect.app', // Production URL (update when you have one)
};

// Helper to check if API is configured for production
export const isProductionReady = () => {
  return !API_CONFIG.API_URL.includes('192.168');
};
