/**
 * MealScorePopup — Brief animated popup showing meal score
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

interface MealScorePopupProps {
  score: number;
  visible: boolean;
}

export default function MealScorePopup({ score, visible }: MealScorePopupProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = 0;
      translateY.value = 0;

      // Fade in → hold → float up + fade out
      opacity.value = withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
        withDelay(900, withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) }))
      );

      translateY.value = withSequence(
        withTiming(0, { duration: 200 }),
        withDelay(900, withTiming(-40, { duration: 500, easing: Easing.in(Easing.ease) }))
      );
    } else {
      opacity.value = 0;
    }
  }, [visible, score]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.Text style={[styles.text, animatedStyle]}>
      +{score} pts!
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...Typography.displaySmall,
    color: Colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0,107,27,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
