import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { useSettings } from './SettingsContext';
import { LightColors, DarkColors, ThemeColors } from '../constants/theme';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: LightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, isLoaded } = useSettings();
  const systemColorScheme = useColorScheme();

  const { colors, isDark } = useMemo(() => {
    // Default to light if settings not loaded yet
    if (!isLoaded) {
      return { colors: LightColors, isDark: false };
    }

    let currentIsDark: boolean;

    if (settings.theme === 'system') {
      currentIsDark = systemColorScheme === 'dark';
    } else {
      currentIsDark = settings.theme === 'dark';
    }

    return {
      colors: currentIsDark ? DarkColors : LightColors,
      isDark: currentIsDark,
    };
  }, [settings.theme, systemColorScheme, isLoaded]);

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}

export default ThemeContext;
