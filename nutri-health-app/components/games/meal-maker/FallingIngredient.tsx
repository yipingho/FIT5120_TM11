/**
 * FallingIngredient — Animated ingredient that falls from top to bottom.
 * Supports drag-to-catch gesture. Has random spin animation.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { IngredientDefinition, NUM_LANES } from '../../../constants/GameConfig';
import { Radius } from '../../../constants/Radius';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INGREDIENT_SIZE = 70;
const LANE_WIDTH = SCREEN_WIDTH / NUM_LANES;

interface PlateZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FallingIngredientProps {
  id: string;
  ingredient: IngredientDefinition;
  laneIndex: number;
  fallDuration: number;
  plateZone: PlateZone | null;
  onCatch: (id: string) => void;
  onDespawn: (id: string) => void;
}

export default function FallingIngredient({
  id,
  ingredient,
  laneIndex,
  fallDuration,
  plateZone,
  onCatch,
  onDespawn,
}: FallingIngredientProps) {
  const laneX = laneIndex * LANE_WIDTH + LANE_WIDTH / 2 - INGREDIENT_SIZE / 2;

  // Fall animation
  const fallY = useSharedValue(-INGREDIENT_SIZE);
  // Spin animation
  const rotation = useSharedValue(0);
  // Drag offset
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  // Whether currently being dragged
  const isDragging = useSharedValue(false);
  // Whether caught (hide after catch)
  const isCaught = useSharedValue(false);

  // Track fall progress for snap-back
  const fallYAtDragStart = useSharedValue(0);

  const isCaughtRef = useRef(false);

  useEffect(() => {
    // Start fall animation
    fallY.value = withTiming(
      SCREEN_HEIGHT + INGREDIENT_SIZE,
      {
        duration: fallDuration,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished && !isCaughtRef.current) {
          runOnJS(onDespawn)(id);
        }
      }
    );

    // Random spin direction and speed
    const spinDuration = 1600 + Math.random() * 600;
    const spinDirection = Math.random() > 0.5 ? 360 : -360;
    rotation.value = withRepeat(
      withTiming(spinDirection, { duration: spinDuration, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const isInsidePlateZone = (absX: number, absY: number): boolean => {
    if (!plateZone) return false;
    const cx = plateZone.x + plateZone.width / 2;
    const cy = plateZone.y + plateZone.height / 2;
    const radius = Math.min(plateZone.width, plateZone.height) / 2 + 20; // 20px tolerance
    const dx = absX - cx;
    const dy = absY - cy;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
      fallYAtDragStart.value = fallY.value;
      // Pause fall by setting to current position
      fallY.value = fallY.value;
    })
    .onUpdate((event) => {
      dragX.value = event.translationX;
      dragY.value = event.translationY;
    })
    .onEnd((event) => {
      isDragging.value = false;

      // Absolute position of ingredient center during release
      const absX = laneX + INGREDIENT_SIZE / 2 + event.translationX;
      const absY = fallYAtDragStart.value + INGREDIENT_SIZE / 2 + event.translationY;

      if (isInsidePlateZone(absX, absY)) {
        // Caught!
        isCaught.value = true;
        isCaughtRef.current = true;
        dragX.value = 0;
        dragY.value = 0;
        runOnJS(onCatch)(id);
      } else {
        // Snap back and resume falling
        dragX.value = withSpring(0, { damping: 15, stiffness: 200 });
        dragY.value = withSpring(0, { damping: 15, stiffness: 200 });

        // Resume fall from current position
        const remainingDistance = SCREEN_HEIGHT + INGREDIENT_SIZE - fallYAtDragStart.value;
        const remainingDuration = (remainingDistance / (SCREEN_HEIGHT + INGREDIENT_SIZE * 2)) * fallDuration;

        fallY.value = withTiming(
          SCREEN_HEIGHT + INGREDIENT_SIZE,
          {
            duration: Math.max(remainingDuration, 500),
            easing: Easing.linear,
          },
          (finished) => {
            if (finished && !isCaughtRef.current) {
              runOnJS(onDespawn)(id);
            }
          }
        );
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    if (isCaught.value) {
      return { opacity: 0 };
    }
    return {
      transform: [
        { translateX: laneX + dragX.value },
        { translateY: fallY.value + dragY.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: 1,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.ingredient,
          { backgroundColor: ingredient.color },
          animatedStyle,
        ]}
      >
        <Text style={styles.emoji}>{ingredient.emoji}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  ingredient: {
    position: 'absolute',
    width: INGREDIENT_SIZE,
    height: INGREDIENT_SIZE,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    top: 0,
    left: 0,
  },
  emoji: {
    fontSize: 36,
  },
});
