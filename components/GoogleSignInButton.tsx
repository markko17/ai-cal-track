import { useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { saveUserToFirestore } from '../services/userService';
import { saveUserSession } from '../utils/cache';

// Complete auth session if returning from web browser redirect
WebBrowser.maybeCompleteAuthSession();

export function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

interface GoogleSignInButtonProps {
  onError?: (msg: string) => void;
  text?: string;
}

export default function GoogleSignInButton({ onError, text = 'Continue with Google' }: GoogleSignInButtonProps) {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      const redirectUrl = Linking.createURL('/(auth)/sign-in', { scheme: 'ai-cal-track' });

      const { createdSessionId, setActive, signUp, signIn } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        const email = signUp?.emailAddress || signIn?.identifier || '';
        const firstName = signUp?.firstName || '';
        const lastName = signUp?.lastName || '';
        // Use stable Clerk user id (not session id) for Firestore document key
        const clerkUserId = signUp?.createdUserId || (signIn as any)?.createdUserId || '';

        await saveUserSession({
          sessionId: createdSessionId,
          authProvider: 'google',
          signedInAt: new Date().toISOString(),
        });

        if (clerkUserId) {
          await saveUserToFirestore({
            uid: clerkUserId,
            email,
            firstName,
            lastName,
            authProvider: 'google',
          });
        }

        router.replace('/');
      } else {
        const msg = 'Google sign-in did not return a session. Please try again.';
        if (onError) onError(msg);
      }
    } catch (err: any) {
      console.error('Google OAuth Error:', err);
      const errorMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to sign in with Google';
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow, onError, router]);

  return (
    <TouchableOpacity
      style={styles.googleBtn}
      onPress={handleGoogleSignIn}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#10B981" size="small" />
      ) : (
        <View style={styles.btnContent}>
          <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.icon} />
          <Text style={styles.googleBtnText}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  googleBtnText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
