/**
 * useGameEngine — Custom hook for "Meal Catcher" game state & logic
 *
 * Manages: game phase, timer, ingredient spawning, plate state,
 * meal completion, scoring, and difficulty progression.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ROUND_DURATION_SECONDS,
  NUM_LANES,
  MAX_INGREDIENTS_PER_LANE,
  MAX_ACTIVE_INGREDIENTS,
  PLATE_CAPACITY,
  SPAWN_INTERVAL_INITIAL_MS,
  IngredientDefinition,
  getRandomIngredient,
  calculateMealScore,
  getCurrentFallDuration,
  getCurrentSpawnInterval,
} from '../../constants/GameConfig';
import { saveGameScore, getHighScore } from '../../services/gameStorage';

export const GAME_ID = 'meal-catcher';

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

  // Lane occupancy: laneIndex → count of ingredients in that lane
  const laneCountsRef = useRef<number[]>(new Array(NUM_LANES).fill(0));

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

      // Find available lanes (lanes with fewer than MAX_INGREDIENTS_PER_LANE)
      const laneCounts = laneCountsRef.current;
      const availableLanes = laneCounts
        .map((count, idx) => ({ count, idx }))
        .filter(({ count }) => count < MAX_INGREDIENTS_PER_LANE)
        .map(({ idx }) => idx);

      if (availableLanes.length === 0) {
        scheduleNextSpawn();
        return;
      }

      // Pick a random available lane
      const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];

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
    isMealCompletingRef.current = false;

    getHighScore(GAME_ID).then((hs) => {
      setState({
        ...initialState,
        highScore: hs,
      });
    });
  }, [clearAllIntervals]);

  // ─── Catch Ingredient ────────────────────────────────────────────────────────

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
    const newPlate = [...plateIngredientsRef.current, target.ingredient];
    plateIngredientsRef.current = newPlate;

    setState((prev) => ({
      ...prev,
      activeIngredients: activeIngredientsRef.current,
      plateIngredients: newPlate,
    }));

    // Check for meal completion
    if (newPlate.length === PLATE_CAPACITY) {
      completeMeal(newPlate);
    }
  }, []);

  // ─── Complete Meal ───────────────────────────────────────────────────────────

  const completeMeal = useCallback((plate: IngredientDefinition[]) => {
    isMealCompletingRef.current = true;

    const categories = plate.map((i) => i.category);
    const mealScore = calculateMealScore(categories);

    totalScoreRef.current += mealScore;

    setState((prev) => ({
      ...prev,
      totalScore: totalScoreRef.current,
      lastMealScore: mealScore,
      showMealScore: true,
    }));

    // Clear plate after 1.5s
    setTimeout(() => {
      plateIngredientsRef.current = [];
      isMealCompletingRef.current = false;
      setState((prev) => ({
        ...prev,
        plateIngredients: [],
        showMealScore: false,
        lastMealScore: null,
      }));
    }, 1500);
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
