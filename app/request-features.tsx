import Colors from '@/constants/colors';
import { FeatureRequest, addFeatureRequest, getFeatureRequests, toggleUpvote } from '@/services/featureRequestService';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RequestFeaturesScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFeatures = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await getFeatureRequests();
      setFeatures(data);
    } catch (error) {
      console.error('Failed to fetch features:', error);
      setFetchError('Failed to load feature requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please enter both a title and a description.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to submit a feature request.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addFeatureRequest(title.trim(), description.trim(), user.id);
      setTitle('');
      setDescription('');
      Alert.alert('Success', 'Your feature request has been submitted!');
      fetchFeatures(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to submit the feature request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUpvote = async (featureId: string, currentUpvotes: string[]) => {
    if (!user?.id) return;
    
    // Optimistic UI update
    const userId = user.id;
    const hasUpvoted = currentUpvotes.includes(userId);
    
    setFeatures(currentFeatures => 
      currentFeatures.map(f => {
        if (f.id === featureId) {
          const newUpvotes = hasUpvoted 
            ? f.upvotes.filter(id => id !== userId)
            : [...f.upvotes, userId];
          return { ...f, upvotes: newUpvotes };
        }
        return f;
      })
    );

    try {
      await toggleUpvote(featureId, userId);
    } catch (error) {
      // Revert on error
      Alert.alert('Error', 'Failed to toggle upvote. Please try again.');
      fetchFeatures();
    }
  };

  const renderFeatureItem = ({ item }: { item: FeatureRequest }) => {
    const hasUpvoted = user?.id ? item.upvotes.includes(user.id) : false;
    const upvoteCount = item.upvotes.length;

    return (
      <View style={styles.featureCard}>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Text style={styles.featureDesc}>{item.description}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.upvoteBtn, hasUpvoted && styles.upvoteBtnActive]}
          onPress={() => handleToggleUpvote(item.id, item.upvotes)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={hasUpvoted ? "thumbs-up" : "thumbs-up-outline"} 
            size={24} 
            color={hasUpvoted ? "#FFFFFF" : Colors.primary} 
          />
          <Text style={[styles.upvoteText, hasUpvoted && styles.upvoteTextActive]}>
            {upvoteCount}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feature Requests</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={features}
          keyExtractor={(item) => item.id}
          renderItem={renderFeatureItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.submitSection}>
              <Text style={styles.sectionTitle}>Suggest a New Feature</Text>
              <TextInput
                style={styles.inputTitle}
                placeholder="Feature Title (e.g., Dark Mode)"
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <TextInput
                style={styles.inputDesc}
                placeholder="Describe how it works and why it would be useful..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Submit Suggestion</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Community Requests</Text>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : fetchError ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={[styles.emptyText, { color: Colors.error, marginBottom: 16 }]}>{fetchError}</Text>
                <TouchableOpacity onPress={fetchFeatures} style={{ padding: 12, backgroundColor: Colors.surface, borderRadius: 8 }}>
                  <Text style={{ color: Colors.primary, fontWeight: '600' }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.emptyText}>No feature requests yet. Be the first to suggest one!</Text>
            )
          }
        />
      </KeyboardAvoidingView>
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  submitSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  inputTitle: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
  },
  inputDesc: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 100,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 40,
    fontSize: 15,
  },
  featureCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
    paddingRight: 16,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  upvoteBtn: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    width: 56,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upvoteBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  upvoteText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  upvoteTextActive: {
    color: '#FFFFFF',
  },
});
