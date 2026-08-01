import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import Colors from '../constants/colors';
import { tokenCache } from '../utils/cache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

export default function RootLayout() {
  if (!publishableKey) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: Colors.error, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
          Missing Clerk Publishable Key
        </Text>
        <Text style={{ color: Colors.textSecondary, textAlign: 'center', fontSize: 14 }}>
          Please restart the Expo server with clean cache to load your .env file:
        </Text>
        <Text style={{ color: Colors.success, marginTop: 12, fontFamily: 'monospace' }}>
          npx expo start -c
        </Text>
      </View>
    );
  }


  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="generate-plan" options={{ headerShown: false }} />
        <Stack.Screen name="log-exercise" options={{ headerShown: false }} />
        <Stack.Screen name="exercise-details" options={{ headerShown: false }} />
        <Stack.Screen name="workout-burn" options={{ headerShown: false }} />
        <Stack.Screen name="manual-calories" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <ClerkLoaded>
        <StatusBar style="light" />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
