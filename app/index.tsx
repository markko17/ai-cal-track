import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/colors';
import {
  getUserFromFirestore,
  getUserOnboardingFromStorage,
  saveUserOnboardingToStorage,
  saveUserToFirestore,
} from '../services/userService';
import { clearUserSession, saveUserSession } from '../utils/cache';

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
        await saveUserToFirestore({
          uid: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Fitness Enthusiast',
          imageUrl: user.imageUrl || '',
          authProvider: 'clerk',
        });
        if (isMounted) setSyncStatus('success');
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
        const dbUser = await getUserFromFirestore(user.id);
        if (dbUser?.onboardingCompleted || dbUser?.gender) {
          // Cache to local storage for future fast loads
          await saveUserOnboardingToStorage(user.id, dbUser);
          if (isMounted) {
            setNeedsOnboarding(false);
            setCheckingOnboarding(false);
          }
          return;
        }

        // User does not have onboarding information in database or storage -> redirect to step form
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

  const handleSignOut = async () => {
    await clearUserSession();
    await signOut();
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress || 'User';
  const userFullName = user?.fullName || user?.firstName || 'Fitness Enthusiast';
  const userAvatar = user?.imageUrl;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <View style={styles.userInfoRow}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={20} color={Colors.primary} />
              </View>
            )}
            <View style={styles.userTextCol}>
              <Text style={styles.welcomeText}>Welcome back 👋</Text>
              <Text style={styles.userName}>{userFullName}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Firestore Saved Status Card */}
        <View style={styles.statusBadgeCard}>
          {syncStatus === 'error' ? (
            <Ionicons name="cloud-offline-outline" size={20} color={Colors.error} style={{ marginRight: 10 }} />
          ) : (
            <Ionicons name="cloud-done-outline" size={20} color={syncStatus === 'success' ? Colors.primary : Colors.textMuted} style={{ marginRight: 10 }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, syncStatus === 'error' && { color: Colors.error }]}>
              {syncStatus === 'error' ? 'Sync Failed' : syncStatus === 'success' ? 'Firestore Profile Active' : 'Syncing Profile…'}
            </Text>
            <Text style={styles.statusSub}>
              {syncStatus === 'error' ? 'Could not save profile to Firebase' : `${userEmail} synced to Firebase`}
            </Text>
          </View>
        </View>

        {/* Dashboard Daily Summary Card */}
        <View style={styles.dashboardCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardHeaderTitle}>Daily Calorie Budget</Text>
              <Text style={styles.cardHeaderSub}>Goal: 2,000 kcal</Text>
            </View>
            <View style={styles.aiSparklePill}>
              <Ionicons name="sparkles" size={14} color={Colors.primary} />
              <Text style={styles.aiSparkleText}>AI Smart Plan</Text>
            </View>
          </View>

          {/* Empty state — real data will come from meal tracking */}
          <View style={styles.calorieStatRow}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>—</Text>
              <Text style={styles.statLabel}>Consumed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statNumber, { color: Colors.primary }]}>—</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>—</Text>
              <Text style={styles.statLabel}>Burned</Text>
            </View>
          </View>

          {/* Macro Bars */}
          <View style={styles.macroSection}>
            <Text style={styles.macroTitle}>Macros Breakdown</Text>
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Ionicons name="restaurant-outline" size={32} color={Colors.textMuted} />
              <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                {'No meals logged yet.\nSnap a meal to start tracking!'}
              </Text>
            </View>
          </View>
        </View>

        {/* AI Snap Meal Action Button — coming soon */}
        <TouchableOpacity style={[styles.aiSnapBtn, { opacity: 0.6 }]} disabled activeOpacity={1}>
          <Ionicons name="camera-outline" size={24} color={Colors.textOnPrimary} style={{ marginRight: 10 }} />
          <Text style={styles.aiSnapBtnText}>Snap & Track Meal (Coming Soon)</Text>
        </TouchableOpacity>

        {/* Quick Auth Info Summary */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Account Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>User ID:</Text>
            <Text style={styles.infoVal} numberOfLines={1}>{user.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Email:</Text>
            <Text style={styles.infoVal}>{userEmail}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Created At:</Text>
            <Text style={styles.infoVal}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userTextCol: {
    justifyContent: 'center',
  },
  welcomeText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  userName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  signOutBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  statusTitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  statusSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  dashboardCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardHeaderTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardHeaderSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  aiSparklePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  aiSparkleText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  calorieStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  statCol: {
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.cardBorder,
  },
  macroSection: {
    marginTop: 4,
  },
  macroTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
  },
  macroRow: {
    marginBottom: 12,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  macroValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  aiSnapBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  aiSnapBtnText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  infoKey: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  infoVal: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 220,
  },
});
