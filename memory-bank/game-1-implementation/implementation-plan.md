# Game 1 Implementation Plan: "Meal Maker"

## Overview

A falling-ingredients game where children drag ingredients to a plate to form meals. Built using the existing React Native stack (`react-native-reanimated` + `react-native-gesture-handler`) — no additional game engine library required.

## Key Design Decisions

### Ingredient Spawning with Lane System
The screen is divided into vertical lanes (NUM_LANES = 6). There should be a maximum number of ingredients that can occupy a lane at a time. When a new ingredient spawns, it picks a random lane. The speed at which the ingredients fall should be variable: starts slow and then speeds up every X seconds. The rate at which new ingredients spawn should also be variable: starting low then increasing. These two variables ensures ingredients are always draggable without overlap.

### Drag Mechanic
`PanGestureHandler` from `react-native-gesture-handler`. The ingredient follows the user's finger. On release within the plate zone (bottom center), it is caught. On release elsewhere, it snaps back to its falling position and continues falling.

### Scoring
All possible 3-ingredient combinations (order-independent) from 5 categories are explicitly scored. Categories: `vegetable (V)`, `carbohydrate (C)`, `protein (P)`, `junk (J)`, `candy (K)`.

### Score Storage
No backend — scores stored locally using `@react-native-async-storage/async-storage` (already installed).

---

## Directory Structure

```
nutri-health-app/app/games/
  _layout.tsx                          ← Stack layout (headerShown: false)
  index.tsx                            ← Games hub (grid of game tiles)
  meal-maker/
    index.tsx                          ← Game screen assembly

nutri-health-app/components/games/
  meal-maker/
    FallingIngredient.tsx
    Plate.tsx
    ScoreDisplay.tsx
    MealScorePopup.tsx
    GameOverOverlay.tsx

nutri-health-app/constants/
  GameConfig.ts                        ← Scoring rules, timing, ingredient definitions

nutri-health-app/services/
  gameStorage.ts                       ← AsyncStorage read/write for scores

nutri-health-app/hooks/games/
  useGameEngine.ts                     ← Custom hook for all game state & logic
```

---

## Sub-Agent Tasks

---

### Task 1: Project Setup & Navigation

**Files to create/modify:**
- `nutri-health-app/app/games/_layout.tsx` — Stack layout, headerShown: false
- `nutri-health-app/app/games/index.tsx` — Games hub screen (grid of game tiles)
- `nutri-health-app/app/games/meal-maker/index.tsx` — Game screen scaffold
- `nutri-health-app/app/_layout.tsx` — Add `games` Drawer.Screen with label "Games"

**Games hub UI:**
- Header: "Games" in displayMedium typography
- 2-column FlatList grid of game tiles
- "Meal Maker" tile: shows name, emoji 🍽️, and high score from AsyncStorage
- "Coming Soon" placeholder tile (greyed out)
- Styled with existing design system (Colors, Typography, Radius, Spacing)

---

### Task 2: Game Configuration & Scoring System

**File:** `nutri-health-app/constants/GameConfig.ts`

**Timing & Layout Config:**
```ts
ROUND_DURATION_SECONDS = 60
NUM_LANES = 5
SPAWN_INTERVAL_MS = 1500 // Variable
FALL_DURATION_MS_MIN = 3000 // Variable
FALL_DURATION_MS_MAX = 5000 // Variable
MAX_ACTIVE_INGREDIENTS = 10
PLATE_CAPACITY = 3
```

**Ingredient Definitions (emoji placeholders):**
```
Vegetables:     broccoli 🥦, carrot 🥕, tomato 🍅, corn 🌽, pea 🫛
Carbohydrates:  rice 🍚, bread 🍞, pasta 🍝, potato 🥔, noodles 🍜
Proteins:       chicken 🍗, egg 🥚, fish 🐟, tofu 🫘, beef 🥩
Junk:           burger 🍔, fries 🍟, pizza 🍕, hotdog 🌭, nuggets 🍿
Candy:          candy 🍬, lollipop 🍭, cake 🎂, donut 🍩, ice cream 🍦
```

