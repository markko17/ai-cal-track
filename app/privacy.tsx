import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.legalBodyText}>
            Your privacy is critically important to us. AI Cal Track ensures your personal data and health metrics remain secure and protected.
            {'\n\n'}
            <Text style={styles.boldText}>1. Data Collection</Text>{'\n'}
            We collect essential account information (name, email) and user-submitted meal and fitness logs to personalize your calorie recommendations and track your progress.
            {'\n\n'}
            <Text style={styles.boldText}>2. Photo Data</Text>{'\n'}
            Images scanned via our AI scanner are processed securely to recognize food macros. These images are used solely for your personal tracking and are never sold or shared with third-party advertisers.
            {'\n\n'}
            <Text style={styles.boldText}>3. Third-Party Services</Text>{'\n'}
            We may use trusted third-party services (like Firebase and Clerk) for authentication, database storage, and AI processing. These services adhere to strict security and privacy standards.
            {'\n\n'}
            <Text style={styles.boldText}>4. Data Rights</Text>{'\n'}
            You have the right to access, export, or delete your personal data at any time. You can manage these preferences directly from your account settings or by contacting our support team.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
    padding: 20,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  legalBodyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.text,
  },
});
