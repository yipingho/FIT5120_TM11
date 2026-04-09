import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Games' }} />
      <Stack.Screen name="meal-maker/index" options={{ title: 'Meal Maker', animation: 'slide_from_right' }} />
    </Stack>
  );
}
