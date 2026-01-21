import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

interface TypingIndicatorProps {
  calmMode?: boolean;
}

const AnimatedDot: React.FC<{ delay: number; calmMode: boolean }> = ({
  delay,
  calmMode,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (calmMode) {
      scale.value = 1;
      opacity.value = 0.6;
      return;
    }

    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [calmMode]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  calmMode = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <AnimatedDot delay={0} calmMode={calmMode} />
        <AnimatedDot delay={200} calmMode={calmMode} />
        <AnimatedDot delay={400} calmMode={calmMode} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.aiSpeaking,
    shadowColor: Colors.aiSpeaking,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});

export default TypingIndicator;