**Complete Scoring Matrix (all 35 combinations):**
```
VVV = 8    VVC = 8    VVP = 8    VVJ = 4    VVK = 4
VCC = 6    VCP = 10   VCJ = 4    VCK = 4    VPP = 7
VPJ = 4    VPK = 4    VJJ = 2    VJK = 2    VKK = 2
CCC = 5    CCP = 6    CCJ = 3    CCK = 3    CPP = 6
CPJ = 3    CPK = 3    CJJ = 1    CJK = 1    CKK = 1
PPP = 7    PPJ = 3    PPK = 3    PJJ = 1    PJK = 1
PKK = 1    JJJ = 0    JJK = 0    JKK = 0    KKK = 0
```

**Scoring function:**
```ts
calculateMealScore(categories: IngredientCategory[]): number
// Sorts categories alphabetically, looks up in table, falls back to 0
```

---

### Task 3: Game Storage Service

**File:** `nutri-health-app/services/gameStorage.ts`

**Functions:**
- `getHighScore(gameId: string): Promise<number>`
- `saveHighScore(gameId: string, score: number): Promise<void>` — only saves if new score > existing
- `getRecentScores(gameId: string, limit?: number): Promise<number[]>` — last N scores (default 10)
- `saveRecentScore(gameId: string, score: number): Promise<void>` — appends to list, keeps last 10

Uses `@react-native-async-storage/async-storage` (already installed).

---

### Task 4: Game Engine Hook (State & Logic)

**File:** `nutri-health-app/hooks/games/useGameEngine.ts`

A custom React hook managing all game state and logic.

**State shape:**
```ts
{
  gamePhase: 'idle' | 'playing' | 'game_over',
  timeRemaining: number,
  totalScore: number,
  activeIngredients: ActiveIngredient[],  // { id, ingredient, laneIndex, spawnTime }
  plateIngredients: Ingredient[],          // up to 3
  lastMealScore: number | null,
  showMealScore: boolean,
  occupiedLanes: Set<number>,
}
```

**Exposed functions:**
- `startGame()` — resets state, starts timer interval, starts spawn interval
- `endGame()` — clears intervals, sets phase to game_over, saves score via gameStorage
- `catchIngredient(id: string)` — moves ingredient from activeIngredients to plateIngredients, frees lane
- `despawnIngredient(id: string)` — removes from activeIngredients, frees lane
- `completeMeal()` — called when plateIngredients.length === 3, calculates score, shows popup, clears plate after 1.5s
- `resetGame()` — resets to idle state (for Play Again)

**Logic:**
- Timer: `setInterval` every 1000ms, decrements timeRemaining, calls endGame() at 0
- Spawner: `setInterval` every SPAWN_INTERVAL_MS, picks random unoccupied lane, picks random ingredient, adds to activeIngredients
- Lane management: tracks which lanes are occupied, prevents double-spawning in same lane

---

### Task 5: Falling Ingredient Component

**File:** `nutri-health-app/components/games/meal-maker/FallingIngredient.tsx`

**Props:**
```ts
{
  ingredient: Ingredient,
  laneIndex: number,
  fallDuration: number,
  plateZone: { x: number, y: number, width: number, height: number },
  onCatch: (id: string) => void,
  onDespawn: (id: string) => void,
}
```

**Implementation:**
- `useAnimatedStyle` + `withTiming` for fall animation (translateY: -100 → screenHeight + 100)
- `withRepeat(withTiming(...))` for continuous spin animation on `rotate` transform (random direction)
- `PanGestureHandler` wrapping the ingredient view
- On drag: ingredient follows finger (translateX/Y offset from fall position)
- On release: check if finger position is within plate zone
  - If yes: call `onCatch(id)`, ingredient animates to plate center
  - If no: snap back to fall trajectory with `withSpring`, continue falling
- On fall animation complete: call `onDespawn(id)`

**Visual:**
- 70x70 rounded square, category color background, emoji centered (fontSize 36)
- `Radius.lg` corners, subtle shadow

**Lane X positioning:**
```ts
x = (laneIndex + 0.5) * (screenWidth / NUM_LANES) - 35  // centered in lane, offset by half width
```

---

### Task 6: Plate Component

**File:** `nutri-health-app/components/games/meal-maker/Plate.tsx`

**Props:**
```ts
{
  plateIngredients: Ingredient[],
  onLayout: (zone: { x: number, y: number, width: number, height: number }) => void,
}
```

