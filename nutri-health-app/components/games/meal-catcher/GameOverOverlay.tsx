/**
 * GameOverOverlay — End-of-round results screen
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing } from '../../../constants/Spacing';
import { Radius } from '../../../constants/Radius';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GameOverOverlayProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onBack: () => void;
}

export default function GameOverOverlay({
  score,
  highScore,
  isNewHighScore,
  onPlayAgain,
  onBack,
}: GameOverOverlayProps) {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isNewHighScore) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        4,
        false
      );
    }
  }, [isNewHighScore]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{"Time's Up! ⏰"}</Text>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Your Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        <View style={styles.highScoreRow}>
          <Text style={styles.highScoreText}>Best: {highScore}</Text>
        </View>

        {isNewHighScore && (
          <Animated.View style={[styles.newHighScoreBadge, pulseStyle]}>
            <Text style={styles.newHighScoreText}>🎉 New High Score!</Text>
          </Animated.View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={onPlayAgain} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onBack} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242, 249, 234, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: Colors.surface_container_lowest,
    borderRadius: Radius.modal,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
    gap: Spacing.md,
  },
  title: {
    ...Typography.displaySmall,
    color: Colors.on_surface,
    textAlign: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  scoreLabel: {
    ...Typography.titleMedium,
    color: Colors.on_surface_variant,
  },
  scoreValue: {
    ...Typography.headlineLarge,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  highScoreRow: {
    marginTop: Spacing.xs,
  },
  highScoreText: {
    ...Typography.titleLarge,
    color: Colors.on_surface_variant,
  },
  newHighScoreBadge: {
    backgroundColor: Colors.secondary_container,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  newHighScoreText: {
    ...Typography.headlineMedium,
    color: Colors.on_secondary_container,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...Typography.labelLarge,
    color: Colors.on_primary,
    fontSize: 18,
  },
  secondaryButton: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.outline_variant,
  },
  secondaryButtonText: {
    ...Typography.labelLarge,
    color: Colors.on_surface_variant,
    fontSize: 18,
  },
});
