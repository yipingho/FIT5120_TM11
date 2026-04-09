/**
 * Meal Catcher — Game Screen
 * Assembles all game components into the final playable screen.
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGameEngine } from '../../../hooks/games/useGameEngine';
import ScoreDisplay from '../../../components/games/meal-catcher/ScoreDisplay';
import FallingIngredient from '../../../components/games/meal-catcher/FallingIngredient';
import Plate from '../../../components/games/meal-catcher/Plate';
import MealScorePopup from '../../../components/games/meal-catcher/MealScorePopup';
import GameOverOverlay from '../../../components/games/meal-catcher/GameOverOverlay';

import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing } from '../../../constants/Spacing';
import { Radius } from '../../../constants/Radius';


interface PlateZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function MealCatcherScreen() {
  const router = useRouter();
  const {
    gamePhase,
    timeRemaining,
    totalScore,
    activeIngredients,
    plateIngredients,
    lastMealScore,
    showMealScore,
    highScore,
    isNewHighScore,
    startGame,
    resetGame,
    catchIngredient,
    despawnIngredient,
  } = useGameEngine();

  const [plateZone, setPlateZone] = useState<PlateZone | null>(null);
  // We need absolute coordinates of the plate on screen
  const plateWrapperRef = useRef<View>(null);

  const handlePlateLayout = useCallback((zone: { x: number; y: number; width: number; height: number }) => {
    // The onLayout gives us coordinates relative to the parent.
    // We need to measure absolute position on screen.
    if (plateWrapperRef.current) {
      plateWrapperRef.current.measureInWindow((x, y, width, height) => {
        setPlateZone({ x, y, width, height });
      });
    }
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    // Small delay to let state reset before starting
    setTimeout(() => startGame(), 100);
  };

  const handleBack = () => {
    resetGame();
    router.back();
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* HUD — Score & Timer */}
        {gamePhase === 'playing' && (
          <ScoreDisplay score={totalScore} timeRemaining={timeRemaining} />
        )}

        {/* Game Field */}
        <View style={styles.gameField}>
          {/* Falling Ingredients */}
          {gamePhase === 'playing' &&
            activeIngredients.map((item) => (
              <FallingIngredient
                key={item.id}
                id={item.id}
                ingredient={item.ingredient}
                laneIndex={item.laneIndex}
                fallDuration={item.fallDuration}
                plateZone={plateZone}
                onCatch={catchIngredient}
                onDespawn={despawnIngredient}
              />
            ))}

          {/* Idle State — Start Screen */}
          {gamePhase === 'idle' && (
            <View style={styles.idleContainer}>
              <Text style={styles.idleEmoji}>🍽️</Text>
              <Text style={styles.idleTitle}>Meal Catcher</Text>
              <Text style={styles.idleSubtitle}>
                Drag falling ingredients onto your plate to build healthy meals!
              </Text>
              {highScore > 0 && (
                <Text style={styles.idleHighScore}>⭐ Best: {highScore}</Text>
              )}
              <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.85}>
                <Text style={styles.startButtonText}>Start Game</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Plate Area — always visible during play */}
        {(gamePhase === 'playing' || gamePhase === 'idle') && (
          <View style={styles.plateArea} ref={plateWrapperRef}>
            {/* Meal Score Popup */}
            <MealScorePopup
              score={lastMealScore ?? 0}
              visible={showMealScore}
            />
            <Plate
              plateIngredients={plateIngredients}
              onPlateLayout={handlePlateLayout}
            />
          </View>
        )}

        {/* Game Over Overlay */}
        {gamePhase === 'game_over' && (
          <GameOverOverlay
            score={totalScore}
            highScore={highScore}
            isNewHighScore={isNewHighScore}
            onPlayAgain={handlePlayAgain}
            onBack={handleBack}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  gameField: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  plateArea: {
    alignItems: 'center',
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface_container_low,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },

  // Idle / Start Screen
  idleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  idleEmoji: {
    fontSize: 80,
  },
  idleTitle: {
    ...Typography.displaySmall,
    color: Colors.on_surface,
    textAlign: 'center',
  },
  idleSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.on_surface_variant,
    textAlign: 'center',
    maxWidth: 280,
  },
  idleHighScore: {
    ...Typography.titleMedium,
    color: Colors.primary,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    marginTop: Spacing.md,
  },
  startButtonText: {
    ...Typography.labelLarge,
    color: Colors.on_primary,
    fontSize: 20,
  },
});
