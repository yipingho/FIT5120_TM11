# Game 1
This task is to implement a game suitable for children with the theme of healthy nutrition. Should be implemented using react-native-game-engine. There should be a 'games' section added to the app. This section should have a grid of tiles showing all the games (there will just be the one game we are developing in this task for now). There will be no saving of user data in the backend, any score data should be stored in local storage. There can potentially be a multiplayer mode for this game implemented in another task. More details will be explained below.

# Game Description
The basis of this game is there will be many different ingredients falling from the top of the screen, and the player needs to grab 3 ingredients to their 'plate' to form a meal. The ingredients are of the following categories: (vegetable, carbohydrate, protein, junk food, candy). The types of ingredients chosen will determine the score of the meal, example scoring system:
- 3 vegetables -> 8pts
- 2 vegetables + 1 carb -> 8pts
- 2 vegetables + 1 protein -> 8pts
- 2 vegetables + 1 junk/candy -> 4pts
- 1 vegetable + 1 carb + 1 protein -> 10pts
...

You can make this scoring system easily configurable in order to tweak the game balance later. The game will be time-based, e.g. 1 minute rounds where the player should try to form as many meals as they can -> score as high as they can.

The player's plate should be at the bottom center of the screen, ingredients should be medium-sized images falling from the top of the screen. Uncaught ingredients should just fall through the bottom of the screen and despawn. Ensure the falling ingredients have some random spin animation so that they look like they are falling. There should be a score counter at the top of the screen which shows the player's score for the current round. As the player drags the ingredients to their plate, the ingredient should stay on the plate until 3 ingredients are on the plate and the meal is considered complete. When a meal is completed, the score for the meal should be briefly shown on the plate and the ingredients cleared for the next meal. The score of that meal should be added to the total score for the round.

After 1 minute (or however long the round duration is), the game should stop and display an overlay with some game over information and navigation buttons to go back or play again.

The multiplayer version of this game would have 2 players competing against each other for the ingredients. Two score totals should be shown at the top of the screen (instead of one). The player who gets the higher score wins.

Game assets are not yet available, so use placeholders for now.
