import { WeightRuler } from '@/components/WeightRuler';
import Colors from '@/constants/colors';
import { getUserFromFirestore, updateUserWeight } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const MIN_WEIGHT = 30;
const MAX_WEIGHT = 250;

const clampWeight = (value: number): number =>
  Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Math.round(value * 10) / 10));

export default function UpdateWeightScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams<{ weight?: string }>();

  const [initialWeight, setInitialWeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const paramsWeight = parseFloat(params.weight || '');
    const fromParams = !isNaN(paramsWeight) ? clampWeight(paramsWeight) : null;

    const loadDefaultWeight = async () => {
      try {
        let value = fromParams;
        if (value == null) {
          const result = await getUserFromFirestore(user.id);
          const stored = parseFloat(result.data?.weight);
          value = !isNaN(stored) ? clampWeight(stored) : 70;
        }
        if (cancelled) return;
        setInitialWeight(value);
        setWeight(value.toFixed(1));
      } catch (error) {
        console.error('Error loading default weight:', error);
        if (cancelled) return;
        const fallback = fromParams ?? 70;
        setInitialWeight(fallback);
        setWeight(fallback.toFixed(1));
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    };

    loadDefaultWeight();
    return () => {
      cancelled = true;
    };
  }, [user?.id, params.weight]);

  const handleUpdateWeight = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    const weightKg = parseFloat(weight);
    if (isNaN(weightKg) || weightKg <= 0) {
      Alert.alert('Invalid Weight', 'Please select a valid weight.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserWeight(user.id, weightKg);
      router.back();
    } catch (error) {
      console.error('Error updating weight:', error);
      Alert.alert('Error', 'Failed to save weight. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.screenTitle}>Update Weight</Text>
        <Text style={styles.subTitle}>Slide the ruler to select your current weight.</Text>

        {isLoadingProfile || initialWeight == null ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.rulerCard}>
              <WeightRuler
                min={MIN_WEIGHT}
                max={MAX_WEIGHT}
                step={0.5}
                fractionDigits={1}
                initialValue={initialWeight}
                height={300}
                width={Dimensions.get('window').width - 40}
                indicatorHeight={90}
                indicatorColor={Colors.primary}
                shortStepHeight={18}
                longStepHeight={38}
                stepWidth={2}
                shortStepColor="#D1D5DB"
                longStepColor="#9CA3AF"
                onValueChange={(value: string) => setWeight(value)}
                onValueChangeEnd={(value: string) => setWeight(value)}
              />
            </View>

            <View style={styles.selectedBox}>
              <Text style={styles.selectedNum}>{parseFloat(weight).toFixed(1)}</Text>
              <Text style={styles.selectedUnit}>kg</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.updateBtn, isSubmitting && styles.updateBtnDisabled]}
          onPress={handleUpdateWeight}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.textOnPrimary} size="small" />
          ) : (
            <>
              <Ionicons name="scale" size={20} color={Colors.textOnPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.updateBtnText}>Update Weight</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  rulerCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    marginBottom: 24,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  selectedBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  selectedNum: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  selectedUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  updateBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  updateBtnDisabled: {
    opacity: 0.7,
  },
  updateBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textOnPrimary,
  },
});
