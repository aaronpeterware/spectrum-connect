import { useThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../constants/theme';

export type ThemeMode = 'light' | 'dark';

export interface UseThemeReturn {
  colors: ThemeColors;
  isDark: boolean;
}

/**
 * Hook to get the current theme colors based on user settings and system preference
 */
export function useTheme(): UseThemeReturn {
  const { colors, isDark } = useThemeContext();
  return { colors, isDark };
}

export default useTheme;
