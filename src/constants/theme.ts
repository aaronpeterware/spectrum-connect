// Light theme colors
export const LightColors = {
  // Brand colors
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  secondary: '#EC4899',
  secondaryLight: '#F472B6',
  accent: '#2DD4BF',
  accentLight: '#5EEAD4',
  blue: '#3B82F6',
  blueLight: '#60A5FA',

  // Gradient stops
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

  // Semantic colors
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  dark: '#1A1A2E',

  // Card colors
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',

  // Input colors
  inputBackground: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',

  // AI State colors
  aiOnline: '#10B981',
  aiThinking: '#F59E0B',
  aiSpeaking: '#7C3AED',
  aiListening: '#3B82F6',
};

// Dark theme colors
export const DarkColors = {
  // Brand colors (same as light)
  primary: '#A78BFA',
  primaryLight: '#C4B5FD',
  primaryDark: '#8B5CF6',
  secondary: '#F472B6',
  secondaryLight: '#F9A8D4',
  accent: '#5EEAD4',
  accentLight: '#99F6E4',
  blue: '#60A5FA',
  blueLight: '#93C5FD',

  // Gradient stops
  gradientPink: '#F0ABFC',
  gradientPurple: '#A78BFA',
  gradientBlue: '#60A5FA',
  gradientMint: '#5EEAD4',

  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',

  // Grays (inverted)
  gray50: '#0F172A',
  gray100: '#1E293B',
  gray200: '#334155',
  gray300: '#475569',
  gray400: '#64748B',
  gray500: '#94A3B8',
  gray600: '#CBD5E1',
  gray700: '#E2E8F0',
  gray800: '#F1F5F9',
  gray900: '#F8FAFC',

  // Semantic colors
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  border: '#334155',
  divider: '#1E293B',
  dark: '#0F172A',

  // Card colors
  cardBackground: '#1E293B',
  cardBorder: '#334155',

  // Input colors
  inputBackground: '#334155',
  inputBorder: '#475569',
  inputText: '#F8FAFC',
  inputPlaceholder: '#94A3B8',

  // AI State colors
  aiOnline: '#34D399',
  aiThinking: '#FBBF24',
  aiSpeaking: '#A78BFA',
  aiListening: '#60A5FA',
};

// Default export for backwards compatibility (light theme)
export const Colors = LightColors;

// Theme type
export type ThemeColors = typeof LightColors;

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
