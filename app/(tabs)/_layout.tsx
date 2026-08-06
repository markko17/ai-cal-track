import ScanFoodModal from "@/components/ScanFoodModal";
import Colors from "@/constants/colors";
import {
  addWaterLogToFirestore,
  formatDateKey,
} from "@/services/dailyLogService";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isPlusModalVisible, setIsPlusModalVisible] = useState(false);
  const [isScanModalVisible, setIsScanModalVisible] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false); // Mock paid status toggle

  const closePlusModal = useCallback(() => {
    setIsPlusModalVisible(false);
  }, []);

  const handleOpenExercise = () => {
    setIsPlusModalVisible(false);
    router.push("/log-exercise" as any);
  };

  const handleOpenWater = () => {
    closePlusModal();
    router.push("/log-water" as any);
  };

  const handleOpenFoodDb = () => {
    closePlusModal();
    router.push("/food-database" as any);
  };

  const handleScanFood = () => {
    closePlusModal();
    setIsScanModalVisible(true);
  };

  const bottomMargin = Platform.OS === "ios" ? Math.max(insets.bottom, 16) : 16;

  return (
    <>
      <View style={[styles.floatingTabBarWrapper, { bottom: bottomMargin }]}>
        <View style={styles.floatingTabBarCard}>
          {/* 3 Tabs: Home, Analytics, Profile */}
          <View style={styles.tabsRow}>
            {state.routes.map((route: any, index: number) => {
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              let iconName: keyof typeof Ionicons.glyphMap = "home-outline";
              let tabTitle = "Home";

              if (route.name === "index") {
                iconName = isFocused ? "home" : "home-outline";
                tabTitle = "Home";
              } else if (route.name === "analytics") {
                iconName = isFocused ? "bar-chart" : "bar-chart-outline";
                tabTitle = "Progress";
              } else if (route.name === "profile") {
                iconName = isFocused ? "settings" : "settings-outline";
                tabTitle = "Settings";
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

          {/* Floating Rounded Plus Button on the Right Side */}
          <TouchableOpacity
            style={styles.plusFloatingBtnRight}
            onPress={() => setIsPlusModalVisible(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add quick entry"
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4-Option Grid Modal Sheet above the floating button */}
      <Modal
        visible={isPlusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePlusModal}
      >
        <TouchableWithoutFeedback onPress={closePlusModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.grid2x2Container,
                  { marginBottom: bottomMargin + 16 },
                ]}
              >
                <TouchableOpacity
                  style={styles.gridCard}
                  onPress={handleOpenExercise}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.cardIconBg,
                      { backgroundColor: "rgba(249, 115, 22, 0.16)" },
                    ]}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={26}
                      color="#F97316"
                    />
                  </View>
                  <Text style={styles.cardTitle}>Log Exercise</Text>
                  <Text style={styles.cardSub}>Workouts & burn</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gridCard}
                  onPress={handleOpenWater}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.cardIconBg,
                      { backgroundColor: "rgba(56, 189, 248, 0.16)" },
                    ]}
                  >
                    <Ionicons name="water-outline" size={26} color="#38BDF8" />
                  </View>
                  <Text style={styles.cardTitle}>Add drink water</Text>
                  <Text style={styles.cardSub}>+250ml quick entry</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gridCard}
                  onPress={handleOpenFoodDb}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.cardIconBg,
                      { backgroundColor: "rgba(16, 185, 129, 0.16)" },
                    ]}
                  >
                    <Ionicons name="search-outline" size={26} color="#10B981" />
                  </View>
                  <Text style={styles.cardTitle}>food database</Text>
                  <Text style={styles.cardSub}>Search 100k+ foods</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.gridCard, styles.premiumGridCard]}
                  onPress={handleScanFood}
                  activeOpacity={0.8}
                >
                  <View style={styles.proBadge}>
                    <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>

                  <View
                    style={[
                      styles.cardIconBg,
                      { backgroundColor: "rgba(139, 92, 246, 0.16)" },
                    ]}
                  >
                    <Ionicons name="camera-outline" size={26} color="#8B5CF6" />
                  </View>
                  <Text style={styles.cardTitle}>scan food</Text>
                  <Text style={styles.cardSub}>AI photo scanner</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ScanFoodModal
        isVisible={isScanModalVisible}
        onClose={() => setIsScanModalVisible(false)}
      />
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
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingTabBarWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 99,
  },
  floatingTabBarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 36,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: "100%",
    maxWidth: 440,
  },
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginRight: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#111827",
    marginTop: 3,
  },
  plusFloatingBtnRight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginLeft: 8,
    marginRight: -4,
    marginVertical: -8,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  userStatusFree: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  userStatusPaid: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  userStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  grid2x2Container: {
    width: "100%",
    maxWidth: 400,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 0,
  },
  gridCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  premiumGridCard: {
    borderColor: "rgba(139, 92, 246, 0.22)",
    backgroundColor: "rgba(243, 232, 255, 0.85)",
  },
  proBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  proBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "400",
  },

  successAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "700",
  },

  premiumAlertBox: {
    backgroundColor: "#FAF5FF",
    borderColor: "#DDD6FE",
    borderWidth: 1,
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  premiumAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  premiumAlertTitle: {
    color: "#5B21B6",
    fontSize: 16,
    fontWeight: "800",
  },
  premiumAlertDesc: {
    color: "#6D28D9",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  premiumActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  premiumBtnPrimary: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  premiumBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  premiumBtnSecondary: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  premiumBtnSecondaryText: {
    color: "#7C3AED",
    fontSize: 13,
    fontWeight: "700",
  },

  modalCloseBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  modalCloseBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
