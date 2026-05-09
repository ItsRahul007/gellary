import { Stack } from 'expo-router';

export default function ViewerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: true }} />
  );
}
