import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GalleryProvider } from '@/context/GalleryContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GalleryProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="viewer" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="album" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </GalleryProvider>
    </GestureHandlerRootView>
  );
}
