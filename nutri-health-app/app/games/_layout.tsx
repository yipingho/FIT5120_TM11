import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Games' }} />
      <Stack.Screen name="meal-catcher/index" options={{ title: 'Meal Catcher', animation: 'slide_from_right' }} />
    </Stack>
  );
}
