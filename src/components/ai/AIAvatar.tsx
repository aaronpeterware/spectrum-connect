import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Canvas, Circle, BlurMask, Group } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

type AIState = 'online' | 'thinking' | 'speaking' | 'listening';

interface AIAvatarProps {
  imageUri?: string;
  size?: number;
  state?: AIState;
  calmMode?: boolean;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({
  imageUri,
  size = 60,
  state = 'online',
  calmMode = false,
}) => {
  const breathingValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (calmMode) {
      breathingValue.value = 0;
      pulseValue.value = 1;
      return;
    }

    // Different animations based on state
    switch (state) {
      case 'speaking':
        pulseValue.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 200 }),
            withTiming(1, { duration: 200 })
          ),
          -1
        );
        break;
      case 'thinking':
        breathingValue.value = withRepeat(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        break;
      case 'listening':
        pulseValue.value = withRepeat(
          withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
        break;
      default: // online
        breathingValue.value = withRepeat(
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        );
    }
  }, [state, calmMode]);

  const getStateColor = () => {
    switch (state) {
      case 'thinking':
        return Colors.aiThinking;
      case 'speaking':
        return Colors.aiSpeaking;
      case 'listening':
        return Colors.aiListening;
      default:
        return Colors.aiOnline;
    }
  };

  const canvasSize = size + 24; // Extra space for glow
  const center = canvasSize / 2;
  const avatarRadius = size / 2;

  return (
    <View style={[styles.container, { width: canvasSize, height: canvasSize }]}>
      {/* Skia Canvas for animated glow rings */}
      {!calmMode && (
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Outer soft glow */}
          <Circle
            cx={center}
            cy={center}
            r={avatarRadius + 12}
            color={getStateColor()}
            opacity={0.15}
          >
            <BlurMask blur={15} style="normal" />
          </Circle>

          {/* Inner breathing ring */}
          <Circle
            cx={center}
            cy={center}
            r={avatarRadius + 6}
            color={getStateColor()}
            opacity={0.3}
          >
            <BlurMask blur={8} style="normal" />
          </Circle>
        </Canvas>
      )}

      {/* Avatar Image */}
      <View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            top: 12,
            left: 12,
          },
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.placeholder, { borderRadius: size / 2 }]} />
        )}
      </View>

      {/* Status dot */}
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: getStateColor(),
            bottom: 10,
            right: 10,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: Colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
  },
  statusDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});

export default AIAvatar;
