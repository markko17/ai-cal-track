import Colors from '@/constants/colors';
import { updateUserMacroTargets } from '@/services/userService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface EditTargetsModalProps {
  isVisible: boolean;
  currentCalorieGoal?: number;
  currentProteinGoal?: number;
  currentCarbsGoal?: number;
  currentFatGoal?: number;
  currentWaterGoal?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditTargetsModal({
  isVisible,
  currentCalorieGoal = 2000,
  currentProteinGoal = 150,
  currentCarbsGoal = 200,
  currentFatGoal = 65,
  currentWaterGoal = 3.0,
  onClose,
  onSuccess,
}: EditTargetsModalProps) {
  const { user } = useUser();
  const [calories, setCalories] = useState(String(currentCalorieGoal));
  const [protein, setProtein] = useState(String(currentProteinGoal));
  const [carbs, setCarbs] = useState(String(currentCarbsGoal));
  const [fat, setFat] = useState(String(currentFatGoal));
  const [water, setWater] = useState(String(currentWaterGoal));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input refs for auto advance
  const proteinRef = useRef<TextInput>(null);
  const carbsRef = useRef<TextInput>(null);
  const fatRef = useRef<TextInput>(null);
  const waterRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isVisible) {
      setCalories(String(currentCalorieGoal));
      setProtein(String(currentProteinGoal));
      setCarbs(String(currentCarbsGoal));
      setFat(String(currentFatGoal));
      setWater(String(currentWaterGoal));
    }
  }, [isVisible, currentCalorieGoal, currentProteinGoal, currentCarbsGoal, currentFatGoal, currentWaterGoal]);

  const handleSave = async () => {
    const calNum = Number(calories);
    const proteinNum = Number(protein);
    const carbsNum = Number(carbs);
    const fatNum = Number(fat);
    const waterNum = Number(water);

    if (!calories || isNaN(calNum) || calNum <= 0) {
      Alert.alert('Invalid Calories', 'Please enter a valid calorie goal (e.g. 2000).');
      return;
    }
    if (isNaN(proteinNum) || proteinNum < 0) {
      Alert.alert('Invalid Protein', 'Please enter a valid protein goal.');
      return;
    }
    if (isNaN(carbsNum) || carbsNum < 0) {
      Alert.alert('Invalid Carbs', 'Please enter a valid carbs goal.');
      return;
    }
    if (isNaN(fatNum) || fatNum < 0) {
      Alert.alert('Invalid Fat', 'Please enter a valid fat goal.');
      return;
    }
    if (isNaN(waterNum) || waterNum <= 0) {
      Alert.alert('Invalid Water Goal', 'Please enter a valid water goal in Liters (e.g. 3.0).');
      return;
    }

    if (!user?.id) {
      Alert.alert('Authentication Error', 'Please sign in to update your target goals.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserMacroTargets(user.id, {
        dailyCalorieGoal: calNum,
        protein: proteinNum,
        carbs: carbsNum,
        fat: fatNum,
        waterLiters: waterNum,
      });

      Alert.alert('Success!', 'Primary daily calorie, macro, & water targets updated in database.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating target goals:', err);
      Alert.alert('Error', err?.message || 'Failed to update target goals in Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalContent}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Edit Primary Targets</Text>
              <Text style={styles.modalSubTitle}>Update your daily calories, macros & water goal</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollForm}>
            {/* Daily Calorie Goal */}
            <View style={styles.inputCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.16)' }]}>
                <Ionicons name="flame" size={20} color="#F97316" />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Daily Calorie Target (kcal)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={5}
                  value={calories}
                  onChangeText={(t) => {
                    setCalories(t);
                    if (t.length >= 4) {
                      proteinRef.current?.focus();
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => proteinRef.current?.focus()}
                />
              </View>
            </View>

            {/* Protein Target */}
            <View style={styles.inputCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.16)' }]}>
                <Ionicons name="flame-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Protein Target (g)</Text>
                <TextInput
                  ref={proteinRef}
                  style={styles.textInput}
                  placeholder="150"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={protein}
                  onChangeText={(t) => {
                    setProtein(t);
                    if (t.length >= 3) {
                      carbsRef.current?.focus();
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => carbsRef.current?.focus()}
                />
              </View>
            </View>

            {/* Carbs Target */}
            <View style={styles.inputCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.16)' }]}>
                <Ionicons name="cafe-outline" size={20} color="#F97316" />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Carbs Target (g)</Text>
                <TextInput
                  ref={carbsRef}
                  style={styles.textInput}
                  placeholder="200"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={carbs}
                  onChangeText={(t) => {
                    setCarbs(t);
                    if (t.length >= 3) {
                      fatRef.current?.focus();
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => fatRef.current?.focus()}
                />
              </View>
            </View>

            {/* Fat Target */}
            <View style={styles.inputCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.16)' }]}>
                <Ionicons name="accessibility-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Fat Target (g)</Text>
                <TextInput
                  ref={fatRef}
                  style={styles.textInput}
                  placeholder="65"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={fat}
                  onChangeText={(t) => {
                    setFat(t);
                    if (t.length >= 3) {
                      waterRef.current?.focus();
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => waterRef.current?.focus()}
                />
              </View>
            </View>

            {/* Water Target (Liters) */}
            <View style={styles.inputCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.16)' }]}>
                <Ionicons name="water" size={20} color="#38BDF8" />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Water Goal (Liters)</Text>
                <TextInput
                  ref={waterRef}
                  style={styles.textInput}
                  placeholder="3.0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={water}
                  onChangeText={setWater}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>

            {/* Save Action Button */}
            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Primary Targets</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  scrollForm: {
    paddingBottom: 20,
    gap: 12,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 2,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
