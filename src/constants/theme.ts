export const Colors = {
  // Brand colors from logo gradient
  primary: '#8B5CF6',      // Purple
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  secondary: '#EC4899',    // Pink
  secondaryLight: '#F472B6',
  accent: '#2DD4BF',       // Mint/Teal
  accentLight: '#5EEAD4',
  blue: '#3B82F6',         // Blue
  blueLight: '#60A5FA',

  // Gradient stops (for matching logo)
  gradientPink: '#E879F9',
  gradientPurple: '#8B5CF6',
  gradientBlue: '#3B82F6',
  gradientMint: '#2DD4BF',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Grays
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Backgrounds
  background: '#F5F5F5',
  surface: '#FFFFFF',
  dark: '#1A1A2E',

  // AI State colors
  aiOnline: '#10B981',
  aiThinking: '#F59E0B',
  aiSpeaking: '#7C3AED',
  aiListening: '#3B82F6',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};