**UI:**
- Large circle (180px diameter), `surface_container_lowest` background, subtle shadow
- 3 ingredient slots arranged in a triangle pattern inside the plate
- Caught ingredients appear with a small bounce animation (`withSpring`)
- Empty slots shown as dashed circles (outline_variant color)
- `onLayout` callback exposes the plate's screen coordinates for catch detection

---

### Task 7: Score Display (HUD)

**File:** `nutri-health-app/components/games/meal-maker/ScoreDisplay.tsx`

**Props:** `score: number`, `timeRemaining: number`

**UI:**
- Positioned at top of screen (inside SafeAreaView)
- Left: "⏱ 0:45" timer in `headlineMedium`, color changes to `tertiary` when < 10s remaining
- Right: "⭐ 85" score in `headlineMedium`
- Background: `surface_container` with `Radius.lg` bottom corners
- Padding: `Spacing.md` horizontal, `Spacing.sm` vertical

---

### Task 8: Meal Score Popup Component

**File:** `nutri-health-app/components/games/meal-maker/MealScorePopup.tsx`

**Props:** `score: number`, `visible: boolean`

**UI:**
- Positioned above the plate
- "+10 pts!" in `displaySmall`, `primary` color
- Animated: fade in (200ms) → hold (1000ms) → float up + fade out (500ms)
- Uses `react-native-reanimated` `withSequence` + `withTiming`

---

### Task 9: Game Over Overlay Component

**File:** `nutri-health-app/components/games/meal-maker/GameOverOverlay.tsx`

**Props:**
```ts
{
  score: number,
  highScore: number,
  isNewHighScore: boolean,
  onPlayAgain: () => void,
  onBack: () => void,
}
```

**UI:**
- Full-screen overlay: `surface` at 85% opacity
- Centered card: `surface_container_lowest`, `Radius.modal` corners, `Spacing.xl` padding
- "Time's Up! ⏰" in `displaySmall`
- "Your Score: 85" in `headlineLarge`, `primary` color
- "Best: 120" in `titleLarge`, `on_surface_variant` color
- If new high score: "🎉 New High Score!" in `headlineMedium`, `secondary` color with pulse animation
- "Play Again" primary button (gradient, full rounded)
- "Back to Games" secondary button

---

### Task 10: Game Screen Assembly

**File:** `nutri-health-app/app/games/meal-maker/index.tsx`

**Assembles all components:**
- `useGameEngine` hook for all state
- `SafeAreaView` as root container, `surface` background
- `ScoreDisplay` at top
- Game field `View` filling remaining space
- `FallingIngredient` for each item in `activeIngredients`
- `Plate` at bottom center (absolute positioned)
- `MealScorePopup` above plate when `showMealScore` is true
- `GameOverOverlay` when `gamePhase === 'game_over'`
- "Start Game" button centered when `gamePhase === 'idle'`

**Plate zone detection:**
- Plate's `onLayout` callback stores the plate's screen coordinates
- Passed to each `FallingIngredient` as `plateZone` prop

---

### Task 11: Integration, Polish & Memory Bank Update

**Steps:**
- Verify drawer navigation to Games works end-to-end
- Test lane system prevents ingredient overlap
- Test drag-to-catch with plate zone detection
- Test all scoring combinations
- Test timer countdown and game over flow
- Test high score persistence across app restarts
- Ensure design system compliance (Colors, Typography, Radius, Spacing)
- Update `memory-bank/game-1-implementation/implementation-plan.md` with any deviations

---

## Parallelization Notes

- Tasks 1, 2, 3 can be executed in parallel (setup, config, storage — no dependencies between them)
- Tasks 4-9 can begin after Task 2 (depend on GameConfig types)
- Task 10 requires Tasks 4-9 to be complete
- Task 11 requires Task 10 to be complete

---

## Technology Stack

| Concern | Library |
|---|---|
| Animation | react-native-reanimated ~4.1.1 |
| Gestures | react-native-gesture-handler ~2.28.0 |
| Score storage | @react-native-async-storage/async-storage 2.2.0 |
| Navigation | expo-router ~6.0.23 (Drawer + Stack) |
| UI | React Native + existing design system |

All libraries are already installed — no new dependencies required.
