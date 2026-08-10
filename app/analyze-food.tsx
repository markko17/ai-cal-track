import Colors from '@/constants/colors';
import {
  AIFoodAnalysisResult,
  analyzeFoodImageWithGemini,
} from '@/services/geminiService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AnalyzeFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string; base64Data?: string }>();
  const imageUri = params.imageUri;
  const base64Data = params.base64Data;

  // Step statuses: 'pending' | 'loading' | 'completed'
  const [step1Status, setStep1Status] = useState<'pending' | 'loading' | 'completed'>('loading');
  const [step2Status, setStep2Status] = useState<'pending' | 'loading' | 'completed'>('pending');
  const [step3Status, setStep3Status] = useState<'pending' | 'loading' | 'completed'>('pending');

  const [aiResult, setAiResult] = useState<AIFoodAnalysisResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function runAnalysis() {
      // Step 1: Analyzing food image features (1.2s delay for visual feedback)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (!isMounted) return;

      setStep1Status('completed');
      setStep2Status('loading');

      // Step 2: Query Gemini AI Model for nutrition JSON data
      const result = await analyzeFoodImageWithGemini(imageUri, base64Data);
      if (!isMounted) return;

      setAiResult(result);
      setStep2Status('completed');
      setStep3Status('loading');

      // Step 3: Finalize results & prepare response data
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!isMounted) return;

      setStep3Status('completed');
    }

    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, [imageUri, base64Data]);

  const isAllCompleted = step1Status === 'completed' && step2Status === 'completed' && step3Status === 'completed';

  const handleContinue = () => {
    if (!isAllCompleted || !aiResult) return;

    // Navigate to log-food-detail with AI response data
    router.push({
      pathname: '/log-food-detail',
      params: {
        foodName: aiResult.foodName,
        servingSize: aiResult.servingSize,
        calories: String(aiResult.calories),
        protein: String(aiResult.protein),
        carbs: String(aiResult.carbs),
        fat: String(aiResult.fat),
      },
    } as any);
  };

  const renderStepIndicator = (status: 'pending' | 'loading' | 'completed') => {
    if (status === 'completed') {
      return (
        <View style={styles.completedIconWrapper}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>
      );
    }
    if (status === 'loading') {
      return (
        <View style={styles.loadingIconWrapper}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      );
    }
    return (
      <View style={styles.pendingIconWrapper}>
        <Ionicons name="ellipse-outline" size={22} color="#D1D5DB" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Big Heading Title Below Back Button */}
        <Text style={styles.bigScreenTitle}>Analyzing Food</Text>

        {/* Square Image Display Container */}
        <View style={styles.squareImageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.squareImage} resizeMode="cover" />
          ) : (
            <View style={styles.squareImagePlaceholder}>
              <Ionicons name="fast-food-outline" size={60} color="#9CA3AF" />
              <Text style={styles.placeholderImageText}>No image selected</Text>
            </View>
          )}

          {/* Overlay Status Badge */}
          <View style={styles.imageOverlayBadge}>
            <Ionicons
              name={isAllCompleted ? 'sparkles' : 'sync-outline'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.imageOverlayBadgeText}>
              {isAllCompleted ? 'Analysis Complete' : 'AI Scanning...'}
            </Text>
          </View>
        </View>

        {/* 3-Step Progress Indicators */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsSectionTitle}>Processing Details</Text>

          {/* Step 1: Analyzing food */}
          <View style={styles.stepRow}>
            {renderStepIndicator(step1Status)}
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, step1Status === 'completed' && styles.stepTitleCompleted]}>
                Analyzing food
              </Text>
              <Text style={styles.stepSubtitle}>
                Detecting food items & ingredients from photo
              </Text>
            </View>
          </View>

          <View style={styles.stepConnectorLine} />

          {/* Step 2: Getting Nutrition data */}
          <View style={styles.stepRow}>
            {renderStepIndicator(step2Status)}
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, step2Status === 'completed' && styles.stepTitleCompleted]}>
                Getting Nutrition data
              </Text>
              <Text style={styles.stepSubtitle}>
                Calculating calories, protein, carbs & fat breakdown
              </Text>
            </View>
          </View>

          <View style={styles.stepConnectorLine} />

          {/* Step 3: Getting final result */}
          <View style={styles.stepRow}>
            {renderStepIndicator(step3Status)}
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, step3Status === 'completed' && styles.stepTitleCompleted]}>
                Getting final result
              </Text>
              <Text style={styles.stepSubtitle}>
                Generating nutrition breakdown & logging recommendation
              </Text>
            </View>
          </View>
        </View>

        {/* AI Detected Result Card */}
        {isAllCompleted && aiResult ? (
          <View style={styles.resultCard}>
            <View style={styles.resultCardHeader}>
              <View style={styles.sparkleIconBg}>
                <Ionicons name="sparkles" size={18} color="#10B981" />
              </View>
              <View style={styles.resultCardTextCol}>
                <Text style={styles.detectedLabel}>Detected Dish (Tap to edit):</Text>
                <TextInput
                  style={styles.resultDishNameInput}
                  value={aiResult.foodName}
                  onChangeText={(text) =>
                    setAiResult((prev) => (prev ? { ...prev, foodName: text } : prev))
                  }
                  placeholder="Dish name"
                  placeholderTextColor="#047857"
                />
                <Text style={styles.resultServingText}>{aiResult.servingSize}</Text>
              </View>
              <View style={styles.resultCalBadge}>
                <Ionicons name="flame" size={13} color="#10B981" />
                <Text style={styles.resultCalText}>{aiResult.calories} kcal</Text>
              </View>
            </View>

            <View style={styles.resultMacroRow}>
              <View style={styles.macroPill}>
                <Text style={styles.macroPillLabel}>Protein</Text>
                <Text style={styles.macroPillVal}>{aiResult.protein}g</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroPillLabel}>Carbs</Text>
                <Text style={styles.macroPillVal}>{aiResult.carbs}g</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroPillLabel}>Fat</Text>
                <Text style={styles.macroPillVal}>{aiResult.fat}g</Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer Continue Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            !isAllCompleted && styles.continueBtnDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isAllCompleted}
          activeOpacity={0.8}
        >
          {!isAllCompleted ? (
            <View style={styles.btnLoadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.continueBtnText}>Analyzing Food...</Text>
            </View>
          ) : (
            <Text style={styles.continueBtnText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bigScreenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  squareImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  squareImage: {
    width: '100%',
    height: '100%',
  },
  squareImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderImageText: {
    marginTop: 10,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageOverlayBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  stepsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  completedIconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  stepTitleCompleted: {
    color: '#0F172A',
  },
  stepSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  stepConnectorLine: {
    width: 2,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginLeft: 13,
    marginVertical: 4,
  },
  resultCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sparkleIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCardTextCol: {
    flex: 1,
  },
  detectedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resultDishNameInput: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  resultDishName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  resultServingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    marginTop: 3,
  },
  resultCalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resultCalText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },
  resultMacroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  macroPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  macroPillVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginTop: 2,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  continueBtn: {
    backgroundColor: '#111827',
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
