import Colors from '@/constants/colors';
import { getUserFromFirestore } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../config/firebaseConfig';
const WEEK_DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEK_DAY_DDD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_ICONS = ['flame', 'restaurant', 'barbell', 'water', 'walk', 'heart', 'trophy'] as const;

interface WeekStreakData {
  dayIndex: number;
  hasActivity: boolean;
}

export default function AnalyticsTabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [userWeight, setUserWeight] = useState<string>('--');
  const [weekStreak, setWeekStreak] = useState<WeekStreakData[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const userId = user?.id;
    const requestId = ++requestIdRef.current;

    if (!userId) {
      setUserWeight('--');
      setWeekStreak([]);
      setCurrentStreak(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchAnalyticsData(userId, requestId);

    return () => {
      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1;
      }
    };
  }, [user?.id]);

  const fetchAnalyticsData = async (userId: string, requestId: number) => {
    try {
      const userResult = await getUserFromFirestore(userId);
      if (requestId !== requestIdRef.current) return;
      if (userResult.exists && userResult.data?.weight) {
        setUserWeight(userResult.data.weight);
      }
      await fetchWeekStreak(userId, requestId);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error fetching analytics data:', error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const fetchWeekStreak = async (userId: string, requestId: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));
    startOfWeek.setHours(0, 0, 0, 0);

    const currentDayIndex = (today.getDay() + 6) % 7;
    const streakData: WeekStreakData[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dateStr = dateKey(dayDate);
      const hasActivity = await checkDayActivity(userId, dateStr);
      if (requestId !== requestIdRef.current) return;
      streakData.push({ dayIndex: i, hasActivity });
    }

    let streakCount = 0;
    const lastEligibleDay = streakData[currentDayIndex]?.hasActivity
      ? currentDayIndex
      : currentDayIndex - 1;
    for (let i = lastEligibleDay; i >= 0; i--) {
      if (streakData[i]?.hasActivity) {
        streakCount++;
      } else {
        break;
      }
    }

    if (requestId !== requestIdRef.current) return;
    setWeekStreak(streakData);
    setCurrentStreak(streakCount);
  };

  const checkDayActivity = async (userId: string, dateStr: string): Promise<boolean> => {
    const logRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
    const snapshot = await getDoc(logRef);
    if (!snapshot.exists()) return false;
    const data = snapshot.data();
    const entries = data?.entries || [];
    const hasWaterLog = (data?.consumedWaterLiters || 0) > 0;
    return entries.length > 0 || hasWaterLog;
  };

  const dateKey = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7;

  return (
    <LinearGradient
      colors={['#FFF7ED', '#FFFBEB', '#FDF2F8', '#FFFFFF']}
      locations={[0, 0.4, 0.7, 1]}
      style={styles.safe}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: 20 + insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Progress</Text>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Row: Streak + Weight */}
            <View style={styles.row}>
              {/* Streak Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  styles.streakCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => setIsStreakModalOpen(true)}
              >
                <View style={styles.streakHeader}>
                  <Image source={require('../../assets/images/fire.png')} style={styles.fireImg} />
                  <View style={styles.streakTextCol}>
                    <Text style={styles.streakNum}>{currentStreak}</Text>
                    <Text style={styles.streakLabel}>Day Streak</Text>
                  </View>
                </View>

                <View style={styles.weekRow}>
                  {WEEK_DAY_LABELS.map((label, i) => {
                    const dayData = weekStreak.find(d => d.dayIndex === i);
                    const checked = dayData?.hasActivity || false;
                    const isToday = i === currentDayIndex;
                    const isFuture = i > currentDayIndex;

                    return (
                      <View key={i} style={styles.dayCol}>
                        <View
                          style={[
                            styles.dayBox,
                            checked && styles.dayBoxChecked,
                            isToday && !checked && styles.dayBoxToday,
                            isFuture && styles.dayBoxFuture,
                          ]}
                        >
                          <Ionicons
                            name={DAY_ICONS[i]}
                            size={12}
                            color={checked ? '#FFFFFF' : '#F97316'}
                          />
                        </View>
                        <Text style={[styles.dayTxt, isToday && styles.dayTxtToday]}>
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Pressable>

              {/* Weight Card */}
              <View style={[styles.card, styles.weightCard]}>
                <View style={styles.weightHeaderRow}>
                  <View style={styles.weightIconWrap}>
                    <Ionicons name="scale-outline" size={26} color="#8B5CF6" />
                  </View>
                  <Text style={styles.weightLabel}>My Weight</Text>
                </View>
                <View style={styles.weightValueRow}>
                  <Text style={styles.weightNum}>{userWeight}</Text>
                  <Text style={styles.weightUnit}>kg</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.textMuted}
                  style={styles.weightNext}
                />
              </View>
            </View>

            {/* Motivational Card */}
            <View style={styles.motiveCard}>
              <Ionicons name="sparkles" size={20} color="#F59E0B" />
              <View style={styles.motiveTextCol}>
                <Text style={styles.motiveTitle}>Keep Going!</Text>
                <Text style={styles.motiveBody}>
                  Stay consistent with your daily logging to reach your fitness goals.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={isStreakModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStreakModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsStreakModalOpen(false)}>
          <Pressable style={styles.modalDialog} onPress={() => {}}>
            <View style={styles.modalStreakHeader}>
              <Image source={require('../../assets/images/fire.png')} style={styles.modalFireImg} />
              <View style={styles.modalStreakTextCol}>
                <Text style={styles.modalStreakNum}>{currentStreak}</Text>
                <Text style={styles.modalStreakLabel}>Daily Streak</Text>
              </View>
              <Text style={styles.modalKeepItUp}>Keep it up 🔥</Text>
            </View>

            <View style={styles.modalWeekRow}>
              {WEEK_DAY_LABELS.map((label, i) => {
                const dayData = weekStreak.find(d => d.dayIndex === i);
                const checked = dayData?.hasActivity || false;
                const isToday = i === currentDayIndex;
                const isFuture = i > currentDayIndex;

                return (
                  <View key={i} style={styles.modalDayCol}>
                    <View
                      style={[
                        styles.modalDayBox,
                        checked && styles.dayBoxChecked,
                        isToday && !checked && styles.dayBoxToday,
                        isFuture && styles.dayBoxFuture,
                      ]}
                    >
                      {checked ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <Ionicons name={DAY_ICONS[i]} size={16} color="#F97316" />
                      )}
                    </View>
                    <Text style={[styles.modalDayTxt, isToday && styles.dayTxtToday]}>
                      {WEEK_DAY_DDD[i]}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.modalCloseBtn,
                pressed && styles.cardPressed,
              ]}
              onPress={() => setIsStreakModalOpen(false)}
            >
              <Text style={styles.modalCloseTxt}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const CARD_GAP = 10;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 110,
  },
  heading: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  loader: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 14,
  },

  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  streakCard: {
    marginRight: CARD_GAP / 2,
  },

  cardPressed: {
    opacity: 0.7,
  },

  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  fireImg: {
    width: 42,
    height: 42,
  },
  streakTextCol: {
    flex: 1,
  },
  streakNum: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
  },
  streakLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  dayTxt: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  dayTxtToday: {
    color: Colors.primary,
  },
  dayBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBoxChecked: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  dayBoxToday: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dayBoxFuture: {
    opacity: 0.3,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalStreakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  modalFireImg: {
    width: 58,
    height: 58,
  },
  modalStreakTextCol: {
    flex: 1,
  },
  modalStreakNum: {
    color: Colors.text,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 44,
  },
  modalStreakLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  modalKeepItUp: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
  },
  modalDayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  modalDayBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDayTxt: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  modalCloseBtn: {
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 10,
    marginTop: 22,
  },
  modalCloseTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  weightCard: {
    marginLeft: CARD_GAP / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightNext: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  weightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginRight: 14,
  },
  weightIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  weightNum: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  weightUnit: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  weightLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  motiveCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  motiveTextCol: {
    flex: 1,
  },
  motiveTitle: {
    color: '#92400E',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  motiveBody: {
    color: '#78350F',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
});
