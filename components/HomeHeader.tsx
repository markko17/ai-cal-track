import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface HomeHeaderProps {
  userFullName?: string;
  userAvatar?: string | null;
  welcomeText?: string;
  hasUnreadNotifications?: boolean;
  onNotificationPress?: () => void;
  onCalendarPress?: () => void;
  onProfilePress?: () => void;
}

export default function HomeHeader({
  userFullName = 'Wade Warren',
  userAvatar,
  welcomeText = 'Good morning!',
  hasUnreadNotifications = true,
  onNotificationPress,
  onCalendarPress,
  onProfilePress,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      {/* User Profile Info Left Side */}
      <TouchableOpacity
        style={styles.userInfoRow}
        onPress={onProfilePress}
        activeOpacity={onProfilePress ? 0.7 : 1}
        disabled={!onProfilePress}
      >
        {userAvatar ? (
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
        )}
        <View style={styles.userTextCol}>
          <Text style={styles.welcomeText}>{welcomeText}</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {userFullName}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Right Side Calendar & Notification Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onCalendarPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Calendar"
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onNotificationPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          {hasUnreadNotifications && <View style={styles.unreadBadgeDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
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
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  userName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F87171',
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
});
