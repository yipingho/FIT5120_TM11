Below is a list of issues/changes to be done on the meal maker game:
- Update ingredient spawning logic: when a lane is selected to spawn an ingredient, it should be blocked from spawning the next N ingredients (configurable in GameConfig.ts).
- Add background music `@nutri-health-app/assets/audio/menu-audio.mp3` to the Meal Maker main menu screen on a loop, start playing whenever the player navigates to this menu page.
- When game starts, stop the menu music and start `@nutri-health-app/assets/audio/round-audio.mp3` once.
- If the player navigates out of a round, stop the round music.
- Ingredients currently fall behind the bottom bar and plate, the ingredients should be above the plate.
- The plate should be cleared instantly when it is full, only the points message should be displayed for a short period e.g. 1s.
- The calculation of whether an ingredient is on the plate is currently a little inaccurate.
- If the user starts to drag an ingredient and releases it outside of the plate, it should shrink and despawn instead of returning to its fall.
