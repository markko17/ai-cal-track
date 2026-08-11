import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.legalBodyText}>
            <Text style={{ fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 }}>Last updated: August 2026</Text>
            {'\n\n'}
            Welcome to AI Cal Track. By using our application, you agree to comply with and be bound by the
            following terms and conditions of use.
            {'\n\n'}
            <Text style={styles.boldText}>1. Services Offered</Text>{'\n'}
            AI Cal Track provides AI-driven nutrition estimates, calorie tracking, and fitness guidance based on user input and computer vision algorithms.
            {'\n\n'}
            <Text style={styles.boldText}>2. Medical Disclaimer</Text>{'\n'}
            Content within this app is for informational and educational purposes only and does not constitute medical advice or diagnosis. Always consult a qualified physician or nutritionist before starting any diet or workout regimen.
            {'\n\n'}
            <Text style={styles.boldText}>3. Account Security</Text>{'\n'}
            You are responsible for safeguarding your authentication credentials and keeping your account information secure.
            {'\n\n'}
            <Text style={styles.boldText}>4. Subscriptions and Billing</Text>{'\n'}
            Some features may require a premium subscription. You will be billed in advance on a recurring basis. You may cancel your subscription at any time through your app store settings.
            {'\n\n'}
            <Text style={styles.boldText}>5. User Content</Text>{'\n'}
            You retain all rights in, and are solely responsible for, the photos, logs, and other content you submit to the application.
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
