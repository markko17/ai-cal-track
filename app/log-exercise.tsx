import AddLogModal from '@/components/AddLogModal';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LogExerciseScreen() {
  const router = useRouter();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExerciseTitle, setSelectedExerciseTitle] = useState('');

  const exerciseOptions = [
    {
      id: 'run',
      title: 'Cardio',
      description: 'Running, walking, cycling, and more',
      iconName: 'walk-outline' as const,
      iconColor: '#F97316',
      iconBg: 'rgba(249, 115, 22, 0.12)',
      defaultTitle: 'Cardio',
    },
    {
      id: 'weight_lifting',
      title: 'Weight Lifting',
      description: 'Gym, Machine etc',
      iconName: 'barbell-outline' as const,
      iconColor: '#3B82F6',
      iconBg: 'rgba(59, 130, 246, 0.12)',
      defaultTitle: 'Weight Lifting',
    },
    {
      id: 'manual',
      title: 'Manual',
      description: 'Enter calories Burn Manually',
      iconName: 'create-outline' as const,
      iconColor: '#10B981',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      defaultTitle: '',
    },
  ];

  const handleSelectOption = (opt: (typeof exerciseOptions)[0]) => {
    if (opt.id === 'manual') {
      router.push('/manual-calories' as any);
    } else {
      router.push({
        pathname: '/exercise-details',
        params: {
          id: opt.id,
          title: opt.title,
          description: opt.description,
          defaultTitle: opt.defaultTitle,
          iconName: opt.iconName,
          iconColor: opt.iconColor,
          iconBg: opt.iconBg,
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Screen Title */}
        <Text style={styles.screenTitle}>Log Exercise</Text>

        {/* Section Subtitle */}
        <Text style={styles.subTitle}>
          Choose how you want to log your workout session and calories burned.
        </Text>

        {/* 3 Exercise Option Cards */}
        <View style={styles.optionsList}>
          {exerciseOptions.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={styles.optionCard}
              onPress={() => handleSelectOption(opt)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrapper, { backgroundColor: opt.iconBg }]}>
                <Ionicons name={opt.iconName} size={28} color={opt.iconColor} />
              </View>

              <View style={styles.optionTextCol}>
                <Text style={styles.optionTitle}>{opt.title}</Text>
                <Text style={styles.optionDesc}>{opt.description}</Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add Log Modal */}
      <AddLogModal
        isVisible={isAddModalOpen}
        initialType="workout"
        initialTitle={selectedExerciseTitle}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  screenTitle: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  subTitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  optionsList: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
