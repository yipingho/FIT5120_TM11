/**
 * useGameEngine — Custom hook for "Meal Maker" game state & logic
 *
 * Manages: game phase, timer, ingredient spawning, plate state,
 * meal completion, scoring, and difficulty progression.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import {
  ROUND_DURATION_SECONDS,
  NUM_LANES,
  MAX_INGREDIENTS_PER_LANE,
  MAX_ACTIVE_INGREDIENTS,
  PLATE_CAPACITY,
  LANE_BLOCK_COUNT,
  IngredientDefinition,
  getRandomIngredient,
  calculateMealScore,
  getCurrentFallDuration,
  getCurrentSpawnInterval,
} from '../../constants/GameConfig';
import { saveGameScore, getHighScore } from '../../services/gameStorage';

export const GAME_ID = 'meal-maker';

export type GamePhase = 'idle' | 'playing' | 'game_over';

export interface ActiveIngredient {
  id: string;
  ingredient: IngredientDefinition;
  laneIndex: number;
  fallDuration: number;
}

export interface GameState {
  gamePhase: GamePhase;
  timeRemaining: number;
  totalScore: number;
  activeIngredients: ActiveIngredient[];
  plateIngredients: IngredientDefinition[];
  lastMealScore: number | null;
  showMealScore: boolean;
  highScore: number;
  isNewHighScore: boolean;
}

export interface GameActions {
  startGame: () => void;
  resetGame: () => void;
  catchIngredient: (id: string) => void;
  despawnIngredient: (id: string) => void;
}

const initialState: GameState = {
  gamePhase: 'idle',
  timeRemaining: ROUND_DURATION_SECONDS,
  totalScore: 0,
  activeIngredients: [],
  plateIngredients: [],
  lastMealScore: null,
  showMealScore: false,
  highScore: 0,
  isNewHighScore: false,
};

export function useGameEngine(): GameState & GameActions {
  const [state, setState] = useState<GameState>(initialState);

  // Refs for intervals (avoid stale closures)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedSecondsRef = useRef(0);
  const totalScoreRef = useRef(0);
  const activeIngredientsRef = useRef<ActiveIngredient[]>([]);
  const plateIngredientsRef = useRef<IngredientDefinition[]>([]);
  const isMealCompletingRef = useRef(false);

  // Lane occupancy: laneIndex → count of ingredients currently in that lane
  const laneCountsRef = useRef<number[]>(new Array(NUM_LANES).fill(0));

  // Lane blocking: laneIndex → number of remaining spawns this lane is blocked for
  // After spawning in a lane, it is blocked for LANE_BLOCK_COUNT subsequent spawns.
  const laneBlockCountdownRef = useRef<number[]>(new Array(NUM_LANES).fill(0));

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  const clearAllIntervals = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (spawnerRef.current) {
      clearTimeout(spawnerRef.current);
      spawnerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Load high score on mount
    getHighScore(GAME_ID).then((hs) => {
      setState((prev) => ({ ...prev, highScore: hs }));
    });
    return clearAllIntervals;
  }, [clearAllIntervals]);

  // ─── End Game ───────────────────────────────────────────────────────────────

  const endGame = useCallback(async () => {
    clearAllIntervals();
    const finalScore = totalScoreRef.current;
    const isNew = await saveGameScore(GAME_ID, finalScore);
    const hs = await getHighScore(GAME_ID);

    setState((prev) => ({
      ...prev,
      gamePhase: 'game_over',
      timeRemaining: 0,
      activeIngredients: [],
      plateIngredients: [],
      showMealScore: false,
      highScore: hs,
      isNewHighScore: isNew,
    }));

    activeIngredientsRef.current = [];
    plateIngredientsRef.current = [];
    laneCountsRef.current = new Array(NUM_LANES).fill(0);
    laneBlockCountdownRef.current = new Array(NUM_LANES).fill(0);
    isMealCompletingRef.current = false;
  }, [clearAllIntervals]);

  // ─── Spawner ─────────────────────────────────────────────────────────────────

  const scheduleNextSpawn = useCallback(() => {
    const elapsed = elapsedSecondsRef.current;
    const interval = getCurrentSpawnInterval(elapsed);

    spawnerRef.current = setTimeout(() => {
      // Check if we can spawn
      const active = activeIngredientsRef.current;
      if (active.length >= MAX_ACTIVE_INGREDIENTS) {
        scheduleNextSpawn();
        return;
      }

      // Decrement all lane block countdowns
      const blockCountdowns = laneBlockCountdownRef.current;
      const newBlockCountdowns = blockCountdowns.map((c) => Math.max(0, c - 1));
      laneBlockCountdownRef.current = newBlockCountdowns;

      // Find available lanes:
      // - not blocked (countdown === 0)
      // - not at max occupancy
      const laneCounts = laneCountsRef.current;
      const availableLanes = laneCounts
        .map((count, idx) => ({ count, idx, blocked: newBlockCountdowns[idx] > 0 }))
        .filter(({ count, blocked }) => count < MAX_INGREDIENTS_PER_LANE && !blocked)
        .map(({ idx }) => idx);

      if (availableLanes.length === 0) {
        scheduleNextSpawn();
        return;
      }

      // Pick a random available lane
      const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];

      // Block this lane for the next LANE_BLOCK_COUNT spawns
      laneBlockCountdownRef.current[laneIndex] = LANE_BLOCK_COUNT;

      // Pick a random ingredient
      const ingredient = getRandomIngredient();

      // Calculate fall duration based on elapsed time
      const { min, max } = getCurrentFallDuration(elapsed);
      const fallDuration = min + Math.random() * (max - min);

      const newIngredient: ActiveIngredient = {
        id: `${ingredient.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        ingredient,
        laneIndex,
        fallDuration,
      };

      laneCountsRef.current[laneIndex] += 1;
      activeIngredientsRef.current = [...active, newIngredient];

      setState((prev) => ({
        ...prev,
        activeIngredients: activeIngredientsRef.current,
      }));

      scheduleNextSpawn();
    }, interval);
  }, []);

  // ─── Start Game ──────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    clearAllIntervals();

    elapsedSecondsRef.current = 0;
    totalScoreRef.current = 0;
    activeIngredientsRef.current = [];
    plateIngredientsRef.current = [];
    laneCountsRef.current = new Array(NUM_LANES).fill(0);
    laneBlockCountdownRef.current = new Array(NUM_LANES).fill(0);
    isMealCompletingRef.current = false;

    setState((prev) => ({
      ...prev,
      gamePhase: 'playing',
      timeRemaining: ROUND_DURATION_SECONDS,
      totalScore: 0,
      activeIngredients: [],
      plateIngredients: [],
      lastMealScore: null,
      showMealScore: false,
      isNewHighScore: false,
    }));

    // Start countdown timer
    timerRef.current = setInterval(() => {
      elapsedSecondsRef.current += 1;
      setState((prev) => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          endGame();
          return prev;
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    // Start spawner
    scheduleNextSpawn();
  }, [clearAllIntervals, scheduleNextSpawn, endGame]);

  // ─── Reset Game ──────────────────────────────────────────────────────────────

  const resetGame = useCallback(() => {
    clearAllIntervals();
    elapsedSecondsRef.current = 0;
    totalScoreRef.current = 0;
    activeIngredientsRef.current = [];
    plateIngredientsRef.current = [];
    laneCountsRef.current = new Array(NUM_LANES).fill(0);
    laneBlockCountdownRef.current = new Array(NUM_LANES).fill(0);
    isMealCompletingRef.current = false;

    getHighScore(GAME_ID).then((hs) => {
      setState({
        ...initialState,
        highScore: hs,
      });
    });
  }, [clearAllIntervals]);

  // ─── Catch Ingredient ────────────────────────────────────────────────────────

  const playCatchIngredientSound = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/pop.mp3'), { shouldPlay: true }
      );
  
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (_) {}
  }, []);

  const catchIngredient = useCallback((id: string) => {
    const active = activeIngredientsRef.current;
    const target = active.find((i) => i.id === id);
    if (!target) return;

    // Don't catch if plate is already full or meal is completing
    if (plateIngredientsRef.current.length >= PLATE_CAPACITY || isMealCompletingRef.current) return;

    // Remove from active, free lane
    activeIngredientsRef.current = active.filter((i) => i.id !== id);
    laneCountsRef.current[target.laneIndex] = Math.max(0, laneCountsRef.current[target.laneIndex] - 1);

    // Add to plate
    playCatchIngredientSound();
    const newPlate = [...plateIngredientsRef.current, target.ingredient];
    plateIngredientsRef.current = newPlate;

    // Check for meal completion — clear plate immediately, show score popup briefly
    if (newPlate.length === PLATE_CAPACITY) {
      completeMeal(newPlate);
    } else {
      setState((prev) => ({
        ...prev,
        activeIngredients: activeIngredientsRef.current,
        plateIngredients: newPlate,
      }));
    }
  }, []);

  // ─── Complete Meal ───────────────────────────────────────────────────────────

  const playMealCompleteSound = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/meal-complete.mp3'), { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (_) {}
  }, []);

  const completeMeal = useCallback((plate: IngredientDefinition[]) => {
    playMealCompleteSound();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const categories = plate.map((i) => i.category);
    const mealScore = calculateMealScore(categories);

    totalScoreRef.current += mealScore;
    if (totalScoreRef.current < 0) totalScoreRef.current = 0;

    // Clear plate immediately — plate is ready for new ingredients right away
    plateIngredientsRef.current = [];
    isMealCompletingRef.current = false;

    setState((prev) => ({
      ...prev,
      activeIngredients: activeIngredientsRef.current,
      totalScore: totalScoreRef.current,
      plateIngredients: [],
      lastMealScore: mealScore,
      showMealScore: true,
    }));

    // Hide score popup after 1s (plate is already accepting ingredients)
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        showMealScore: false,
        lastMealScore: null,
      }));
    }, 1000);
  }, []);

  // ─── Despawn Ingredient ──────────────────────────────────────────────────────

  const despawnIngredient = useCallback((id: string) => {
    const active = activeIngredientsRef.current;
    const target = active.find((i) => i.id === id);
    if (!target) return;

    activeIngredientsRef.current = active.filter((i) => i.id !== id);
    laneCountsRef.current[target.laneIndex] = Math.max(0, laneCountsRef.current[target.laneIndex] - 1);

    setState((prev) => ({
      ...prev,
      activeIngredients: activeIngredientsRef.current,
    }));
  }, []);

  return {
    ...state,
    startGame,
    resetGame,
    catchIngredient,
    despawnIngredient,
  };
}
