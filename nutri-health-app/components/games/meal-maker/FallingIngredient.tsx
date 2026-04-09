/**
 * FallingIngredient — Animated ingredient that falls from top to bottom.
 * Supports drag-to-catch gesture. Has random spin animation.
 * On missed drop: shrinks and despawns instead of resuming fall.
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

// Plate zone detection: use a generous radius around the plate center
// The plate is 200px wide, so radius ~120px gives good coverage
const PLATE_CATCH_RADIUS = 120;

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
  // Scale — used for shrink-on-miss despawn
  const scale = useSharedValue(1);
  // Whether caught (hide after catch)
  const isCaught = useSharedValue(false);

  // Track fall Y at drag start for plate zone calculation
  const fallYAtDragStart = useSharedValue(0);

  const isCaughtRef = useRef(false);
  const isDespawningRef = useRef(false);

  useEffect(() => {
    // Start fall animation
    fallY.value = withTiming(
      SCREEN_HEIGHT + INGREDIENT_SIZE,
      {
        duration: fallDuration,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished && !isCaughtRef.current && !isDespawningRef.current) {
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

  const isInsidePlateZone = (fingerX: number, fingerY: number): boolean => {
    if (!plateZone) return false;
    // Use the center of the plate zone
    const cx = plateZone.x + plateZone.width / 2;
    const cy = plateZone.y + plateZone.height / 2;
    const dx = fingerX - cx;
    const dy = fingerY - cy;
    return Math.sqrt(dx * dx + dy * dy) <= PLATE_CATCH_RADIUS;
  };

  const handleRelease = (fingerX: number, fingerY: number) => {
    if (isCaughtRef.current || isDespawningRef.current) return;

    if (isInsidePlateZone(fingerX, fingerY)) {
      // Caught!
      isCaught.value = true;
      isCaughtRef.current = true;
      dragX.value = 0;
      dragY.value = 0;
      runOnJS(onCatch)(id);
    } else {
      // Missed — shrink and despawn
      isDespawningRef.current = true;
      dragX.value = withSpring(0, { damping: 20, stiffness: 300 });
      dragY.value = withSpring(0, { damping: 20, stiffness: 300 });
      scale.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(onDespawn)(id);
        }
      });
    }
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      fallYAtDragStart.value = fallY.value;
      // Pause fall
      fallY.value = fallY.value;
    })
    .onUpdate((event) => {
      dragX.value = event.translationX;
      dragY.value = event.translationY;
    })
    .onEnd((event) => {
      handleRelease(event.absoluteX, event.absoluteY);
    })
    .onTouchesUp((event) => {
      // Fires even on a simple tap (when onEnd may not fire)
      const touch = event.changedTouches[0];
      if (touch) {
        handleRelease(touch.absoluteX, touch.absoluteY);
      }
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => {
    if (isCaught.value) {
      return { opacity: 0 };
    }
    return {
      transform: [
        { translateX: laneX + dragX.value },
        { translateY: fallY.value + dragY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
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
    elevation: 10,
    top: 0,
    left: 0,
    zIndex: 10,
  },
  emoji: {
    fontSize: 36,
  },
});
