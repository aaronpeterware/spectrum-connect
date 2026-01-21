import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { Canvas, Fill, Shader, Skia, vec } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// SKSL Shader for calming gradient
const shaderSource = `
uniform float time;
uniform vec2 resolution;

vec4 main(vec2 xy) {
  vec2 uv = xy / resolution;

  // Very slow, gentle wave
  float wave = sin(uv.x * 2.0 + time * 0.3) * 0.05;
  float wave2 = cos(uv.y * 1.5 + time * 0.2) * 0.03;

  // Soft purple to pink to white gradient
  vec3 purple = vec3(0.486, 0.227, 0.929);   // #7C3AED
  vec3 pink = vec3(1.0, 0.42, 0.616);         // #FF6B9D
  vec3 white = vec3(0.976, 0.98, 0.988);      // #F8FAFC

  // Create smooth gradient with subtle animation
  float mixValue = uv.y + wave + wave2;

  vec3 color;
  if (mixValue < 0.3) {
    color = mix(white, purple * 0.1 + white * 0.9, mixValue / 0.3);
  } else if (mixValue < 0.7) {
    color = mix(purple * 0.08 + white * 0.92, pink * 0.05 + white * 0.95, (mixValue - 0.3) / 0.4);
  } else {
    color = mix(pink * 0.05 + white * 0.95, white, (mixValue - 0.7) / 0.3);
  }

  return vec4(color, 1.0);
}
`;

interface CalmBackgroundProps {
  calmMode?: boolean;
}

export const CalmBackground: React.FC<CalmBackgroundProps> = ({
  calmMode = false,
}) => {
  const time = useSharedValue(0);

  useEffect(() => {
    if (calmMode) {
      time.value = 0;
      return;
    }

    // Very slow animation - 30 seconds per cycle
    time.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 30000 }),
      -1
    );
  }, [calmMode]);

  const uniforms = useDerivedValue(() => ({
    time: time.value,
    resolution: vec(width, height),
  }));

  // Try to create shader, fallback to simple gradient if Skia not available
  let shader;
  try {
    shader = Skia.RuntimeEffect.Make(shaderSource);
  } catch (e) {
    // Fallback to simple view
    return (
      <View style={[StyleSheet.absoluteFill, styles.fallbackBackground]} />
    );
  }

  if (!shader) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.fallbackBackground]} />
    );
  }

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <Shader source={shader} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  fallbackBackground: {
    backgroundColor: '#F8FAFC',
  },
});

export default CalmBackground;
