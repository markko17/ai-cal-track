import AddLogModal from '@/components/AddLogModal';
import CalorieCard from '@/components/CalorieCard';
import EditTargetsModal from '@/components/EditTargetsModal';
import HomeHeader from '@/components/HomeHeader';
import RecentMealCard from '@/components/RecentMealCard';
import WaterCard from '@/components/WaterCard';
import WeekCalendarStrip from '@/components/WeekCalendarStrip';
import Colors from '@/constants/colors';
import { DailyLogData, LogEntry, addWaterLogToFirestore, formatDateKey, getDailyLogByDate } from '@/services/dailyLogService';
import { getUserFromFirestore, getUserOnboardingFromStorage } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function HomeTabScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [userPlanData, setUserPlanData] = useState<any>(null);
  const [dailyLog, setDailyLog] = useState<DailyLogData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogLoading, setIsLogLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditTargetsModalVisible, setIsEditTargetsModalVisible] = useState(false);

  // Load User Targets
  const loadUserData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const localData = await getUserOnboardingFromStorage(user.id);
      if (localData) {
        setUserPlanData(localData);
      } else {
        const dbResult = await getUserFromFirestore(user.id);
        if (dbResult.exists && dbResult.data) {
          setUserPlanData(dbResult.data);
        }
      }
    } catch (err) {
      console.error('Error loading user target data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load Date-Specific Daily Logs whenever selectedDate or user changes
  const fetchDateLog = useCallback(async () => {
    if (!user?.id) return;
    setIsLogLoading(true);
    try {
      const dateStr = formatDateKey(selectedDate);
      const logResult = await getDailyLogByDate(user.id, dateStr);
      setDailyLog(logResult);
    } catch (err) {
      console.error('Error loading daily log:', err);
    } finally {
      setIsLogLoading(false);
    }
  }, [user?.id, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      fetchDateLog();
    }, [loadUserData, fetchDateLog])
  );

  useEffect(() => {
    fetchDateLog();
  }, [fetchDateLog]);

  const userFullName = user?.fullName || user?.firstName || 'Wade Warren';
  const userAvatar = user?.imageUrl;

  const dailyCalorieGoal = userPlanData?.dailyCalorieGoal || 2000;
  const proteinGoal = userPlanData?.macroGoals?.protein || 150;
  const carbsGoal = userPlanData?.macroGoals?.carbs || 200;
  const fatGoal = userPlanData?.macroGoals?.fat || 65;
  const waterGoalLiters = userPlanData?.waterGoal?.liters || 3.0;

  const consumedCalories = dailyLog?.consumedCalories || 0;
  const burnedCalories = dailyLog?.burnedCalories || 0;
  const consumedProtein = dailyLog?.consumedProtein || 0;
  const consumedCarbs = dailyLog?.consumedCarbs || 0;
  const consumedFat = dailyLog?.consumedFat || 0;
  const consumedWaterLiters = dailyLog?.consumedWaterLiters || 0;

  const getLogTime = (createdAt: string) => new Date(createdAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const getWorkoutMetadata = (entry: LogEntry) => {
    const legacyDetails = entry.title.match(/\((\d+)m,\s*(Low|Medium|High)\)/i);
    return {
      exerciseType: entry.exerciseType,
      durationMinutes: entry.durationMinutes || (legacyDetails ? Number(legacyDetails[1]) : undefined),
      intensity: entry.intensity || (legacyDetails?.[2]?.toLowerCase() as 'low' | 'medium' | 'high' | undefined),
    };
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'You are all caught up! No unread notifications.');
  };

  const handleCalendarPress = () => {
    Alert.alert('Calendar', `Viewing logs for ${formatDateKey(selectedDate)}`);
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/profile' as any);
  };

  const handleEditCalorieGoal = () => {
    setIsEditTargetsModalVisible(true);
  };

  const handleLogWater = async () => {
    if (!user?.id) return;
    try {
      await addWaterLogToFirestore(user.id, formatDateKey(selectedDate), 0.25);
      fetchDateLog();
    } catch (err) {
      console.error('Error logging water:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Standalone Home Header Component */}
        <HomeHeader
          userFullName={userFullName}
          userAvatar={userAvatar}
          welcomeText="Good morning!"
          hasUnreadNotifications={true}
          onNotificationPress={handleNotificationPress}
          onCalendarPress={handleCalendarPress}
          onProfilePress={handleProfilePress}
        />

        {/* Horizontal Week Calendar Strip */}
        <WeekCalendarStrip
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(date)}
        />

        {/* Calorie Card Component with Progress Arc & Macronutrient Grid */}
        <CalorieCard
          dailyCalorieGoal={dailyCalorieGoal}
          consumedCalories={consumedCalories}
          burnedCalories={burnedCalories}
          carbsGoal={carbsGoal}
          proteinGoal={proteinGoal}
          fatGoal={fatGoal}
          consumedCarbs={consumedCarbs}
          consumedProtein={consumedProtein}
          consumedFat={consumedFat}
          isLoading={isLoading || isLogLoading}
          onEditPress={handleEditCalorieGoal}
        />

        {/* Water Intake Card (Placed directly after Calories Card) */}
        <WaterCard
          waterGoalLiters={waterGoalLiters}
          consumedWaterLiters={consumedWaterLiters}
          isLoading={isLoading || isLogLoading}
          onEditPress={handleEditCalorieGoal}
          onLogWaterPress={handleLogWater}
        />

        {/* Recently logged Header & Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recently logged</Text>
        </View>

        {dailyLog?.entries && dailyLog.entries.length > 0 ? (
          dailyLog.entries.map((entry) => {
            const workoutMetadata = entry.type === 'workout' ? getWorkoutMetadata(entry) : {};
            return (
              <RecentMealCard
                key={entry.id}
                title={entry.title}
                calories={entry.calories}
                type={entry.type}
                time={getLogTime(entry.createdAt)}
                {...workoutMetadata}
              />
            );
          })
        ) : (
          <View style={styles.recentlyLoggedContainer}>
            {/* Top Carousel Pagination Dots */}
            <View style={styles.paginationDotsRow}>
              <View style={styles.dotActive} />
              <View style={styles.dotInactive} />
            </View>

            {/* Empty State Card */}
            <TouchableOpacity
              style={styles.emptyLogCard}
              onPress={() => setIsAddModalVisible(true)}
              activeOpacity={0.9}
            >
              <Text style={styles.emptyLogCardTitle}>You haven't uploaded any food</Text>
              <Text style={styles.emptyLogCardSubtitle}>
                Start tracking today's meals by taking a quick picture.
              </Text>
            </TouchableOpacity>

            {/* Hand-drawn Arrow Pointing Down towards Floating + Button */}
            <View style={styles.arrowPointerWrapper}>
              <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
                <Path
                  d="M 10 6 C 30 -2, 48 14, 28 24 C 16 30, 20 44, 30 52 M 21 42 L 30 52 L 37 42"
                  stroke="#111827"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Activity / Meal Modal */}
      <AddLogModal
        isVisible={isAddModalVisible}
        selectedDate={selectedDate}
        onClose={() => setIsAddModalVisible(false)}
        onSuccess={fetchDateLog}
      />

      {/* Edit Primary Targets Modal */}
      <EditTargetsModal
        isVisible={isEditTargetsModalVisible}
        currentCalorieGoal={dailyCalorieGoal}
        currentProteinGoal={proteinGoal}
        currentCarbsGoal={carbsGoal}
        currentFatGoal={fatGoal}
        currentWaterGoal={waterGoalLiters}
        onClose={() => setIsEditTargetsModalVisible(false)}
        onSuccess={loadUserData}
      />
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
    paddingTop: 12,
    paddingBottom: 110,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  addLogSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  addLogSmallText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  recentlyLoggedContainer: {
    marginBottom: 20,
  },
  paginationDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#111827',
  },
  dotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  emptyLogCard: {
    backgroundColor: '#F6F7FA',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  emptyLogCardTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyLogCardSubtitle: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 270,
  },
  arrowPointerWrapper: {
    alignSelf: 'flex-end',
    marginRight: 36,
    marginTop: 2,
    marginBottom: 0,
  },
});
