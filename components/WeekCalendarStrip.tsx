import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export interface WeekCalendarStripProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

interface CalendarDayItem {
  date: Date;
  dateString: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

const formatDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export default function WeekCalendarStrip({
  selectedDate: propSelectedDate,
  onSelectDate,
}: WeekCalendarStripProps) {
  const { width: windowWidth } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDateString(today), [today]);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    propSelectedDate ? formatDateString(propSelectedDate) : todayStr
  );
  const [weekOffset, setWeekOffset] = useState<number>(0);

  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDateStr(formatDateString(propSelectedDate));
    }
  }, [propSelectedDate]);

  // Calculate 7 days for the active weekOffset (Monday to Sunday)
  const currentWeekDays: CalendarDayItem[] = useMemo(() => {
    const monday = getMonday(today);
    monday.setDate(monday.getDate() + weekOffset * 7);

    const days: CalendarDayItem[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatDateString(d);
      const dayName = d
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase();
      const dayNumber = d.getDate();
      days.push({
        date: d,
        dateString: dateStr,
        dayName,
        dayNumber,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [today, todayStr, weekOffset]);

  // Header string (e.g. "July 2026" or "Jun - Jul 2026")
  const headerMonthYear = useMemo(() => {
    if (currentWeekDays.length === 0) return '';
    const firstDay = currentWeekDays[0].date;
    const lastDay = currentWeekDays[6].date;

    const firstMonth = firstDay.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = lastDay.toLocaleDateString('en-US', { month: 'short' });
    const year = lastDay.getFullYear();

    if (firstMonth === lastMonth) {
      return `${firstDay.toLocaleDateString('en-US', { month: 'long' })} ${year}`;
    }
    return `${firstMonth} - ${lastMonth} ${year}`;
  }, [currentWeekDays]);

  const handleDatePress = (item: CalendarDayItem) => {
    setSelectedDateStr(item.dateString);
    if (onSelectDate) {
      onSelectDate(item.date);
    }
  };

  const handleResetToToday = () => {
    setWeekOffset(0);
    setSelectedDateStr(todayStr);
    if (onSelectDate) {
      onSelectDate(new Date());
    }
  };

  // Compute cell width so all 7 days fit on screen cleanly
  const containerPadding = 40; // 20px padding left + 20px right
  const gap = 6;
  const availableWidth = Math.max(windowWidth - containerPadding - gap * 6, 280);
  const dayCardWidth = Math.floor(availableWidth / 7);

  return (
    <View style={styles.container}>
      {/* Month & Week Navigation Header */}
      <View style={styles.headerRow}>
        <View style={styles.monthTitleCol}>
          <Text style={styles.monthText}>{headerMonthYear}</Text>
          {weekOffset !== 0 && (
            <TouchableOpacity
              onPress={handleResetToToday}
              style={styles.todayPillBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.todayPillText}>Today</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Previous / Next Week Buttons */}
        <View style={styles.navArrowsRow}>
          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={() => setWeekOffset((prev) => prev - 1)}
            activeOpacity={0.7}
            accessibilityLabel="Previous week"
          >
            <Ionicons name="chevron-back" size={16} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={() => setWeekOffset((prev) => prev + 1)}
            activeOpacity={0.7}
            accessibilityLabel="Next week"
          >
            <Ionicons name="chevron-forward" size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 7 Days Grid for Active Week */}
      <View style={styles.weekGrid}>
        {currentWeekDays.map((item) => {
          const isSelected = item.dateString === selectedDateStr;
          const isToday = item.isToday;

          return (
            <TouchableOpacity
              key={item.dateString}
              style={[
                styles.dayCard,
                { width: dayCardWidth },
                isSelected && styles.dayCardSelected,
                isToday && !isSelected && styles.dayCardToday,
              ]}
              onPress={() => handleDatePress(item)}
              activeOpacity={0.75}
            >
              {/* Day of Week (DDD) */}
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayNameSelected,
                  isToday && !isSelected && styles.dayNameToday,
                ]}
              >
                {item.dayName}
              </Text>

              {/* Date Number inside Rounded Circle */}
              <View
                style={[
                  styles.dateCircle,
                  isSelected && styles.dateCircleSelected,
                  isToday && !isSelected && styles.dateCircleToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumberText,
                    isSelected && styles.dayNumberTextSelected,
                    isToday && !isSelected && styles.dayNumberTextToday,
                  ]}
                >
                  {item.dayNumber}
                </Text>
              </View>

              {/* Indicator Dot */}
              <View
                style={[
                  styles.dotContainer,
                  isToday && styles.todayDot,
                  isSelected && styles.selectedDot,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthTitleCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  todayPillBtn: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primaryBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayPillText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  navArrowsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCard: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dayCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  dayCardToday: {
    borderColor: Colors.primaryBorder,
    backgroundColor: 'rgba(200, 169, 110, 0.08)',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  dayNameSelected: {
    color: Colors.textOnPrimary,
    fontWeight: '800',
  },
  dayNameToday: {
    color: Colors.primary,
    fontWeight: '800',
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dateCircleSelected: {
    backgroundColor: Colors.textOnPrimary,
    borderColor: Colors.textOnPrimary,
  },
  dateCircleToday: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primaryBorder,
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  dayNumberTextSelected: {
    color: Colors.primary,
    fontWeight: '900',
  },
  dayNumberTextToday: {
    color: Colors.primary,
    fontWeight: '900',
  },
  dotContainer: {
    height: 4,
    width: 4,
    borderRadius: 2,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  todayDot: {
    backgroundColor: Colors.primary,
  },
  selectedDot: {
    backgroundColor: Colors.textOnPrimary,
  },
});
