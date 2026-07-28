import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [isPlusModalVisible, setIsPlusModalVisible] = useState(false);
  const [actionAlertMsg, setActionAlertMsg] = useState('');

  const handleQuickAction = (actionTitle: string) => {
    setActionAlertMsg(`${actionTitle} recorded!`);
    setTimeout(() => {
      setActionAlertMsg('');
      setIsPlusModalVisible(false);
    }, 1200);
  };

  const bottomMargin = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 16;

  return (
    <>
      <View style={[styles.floatingTabBarWrapper, { bottom: bottomMargin }]}>
        {/* Floating Rounded Plus Button Centered Above Tab Bar */}
        <TouchableOpacity
          style={styles.plusFloatingBtnCenter}
          onPress={() => setIsPlusModalVisible(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add quick entry"
        >
          <Ionicons name="add" size={28} color={Colors.textOnPrimary} />
        </TouchableOpacity>

        <View style={styles.floatingTabBarCard}>
          {/* 3 Tabs: Home, Analytics, Profile */}
          <View style={styles.tabsRow}>
            {state.routes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
              let tabTitle = 'Home';

              if (route.name === 'index') {
                iconName = isFocused ? 'home' : 'home-outline';
                tabTitle = 'Home';
              } else if (route.name === 'analytics') {
                iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
                tabTitle = 'Analytics';
              } else if (route.name === 'profile') {
                iconName = isFocused ? 'person' : 'person-outline';
                tabTitle = 'Profile';
              }

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={styles.tabItem}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={tabTitle}
                >
                  <Ionicons
                    name={iconName}
                    size={22}
                    color={isFocused ? Colors.primary : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isFocused ? Colors.primary : Colors.textMuted },
                    ]}
                  >
                    {tabTitle}
                  </Text>
                  {isFocused ? <View style={styles.activeDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>


      {/* Quick Action Modal Sheet */}
      <Modal
        visible={isPlusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPlusModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsPlusModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheetCard}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Quick Log & Snap</Text>
                <Text style={styles.modalSubTitle}>Choose an action to quickly track your daily progress</Text>

                {actionAlertMsg ? (
                  <View style={styles.successAlertBox}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={{ marginRight: 8 }} />
                    <Text style={styles.successAlertText}>{actionAlertMsg}</Text>
                  </View>
                ) : (
                  <View style={styles.modalActionsGrid}>
                    <TouchableOpacity
                      style={styles.actionRowBtn}
                      onPress={() => handleQuickAction('Meal Log')}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.actionIconBg, { backgroundColor: Colors.primaryGlow }]}>
                        <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionBtnTitle}>Snap & Track Meal</Text>
                        <Text style={styles.actionBtnSub}>Take photo or scan food label via AI</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionRowBtn}
                      onPress={() => handleQuickAction('+250ml Water')}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.actionIconBg, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                        <Ionicons name="water-outline" size={22} color="#38BDF8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionBtnTitle}>Log Water (250ml)</Text>
                        <Text style={styles.actionBtnSub}>Add 1 glass towards daily target</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionRowBtn}
                      onPress={() => handleQuickAction('Weight Log')}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.actionIconBg, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                        <Ionicons name="scale-outline" size={22} color="#EC4899" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionBtnTitle}>Log Weight Progress</Text>
                        <Text style={styles.actionBtnSub}>Record today&apos;s morning weigh-in</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setIsPlusModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingTabBarWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 99,
  },
  floatingTabBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 22, 22, 0.95)',
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    width: '100%',
    maxWidth: 440,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
  plusFloatingBtnCenter: {

    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: -16,
    zIndex: 10,
    borderWidth: 3,
    borderColor: Colors.background,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheetCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.cardBorder,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  modalActionsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionBtnTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtnSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  successAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  successAlertText: {
    color: Colors.success,
    fontSize: 15,
    fontWeight: '700',
  },
  modalCloseBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalCloseBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
