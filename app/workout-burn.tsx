import Colors from '@/constants/colors';
import { addLogEntryToFirestore, formatDateKey } from '@/services/dailyLogService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WorkoutBurnScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams<{
    calories?: string;
    title?: string;
    duration?: string;
    intensity?: string;
    workoutId?: string;
  }>();
  const [isSaving, setIsSaving] = useState(false);

  const calories = useMemo(() => Math.max(0, Math.round(Number(params.calories) || 0)), [params.calories]);
  const title = params.title || 'Workout';
  const duration = Number(params.duration) || 0;
  const intensity = params.intensity || 'medium';

  const handleLog = async () => {
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please sign in to log your workout.');
      return;
    }

    setIsSaving(true);
    try {
      await addLogEntryToFirestore(user.id, formatDateKey(new Date()), {
        type: 'workout',
        title: `${title} (${duration}m, ${intensity.charAt(0).toUpperCase()}${intensity.slice(1)})`,
        calories,
        exerciseType: params.workoutId || 'workout',
        intensity: intensity === 'low' || intensity === 'high' ? intensity : 'medium',
        durationMinutes: duration,
      });
      router.dismissAll();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Could Not Save Workout', error?.message || 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.fireCircle}>
          <Ionicons name="flame" size={82} color="#F97316" />
        </View>
        <Text style={styles.title}>Your Workout Burned</Text>
        <Text style={styles.calories}>{calories.toLocaleString()} <Text style={styles.unit}>Cals</Text></Text>
        <Text style={styles.detail}>{title} · {duration} min · {intensity} intensity</Text>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.logButton, isSaving && styles.disabled]} onPress={handleLog} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.logText}>Log</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backButton: { width: 44, height: 44, marginLeft: 16, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  fireCircle: { width: 164, height: 164, borderRadius: 82, backgroundColor: '#FFF3E8', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { color: Colors.text, fontSize: 25, fontWeight: '800', textAlign: 'center' },
  calories: { color: Colors.text, fontSize: 52, fontWeight: '800', marginTop: 12, letterSpacing: -1 },
  unit: { fontSize: 22, color: Colors.textMuted, letterSpacing: 0 },
  detail: { color: Colors.textMuted, fontSize: 15, marginTop: 18, textAlign: 'center', textTransform: 'capitalize' },
  bottomBar: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.cardBorder, backgroundColor: Colors.surface },
  logButton: { height: 56, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.65 },
  logText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
