/**
 * Meal Maker — Game Screen
 * Assembles all game components into the final playable screen.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';

import { useGameEngine } from '../../../hooks/games/useGameEngine';
import ScoreDisplay from '../../../components/games/meal-maker/ScoreDisplay';
import FallingIngredient from '../../../components/games/meal-maker/FallingIngredient';
import Plate from '../../../components/games/meal-maker/Plate';
import MealScorePopup from '../../../components/games/meal-maker/MealScorePopup';
import GameOverOverlay from '../../../components/games/meal-maker/GameOverOverlay';

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

export default function MealMakerScreen() {
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
  const plateWrapperRef = useRef<View>(null);

  // ─── Audio ───────────────────────────────────────────────────────────────────
  const menuSoundRef = useRef<Audio.Sound | null>(null);
  const roundSoundRef = useRef<Audio.Sound | null>(null);

  const stopMenuMusic = useCallback(async () => {
    if (menuSoundRef.current) {
      try {
        await menuSoundRef.current.stopAsync();
        await menuSoundRef.current.unloadAsync();
      } catch (_) {}
      menuSoundRef.current = null;
    }
  }, []);

  const stopRoundMusic = useCallback(async () => {
    if (roundSoundRef.current) {
      try {
        await roundSoundRef.current.stopAsync();
        await roundSoundRef.current.unloadAsync();
      } catch (_) {}
      roundSoundRef.current = null;
    }
  }, []);

  const playMenuMusic = useCallback(async () => {
    await stopMenuMusic();
    await stopRoundMusic();
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/audio/menu-audio.mp3'),
        { isLooping: true, shouldPlay: true }
      );
      menuSoundRef.current = sound;
    } catch (_) {}
  }, [stopMenuMusic, stopRoundMusic]);

  const playRoundMusic = useCallback(async () => {
    await stopMenuMusic();
    await stopRoundMusic();
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/audio/round-audio.mp3'),
        { isLooping: false, shouldPlay: true }
      );
      roundSoundRef.current = sound;
    } catch (_) {}
  }, [stopMenuMusic, stopRoundMusic]);

  // Play menu music when screen is focused (idle state)
  useFocusEffect(
    useCallback(() => {
      // Start menu music when screen gains focus
      playMenuMusic();

      return () => {
        // Stop all music when screen loses focus (navigating away)
        stopMenuMusic();
        stopRoundMusic();
      };
    }, [playMenuMusic, stopMenuMusic, stopRoundMusic])
  );

  // Switch music based on game phase
  useEffect(() => {
    if (gamePhase === 'playing') {
      playRoundMusic();
    } else if (gamePhase === 'idle' || gamePhase === 'game_over') {
      stopRoundMusic();
      if (gamePhase === 'idle') {
        playMenuMusic();
      }
    }
  }, [gamePhase]);

  // ─── Plate Layout ────────────────────────────────────────────────────────────

  const handlePlateLayout = useCallback((_zone: { x: number; y: number; width: number; height: number }) => {
    if (plateWrapperRef.current) {
      plateWrapperRef.current.measureInWindow((x, y, width, height) => {
        setPlateZone({ x, y, width, height });
      });
    }
  }, []);

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const handlePlayAgain = () => {
    resetGame();
    setTimeout(() => startGame(), 100);
  };

  const handleBack = () => {
    resetGame();
    router.back();
  };

  const handleStartGame = () => {
    startGame();
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* HUD — Score & Timer */}
        {gamePhase === 'playing' && (
          <ScoreDisplay score={totalScore} timeRemaining={timeRemaining} />
        )}

        {/* Game Field — ingredients render here, above the plate area */}
        <View style={styles.gameField}>
          {/* Falling Ingredients — rendered with high zIndex to appear above plate */}
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
              <Text style={styles.idleTitle}>Meal Maker</Text>
              <Text style={styles.idleSubtitle}>
                Drag falling ingredients onto your plate to build healthy meals!
              </Text>
              {highScore > 0 && (
                <Text style={styles.idleHighScore}>⭐ Best: {highScore}</Text>
              )}
              <TouchableOpacity style={styles.startButton} onPress={handleStartGame} activeOpacity={0.85}>
                <Text style={styles.startButtonText}>Start Game</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Plate Area — sits below game field, but ingredients float above it via zIndex */}
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
    // Do NOT use overflow: 'hidden' — it clips ingredients that overlap the plate area
    zIndex: 1,
  },
  plateArea: {
    alignItems: 'center',
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface_container_low,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    zIndex: 0,
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
