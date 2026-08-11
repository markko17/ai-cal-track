import Colors from '@/constants/colors';
import { getUserFromFirestore, getUserOnboardingFromStorage } from '@/services/userService';
import { clearUserSession } from '@/utils/cache';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileTabScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<any>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'freeTrial' | 'personalDetails' | 'preferences' | 'requestFeatures' | 'contactUs' | 'terms' | 'privacy' | null
  >(null);

  // Preferences local state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const [metricUnits, setMetricUnits] = useState(true);

  // Request feature state
  const [featureInput, setFeatureInput] = useState('');
  const [featureSubmitted, setFeatureSubmitted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      async function fetchProfile() {
        if (!user?.id) return;
        try {
          const local = await getUserOnboardingFromStorage(user.id);
          if (local && isMounted) {
            setProfileData(local);
            return;
          }
          const dbRes = await getUserFromFirestore(user.id);
          if (dbRes.exists && dbRes.data && isMounted) {
            setProfileData(dbRes.data);
          }
        } catch (err) {
          console.error('Error reading profile info:', err);
        }
      }
      fetchProfile();
      return () => {
        isMounted = false;
      };
    }, [user?.id])
  );

  const handleSignOut = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUserSession();
              await signOut();
            } catch (err: any) {
              console.error('Error during sign out:', err);
            } finally {
              router.dismissAll();
              router.replace('/');
            }
          },
        },
      ]
    );
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress || 'User';
  const userFullName = user?.fullName || user?.firstName || 'Fitness Enthusiast';
  const userAvatar = user?.imageUrl;

  const handleSendFeatureRequest = () => {
    if (!featureInput.trim()) {
      Alert.alert('Empty Request', 'Please enter a feature suggestion.');
      return;
    }
    setFeatureSubmitted(true);
    setTimeout(() => {
      setFeatureSubmitted(false);
      setFeatureInput('');
      setActiveModal(null);
      Alert.alert('Thank You!', 'Your feature request has been submitted to our product team.');
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Top Header: Big Profile text on left side */}
        <View style={styles.topHeaderRow}>
          <Text style={styles.screenTitle}>Profile</Text>
        </View>

        {/* 2. User Info Card */}
        <View style={styles.userCard}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={28} color={Colors.primary} />
            </View>
          )}
          <View style={styles.userInfoTextCol}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {userFullName}
            </Text>
            <Text style={styles.userEmailText} numberOfLines={1}>
              {userEmail}
            </Text>
          </View>
        </View>

        {/* 3. Free Trial Banner / Card */}
        <TouchableOpacity
          style={styles.freeTrialCard}
          onPress={() => setActiveModal('freeTrial')}
          activeOpacity={0.88}
        >
          <View style={styles.trialLeftIconWrapper}>
            <Ionicons name="sparkles" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.trialTextCol}>
            <View style={styles.trialHeaderRow}>
              <Text style={styles.trialTitle}>Upgrade to Premium</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.trialSubtext}>Start 7 days Free trial</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
        </TouchableOpacity>

        {/* 4. Account Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Account</Text>
          <View style={styles.sectionCard}>
            {/* Personal Details */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => router.push('/personal-details' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="person-outline" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.menuItemLabel}>Personal Details</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            {/* Preferences */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => router.push('/preferences' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="options-outline" size={20} color="#16A34A" />
              </View>
              <Text style={styles.menuItemLabel}>Preferences</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            {/* Upgrade to Premium Features */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => setActiveModal('freeTrial')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="star-outline" size={20} color="#9333EA" />
              </View>
              <Text style={styles.menuItemLabel}>Upgrade to Premium Features</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Support Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Support</Text>
          <View style={styles.sectionCard}>
            {/* Request new features */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => router.push('/request-features' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="bulb-outline" size={20} color="#EA580C" />
              </View>
              <Text style={styles.menuItemLabel}>Request new features</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            {/* Contact us */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                Linking.openURL('mailto:marklagdaan606@gmail.com?subject=AI Cal Track Support&body=Hello Support Team,');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="headset-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.menuItemLabel}>Contact us</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            {/* Terms and condition */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => router.push('/terms' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="document-text-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.menuItemLabel}>Terms and condition</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            {/* Privacy policy */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => router.push('/privacy' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
              </View>
              <Text style={styles.menuItemLabel}>Privacy policy</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. Logout Button (Outside of support section, at the bottom) */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} style={{ marginRight: 10 }} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- MODAL DIALOGS --- */}

      {/* Free Trial / Premium Modal */}
      <Modal visible={activeModal === 'freeTrial'} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalTitleBadge}>
                    <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                    <Text style={styles.modalTitleBadgeText}>PRO TRIAL</Text>
                  </View>
                  <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtnIcon}>
                    <Ionicons name="close" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalMainTitle}>Unlock Unlimited AI Nutrition</Text>
                <Text style={styles.modalSubDesc}>
                  Experience instant AI food photo scanning, personalized macro targets, and detailed macro analytics.
                </Text>

                <View style={styles.benefitList}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.benefitText}>Unlimited Instant Food Photo Scanning</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.benefitText}>AI Fitness & Calorie Re-calculations</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.benefitText}>Advanced Micro & Weekly Macro Insights</Text>
                  </View>
                </View>

                <View style={styles.trialHighlightBox}>
                  <Ionicons name="gift-outline" size={24} color="#8B5CF6" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.trialBoxTitle}>7 Days Free, then $4.99/mo</Text>
                    <Text style={styles.trialBoxSub}>Cancel anytime from app settings</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => {
                    setActiveModal(null);
                    Alert.alert('7-Day Free Trial Activated!', 'Enjoy full access to all AI Cal Track Pro features!');
                  }}
                >
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionBtnText}>Start 7 days Free trial</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Personal Details Modal */}
      <Modal visible={activeModal === 'personalDetails'} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalHeaderTitle}>Personal Details</Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtnIcon}>
                    <Ionicons name="close" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsListCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Full Name</Text>
                    <Text style={styles.detailVal}>{userFullName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailVal}>{userEmail}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Primary Goal</Text>
                    <Text style={[styles.detailVal, { color: Colors.primary }]}>
                      {profileData?.goal || 'Maintain Weight'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Height</Text>
                    <Text style={styles.detailVal}>{profileData?.height || "5'9\""}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current Weight</Text>
                    <Text style={styles.detailVal}>{profileData?.weight || '75 kg'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Workout Frequency</Text>
                    <Text style={styles.detailVal}>{profileData?.workoutDays || '3-4 days/week'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Calculated BMI</Text>
                    <Text style={styles.detailVal}>
                      {profileData?.bmi ? `${profileData.bmi} (${profileData.bmiCategory})` : '23.0 (Normal)'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() => {
                    setActiveModal(null);
                    router.push('/onboarding' as any);
                  }}
                >
                  <Ionicons name="refresh-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.secondaryActionBtnText}>Re-run AI Goal Onboarding</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>


      {/* Request New Features Modal */}
      <Modal visible={activeModal === 'requestFeatures'} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalHeaderTitle}>Request New Features</Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtnIcon}>
                    <Ionicons name="close" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputGuideText}>
                  What features or improvements would you like to see in AI Cal Track?
                </Text>

                <TextInput
                  style={styles.featureTextInput}
                  placeholder="e.g. Intermittent fasting timer, Barcode scanner, Recipe importer..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={featureInput}
                  onChangeText={setFeatureInput}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={handleSendFeatureRequest}
                  disabled={featureSubmitted}
                >
                  <Ionicons name="send-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionBtnText}>
                    {featureSubmitted ? 'Submitting...' : 'Submit Suggestion'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Contact Us Modal */}
      <Modal visible={activeModal === 'contactUs'} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalHeaderTitle}>Contact Us</Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtnIcon}>
                    <Ionicons name="close" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.contactItemRow}>
                  <View style={[styles.menuIconBg, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="mail-outline" size={20} color="#2563EB" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.contactTitle}>Support Email</Text>
                    <Text style={styles.contactSub}>support@aicaltrack.com</Text>
                  </View>
                </View>

                <View style={styles.contactItemRow}>
                  <View style={[styles.menuIconBg, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="chatbubbles-outline" size={20} color="#7C3AED" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.contactTitle}>Community Support</Text>
                    <Text style={styles.contactSub}>discord.gg/aicaltrack</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => {
                    setActiveModal(null);
                    Alert.alert('Email Client Opened', 'Opening support@aicaltrack.com...');
                  }}
                >
                  <Ionicons name="mail" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionBtnText}>Send an Email</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Terms and Condition Modal */}
      <Modal visible={activeModal === 'terms'} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalHeaderTitle}>Terms & Conditions</Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtnIcon}>
                    <Ionicons name="close" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 280, marginVertical: 10 }}>
                  <Text style={styles.legalBodyText}>
                    Welcome to AI Cal Track. By using our application, you agree to comply with and be bound by the
                    following terms and conditions of use.
                    {'\n\n'}
                    1. Services Offered: AI Cal Track provides AI-driven nutrition estimates, calorie tracking, and
                    fitness guidance based on user input and computer vision algorithms.
                    {'\n\n'}
                    2. Medical Disclaimer: Content within this app is for informational and educational purposes only and
                    does not constitute medical advice or diagnosis. Always consult a qualified physician or nutritionist
                    before starting any diet or workout regimen.
                    {'\n\n'}
                    3. Account Security: You are responsible for safeguarding your authentication credentials and keeping
                    your account information secure.
                  </Text>
                </ScrollView>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setActiveModal(null)}>
                  <Text style={styles.primaryActionBtnText}>I Understand</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={activeModal === 'privacy'} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalHeaderTitle}>Privacy Policy</Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtnIcon}>
                    <Ionicons name="close" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 280, marginVertical: 10 }}>
                  <Text style={styles.legalBodyText}>
                    Your privacy is critically important to us. AI Cal Track ensures your personal data and health
                    metrics remain secure and protected.
                    {'\n\n'}
                    1. Data Collection: We collect essential account information (name, email) and user-submitted meal/fitness logs
                    to personalize your calorie recommendations.
                    {'\n\n'}
                    2. Photo Data: Images scanned via AI scanner are processed securely for food macro recognition and are
                    never sold or shared with third-party advertisers.
                    {'\n\n'}
                    3. Data Rights: You may request access to, export, or deletion of your personal data at any time from your account settings.
                  </Text>
                </ScrollView>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setActiveModal(null)}>
                  <Text style={styles.primaryActionBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingTop: 16,
    paddingBottom: 110,
  },

  // 1. Top Header
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  screenTitle: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // 2. User Info Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoTextCol: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  userNameText: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  userEmailText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  // 3. Free Trial Banner / Card
  freeTrialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  trialLeftIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  trialTextCol: {
    flex: 1,
  },
  trialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trialTitle: {
    color: '#5B21B6',
    fontSize: 16,
    fontWeight: '800',
  },
  proBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trialSubtext: {
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },

  // 4 & 5. Section Containers
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 68,
  },

  // 6. Logout Button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2', // light red color
    height: 54,
    borderRadius: 18,
    marginTop: 8,
  },
  logoutBtnText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '800',
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  modalTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  modalTitleBadgeText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMainTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalSubDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitList: {
    gap: 12,
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  trialHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 24,
  },
  trialBoxTitle: {
    color: '#5B21B6',
    fontSize: 15,
    fontWeight: '800',
  },
  trialBoxSub: {
    color: '#6D28D9',
    fontSize: 12,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 16,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    height: 50,
    borderRadius: 16,
    marginTop: 16,
  },
  secondaryActionBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  detailsListCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  detailLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  detailVal: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  prefLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  prefSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  inputGuideText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  featureTextInput: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
  },
  contactTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  contactSub: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  legalBodyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
