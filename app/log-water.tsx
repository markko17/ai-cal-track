import Colors from '@/constants/colors';
import { addWaterLogToFirestore, formatDateKey } from '@/services/dailyLogService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const EMPTY_GLASS = require('@/assets/images/empty_glass.png');
const HALF_GLASS = require('@/assets/images/half_glass.png');
const FULL_GLASS = require('@/assets/images/full_glass.png');

export default function LogWaterScreen() {
  const router = useRouter();
  const { user } = useUser();

  // Each step represents half a glass (125 ml). Range: 0 to 8 half glasses (0 ml to 1000 ml / 4 full glasses)
  const [halfGlassesCount, setHalfGlassesCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ML_PER_HALF_GLASS = 125;
  const MAX_HALF_GLASSES = 8; // Max 4 full glasses

  const totalMl = halfGlassesCount * ML_PER_HALF_GLASS;

  const handleIncrement = () => {
    if (halfGlassesCount < MAX_HALF_GLASSES) {
      setHalfGlassesCount((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (halfGlassesCount > 0) {
      setHalfGlassesCount((prev) => prev - 1);
    }
  };

  const handleLogWater = async () => {
    if (halfGlassesCount === 0) {
      Alert.alert('Select Water Intake', 'Please add at least half a glass of water before logging.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    try {
      setIsSubmitting(true);
      const totalLiters = Number((totalMl / 1000).toFixed(3));
      const todayStr = formatDateKey(new Date());

      await addWaterLogToFirestore(user.id, todayStr, totalLiters);
      router.back();
    } catch (error) {
      console.error('Error logging water intake:', error);
      Alert.alert('Error', 'Failed to save water log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Determine array of glass image sources based on halfGlassesCount:
   * 0 -> [EMPTY_GLASS]
   * 1 -> [HALF_GLASS]
   * 2 -> [FULL_GLASS]
   * 3 -> [FULL_GLASS, HALF_GLASS]
   * 4 -> [FULL_GLASS, FULL_GLASS]
   * 5 -> [FULL_GLASS, FULL_GLASS, HALF_GLASS]
   * 6 -> [FULL_GLASS, FULL_GLASS, FULL_GLASS]
   * 7 -> [FULL_GLASS, FULL_GLASS, FULL_GLASS, HALF_GLASS]
   * 8 -> [FULL_GLASS, FULL_GLASS, FULL_GLASS, FULL_GLASS]
   */
  const renderGlassImages = () => {
    if (halfGlassesCount === 0) {
      return (
        <View style={styles.singleGlassContainer}>
          <Image source={EMPTY_GLASS} style={styles.bigGlassImage} resizeMode="contain" />
        </View>
      );
    }

    const fullGlasses = Math.floor(halfGlassesCount / 2);
    const hasHalfGlass = halfGlassesCount % 2 === 1;

    const items: { id: string; source: any }[] = [];
    for (let i = 0; i < fullGlasses; i++) {
      items.push({ id: `full-${i}`, source: FULL_GLASS });
    }
    if (hasHalfGlass) {
      items.push({ id: 'half', source: HALF_GLASS });
    }

    const isMultiGlass = items.length > 1;

    return (
      <View style={[styles.glassesRow, isMultiGlass && styles.multiGlassesRow]}>
        {items.map((item) => (
          <Image
            key={item.id}
            source={item.source}
            style={isMultiGlass ? styles.mediumGlassImage : styles.bigGlassImage}
            resizeMode="contain"
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Back Button */}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Heading */}
        <Text style={styles.screenTitle}>Add Water Intake</Text>
        <Text style={styles.subTitle}>
          Tap + or - to adjust your water intake in half-glass increments.
        </Text>

        {/* Display Area with Glass Images */}
        <View style={styles.displayCard}>
          {renderGlassImages()}
        </View>

        {/* Counter Controls: - button, total ml display, + button */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.counterBtn, halfGlassesCount === 0 && styles.disabledBtn]}
            onPress={handleDecrement}
            disabled={halfGlassesCount === 0}
            activeOpacity={0.75}
            accessibilityLabel="Decrease water intake"
          >
            <Ionicons name="remove" size={28} color={halfGlassesCount === 0 ? Colors.textMuted : '#38BDF8'} />
          </TouchableOpacity>

          <View style={styles.volumeBox}>
            <Text style={styles.volumeNumber}>{totalMl}</Text>
            <Text style={styles.volumeUnit}>ml</Text>
          </View>

          <TouchableOpacity
            style={[styles.counterBtn, halfGlassesCount >= MAX_HALF_GLASSES && styles.disabledBtn]}
            onPress={handleIncrement}
            disabled={halfGlassesCount >= MAX_HALF_GLASSES}
            activeOpacity={0.75}
            accessibilityLabel="Increase water intake"
          >
            <Ionicons name="add" size={28} color={halfGlassesCount >= MAX_HALF_GLASSES ? Colors.textMuted : '#38BDF8'} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Log Water Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.logWaterBtn, isSubmitting && styles.logWaterBtnDisabled]}
          onPress={handleLogWater}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.textOnPrimary} size="small" />
          ) : (
            <>
              <Ionicons name="water" size={20} color={Colors.textOnPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.logWaterBtnText}>
                {halfGlassesCount === 0 ? 'Log Water' : `Log ${totalMl} ml Water`}
              </Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  displayCard: {
    width: '100%',
    height: 260,
    backgroundColor: Colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginBottom: 28,
  },
  singleGlassContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigGlassImage: {
    width: 140,
    height: 200,
  },
  glassesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  multiGlassesRow: {
    paddingHorizontal: 8,
  },
  mediumGlassImage: {
    width: 75,
    height: 110,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  counterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    opacity: 0.5,
  },
  volumeBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  volumeUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: -2,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  logWaterBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logWaterBtnDisabled: {
    opacity: 0.7,
  },
  logWaterBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textOnPrimary,
  },
});
