import Colors from '@/constants/colors';
import { addLogEntryToFirestore, formatDateKey } from '@/services/dailyLogService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
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

export interface AddLogModalProps {
  isVisible: boolean;
  selectedDate?: Date;
  initialType?: 'meal' | 'workout';
  initialTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddLogModal({
  isVisible,
  selectedDate = new Date(),
  initialType = 'meal',
  initialTitle = '',
  onClose,
  onSuccess,
}: AddLogModalProps) {
  const { user } = useUser();
  const [logType, setLogType] = useState<'meal' | 'workout'>(initialType);
  const [title, setTitle] = useState(initialTitle);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input refs for auto advance
  const caloriesRef = useRef<TextInput>(null);
  const proteinRef = useRef<TextInput>(null);
  const carbsRef = useRef<TextInput>(null);
  const fatRef = useRef<TextInput>(null);

  React.useEffect(() => {
    if (isVisible) {
      setLogType(initialType);
      setTitle(initialTitle);
    }
  }, [isVisible, initialType, initialTitle]);

  const dateStr = formatDateKey(selectedDate);

  const resetForm = () => {
    setTitle('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setLogType('meal');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!title.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this entry (e.g. Oatmeal with Protein).');
      return;
    }

    const calNum = Number(calories);
    if (!calories || isNaN(calNum) || calNum <= 0) {
      Alert.alert('Invalid Calories', 'Please enter a valid calorie amount.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please sign in to log your activity.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addLogEntryToFirestore(user.id, dateStr, {
        type: logType,
        title: title.trim(),
        calories: calNum,
        protein: logType === 'meal' ? Number(protein) || 0 : 0,
        carbs: logType === 'meal' ? Number(carbs) || 0 : 0,
        fat: logType === 'meal' ? Number(fat) || 0 : 0,
      });

      Alert.alert(
        'Log Added!',
        `Successfully logged ${logType === 'meal' ? 'meal' : 'workout'} "${title.trim()}" for ${dateStr}.`
      );

      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting log entry:', err);
      Alert.alert('Error', err?.message || 'Failed to save log entry to Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.modalContent}>
          {/* Top Header Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Add Log Entry</Text>
              <Text style={styles.modalSubTitle}>Logging for {dateStr}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollForm}>
            {/* Segmented Type Selector */}
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeBtn, logType === 'meal' && styles.typeBtnActive]}
                onPress={() => setLogType('meal')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={18}
                  color={logType === 'meal' ? '#FFF' : Colors.textSecondary}
                />
                <Text style={[styles.typeBtnText, logType === 'meal' && styles.typeBtnTextActive]}>
                  Meal / Food
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, logType === 'workout' && styles.typeBtnActive]}
                onPress={() => setLogType('workout')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="fitness-outline"
                  size={18}
                  color={logType === 'workout' ? '#FFF' : Colors.textSecondary}
                />
                <Text style={[styles.typeBtnText, logType === 'workout' && styles.typeBtnTextActive]}>
                  Workout
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name / Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {logType === 'meal' ? 'Meal Name' : 'Workout Name'}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={logType === 'meal' ? 'e.g. Breakfast Platter' : 'e.g. Morning Run'}
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                onSubmitEditing={() => caloriesRef.current?.focus()}
              />
            </View>

            {/* Calories Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {logType === 'meal' ? 'Calories Consumed (kcal)' : 'Calories Burned (kcal)'}
              </Text>
              <TextInput
                ref={caloriesRef}
                style={styles.textInput}
                placeholder="e.g. 450"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={5}
                value={calories}
                onChangeText={(t) => {
                  setCalories(t);
                }}
                returnKeyType={logType === 'meal' ? 'next' : 'done'}
                onSubmitEditing={() => {
                  if (logType === 'meal') {
                    proteinRef.current?.focus();
                  } else {
                    handleSubmit();
                  }
                }}
              />
            </View>

            {/* Macronutrient Inputs (Shown for Meal logs) */}
            {logType === 'meal' && (
              <View style={styles.macroInputsRow}>
                {/* Protein */}
                <View style={styles.macroInputCol}>
                  <Text style={styles.macroLabelText}>Protein (g)</Text>
                  <TextInput
                    ref={proteinRef}
                    style={styles.macroInput}
                    placeholder="25"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    maxLength={4}
                    value={protein}
                    onChangeText={(t) => {
                      setProtein(t);
                    }}
                    returnKeyType="next"
                    onSubmitEditing={() => carbsRef.current?.focus()}
                  />
                </View>

                {/* Carbs */}
                <View style={styles.macroInputCol}>
                  <Text style={styles.macroLabelText}>Carbs (g)</Text>
                  <TextInput
                    ref={carbsRef}
                    style={styles.macroInput}
                    placeholder="50"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    maxLength={4}
                    value={carbs}
                    onChangeText={(t) => {
                      setCarbs(t);
                    }}
                    returnKeyType="next"
                    onSubmitEditing={() => fatRef.current?.focus()}
                  />
                </View>

                {/* Fat */}
                <View style={styles.macroInputCol}>
                  <Text style={styles.macroLabelText}>Fat (g)</Text>
                  <TextInput
                    ref={fatRef}
                    style={styles.macroInput}
                    placeholder="12"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    maxLength={4}
                    value={fat}
                    onChangeText={setFat}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {logType === 'meal' ? 'Log Meal' : 'Log Workout'}
                </Text>
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
    maxHeight: '88%',
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
  },
  typeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
  },
  typeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  macroInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  macroInputCol: {
    flex: 1,
  },
  macroLabelText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  macroInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
