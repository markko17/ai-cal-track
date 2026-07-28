import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Colors from '../constants/colors';
import {
  getUserFromFirestore,
  getUserOnboardingFromStorage,
  saveUserOnboardingToStorage,
  saveUserToFirestore,
} from '../services/userService';
import { saveUserSession } from '../utils/cache';

export default function Index() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [syncStatus, setSyncStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Save session info, sync user data to Firestore, and verify onboarding completion
  useEffect(() => {
    let isMounted = true;

    async function checkUserAndOnboarding() {
      if (!isSignedIn || !user) {
        if (isMounted) setCheckingOnboarding(false);
        return;
      }

      // 1. Save session locally
      await saveUserSession({
        id: user.id,
        lastActive: new Date().toISOString(),
      });

      // 2. Save/Sync basic user profile to Firestore
      setSyncStatus('pending');
      try {
        const syncRes = await saveUserToFirestore({
          uid: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Fitness Enthusiast',
          imageUrl: user.imageUrl || '',
          authProvider: 'clerk',
        });
        if (isMounted && syncRes) setSyncStatus('success');
      } catch (e) {
        if (isMounted) setSyncStatus('error');
      }

      // 3. Check if user already completed onboarding locally or in database
      try {
        const localOnboarding = await getUserOnboardingFromStorage(user.id);
        if (localOnboarding?.onboardingCompleted || localOnboarding?.gender) {
          if (isMounted) {
            setNeedsOnboarding(false);
            setCheckingOnboarding(false);
          }
          return;
        }

        // Check Firestore database
        const dbResult = await getUserFromFirestore(user.id);
        if (dbResult.error) {
          console.error('Error fetching Firestore user profile:', dbResult.error);
          if (isMounted) setCheckingOnboarding(false);
          return;
        }

        const dbUser = dbResult.data;
        if (dbResult.exists && (dbUser?.onboardingCompleted || dbUser?.gender)) {
          // Cache to local storage for future fast loads
          await saveUserOnboardingToStorage(user.id, dbUser);
          if (isMounted) {
            setNeedsOnboarding(false);
            setCheckingOnboarding(false);
          }
          return;
        }

        // User explicitly does not have onboarding information in database or storage -> redirect to step form
        if (isMounted) {
          setNeedsOnboarding(true);
          setCheckingOnboarding(false);
        }
      } catch (err) {
        console.error('Error checking user onboarding:', err);
        if (isMounted) setCheckingOnboarding(false);
      }
    }


    checkUserAndOnboarding();

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, user]);

  if (!isLoaded || (isSignedIn && checkingOnboarding)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Initializing AI Calorie Tracker...</Text>
      </View>
    );
  }

  // Redirect to Sign In screen if user is not authenticated
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Redirect to Onboarding Step Form if user hasn't completed profile details
  if (needsOnboarding) {
    return <Redirect href={'/onboarding' as any} />;
  }

  // Once signed in and step form completed -> Navigate to Home screen of tab navigation
  return <Redirect href={'/(tabs)' as any} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
});

