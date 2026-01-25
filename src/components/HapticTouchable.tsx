import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useSettings } from '../context/SettingsContext';

interface HapticTouchableProps extends TouchableOpacityProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

/**
 * TouchableOpacity wrapper that automatically triggers haptic feedback
 * Respects the user's haptic feedback setting
 */
export const HapticTouchable: React.FC<HapticTouchableProps> = ({
  hapticType = 'light',
  onPress,
  children,
  ...props
}) => {
  const { triggerHaptic } = useSettings();

  const handlePress = (event: any) => {
    triggerHaptic(hapticType);
    onPress?.(event);
  };

  return (
    <TouchableOpacity onPress={handlePress} {...props}>
      {children}
    </TouchableOpacity>
  );
};

export default HapticTouchable;
