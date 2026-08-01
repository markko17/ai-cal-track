import Colors from '@/constants/colors';
import { getUserFromFirestore, getUserOnboardingFromStorage } from '@/services/userService';
import { clearUserSession } from '@/utils/cache';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileTabScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      async function fetchProfile() {
        if (!user?.id) return;
        try {
          const local = await getUserOnboardingFromStorage(user.id);
          if (local && isMounted) {
            setProfileData(local);
            return;
          }
          const dbRes = await getUserFromFirestore(user.id);
          if (dbRes.exists && dbRes.data && isMounted) {
            setProfileData(dbRes.data);
          }
        } catch (err) {
          console.error('Error reading profile info:', err);
        }
      }
      fetchProfile();
      return () => {
        isMounted = false;
      };
    }, [user?.id])
  );

  const handleSignOut = async () => {
    try {
      await clearUserSession();
      await signOut();
    } catch (err: any) {
      console.error('Error during sign out:', err);
      Alert.alert(
        'Sign Out Notice',
        err?.message || 'Could not complete remote sign out, but local session was cleared.'
      );
    } finally {
      router.replace('/(auth)/sign-in');
    }
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress || 'User';
  const userFullName = user?.fullName || user?.firstName || 'Fitness Enthusiast';
  const userAvatar = user?.imageUrl;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Profile Card */}
        <View style={styles.profileHeaderCard}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarLarge} />
          ) : (
            <View style={styles.avatarFallbackLarge}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
          )}

          <Text style={styles.userNameText}>{userFullName}</Text>
          <Text style={styles.userEmailText}>{userEmail}</Text>

          <View style={styles.memberPill}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.memberPillText}>Clerk Authenticated</Text>
          </View>
        </View>

        {/* Biometric & Fitness Goal Profile */}
        <Text style={styles.sectionTitle}>Biometric & Fitness Profile</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Goal</Text>
            <Text style={[styles.infoVal, { color: Colors.primary }]}>{profileData?.goal || 'Maintain Weight'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height</Text>
            <Text style={styles.infoVal}>{profileData?.height || "5'9\""}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Weight</Text>
            <Text style={styles.infoVal}>{profileData?.weight || '75 kg'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Workout Frequency</Text>
            <Text style={styles.infoVal}>{profileData?.workoutDays || '3-4 days/week'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Calculated BMI</Text>
            <Text style={styles.infoVal}>{profileData?.bmi ? `${profileData.bmi} (${profileData.bmiCategory})` : '23.0 (Normal)'}</Text>
          </View>
        </View>

        {/* Re-Run AI Plan Action */}
        <TouchableOpacity
          style={styles.rerunPlanBtn}
          onPress={() => router.push('/onboarding' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.rerunPlanBtnText}>Update Profile & Re-Generate AI Plan</Text>
        </TouchableOpacity>

        {/* Account ID Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={[styles.infoVal, { maxWidth: 200 }]} numberOfLines={1}>
              {user?.id || '—'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cloud Database</Text>
            <Text style={styles.infoVal}>Firebase Firestore</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.signOutBtnText}>Sign Out of Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
  },
  profileHeaderCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary,
    marginBottom: 12,
  },
  avatarFallbackLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',

    alignItems: 'center',
    marginBottom: 12,
  },
  userNameText: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  userEmailText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginTop: 12,
  },
  memberPillText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  infoVal: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  rerunPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    height: 50,
    borderRadius: 16,
    marginBottom: 20,
  },
  rerunPlanBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    height: 52,
    borderRadius: 18,
    marginTop: 8,
  },
  signOutBtnText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
});
