import Colors from '@/constants/colors';
import { getUserPreferences, updateUserPreferences } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ThemeType = 'system' | 'dark' | 'light';

export default function PreferencesScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Preference state (default theme: light, default notifications: true)
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('light');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPreferences() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        const prefs = await getUserPreferences(user.id);
        if (isMounted && prefs) {
          setSelectedTheme(prefs.theme || 'light');
          setNotificationsEnabled(prefs.notifications ?? true);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSavePreferences = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User is not logged in.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserPreferences(user.id, {
        theme: selectedTheme,
        notifications: notificationsEnabled,
      });

      Alert.alert(
        'Preferences Saved',
        'Your theme and notification preferences have been saved to the database.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Save Failed', 'Failed to update preferences in database. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const themeOptions: { type: ThemeType; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    {
      type: 'light',
      title: 'Light Theme',
      subtitle: 'Clean & bright interface style (Default)',
      icon: 'sunny-outline',
    },
    {
      type: 'dark',
      title: 'Dark Theme',
      subtitle: 'Sleek & dark interface style',
      icon: 'moon-outline',
    },
    {
      type: 'system',
      title: 'System Default',
      subtitle: 'Match your phone system settings',
      icon: 'phone-portrait-outline',
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your preferences...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Header with back button */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Appearance & Theme */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Appearance & Theme</Text>
          <Text style={styles.sectionHeaderSubtitle}>Select your preferred visual style for the app</Text>

          <View style={styles.optionsCard}>
            {themeOptions.map((item, index) => {
              const isSelected = selectedTheme === item.type;
              return (
                <React.Fragment key={item.type}>
                  {index > 0 && <View style={styles.itemDivider} />}
                  <TouchableOpacity
                    style={[styles.themeOptionRow, isSelected && styles.themeOptionRowSelected]}
                    onPress={() => setSelectedTheme(item.type)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        isSelected ? styles.iconContainerSelected : styles.iconContainerUnselected,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={isSelected ? Colors.primary : Colors.textMuted}
                      />
                    </View>

                    <View style={styles.themeTextCol}>
                      <Text style={[styles.themeOptionTitle, isSelected && styles.themeOptionTitleSelected]}>
                        {item.title}
                      </Text>
                      <Text style={styles.themeOptionSub}>{item.subtitle}</Text>
                    </View>

                    <View style={styles.radioOuterCircle}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Section 2: Notifications Toggle */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Notifications</Text>
          <Text style={styles.sectionHeaderSubtitle}>Control daily alerts and logging reminders</Text>

          <View style={styles.optionsCard}>
            <View style={styles.notificationRow}>
              <View style={[styles.iconContainer, styles.iconContainerNotification]}>
                <Ionicons
                  name={notificationsEnabled ? 'notifications-outline' : 'notifications-off-outline'}
                  size={22}
                  color={notificationsEnabled ? '#8B5CF6' : Colors.textMuted}
                />
              </View>

              <View style={styles.themeTextCol}>
                <Text style={styles.notificationTitle}>Push Notifications</Text>
                <Text style={styles.themeOptionSub}>
                  {notificationsEnabled ? 'Turned ON — Meal & water reminders active' : 'Turned OFF — No push alerts'}
                </Text>
              </View>

              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E7EB', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
          <Text style={styles.infoCardText}>
            Your preferences are automatically synchronized across all your devices via your account database.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button Footer */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSavePreferences}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Preferences</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
  },

  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionHeaderSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 12,
  },

  optionsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.card,
  },
  themeOptionRowSelected: {
    backgroundColor: Colors.surfaceLight,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerUnselected: {
    backgroundColor: '#F3F4F6',
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(17, 24, 39, 0.08)',
  },
  iconContainerNotification: {
    backgroundColor: '#F3E8FF',
  },

  themeTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  themeOptionTitleSelected: {
    color: Colors.primary,
  },
  themeOptionSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },

  radioOuterCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },

  itemDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 16,
  },

  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 8,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Footer
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
