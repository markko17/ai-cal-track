import {
  FatSecretFoodItem,
  searchFatSecretFoods,
} from '@/services/fatsecretService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FoodDatabaseScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [results, setResults] = useState<FatSecretFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchSeqRef = useRef(0);

  // Debounced search logic when searchQuery >= 3 chars or activeFilter is set
  const performSearch = useCallback(async (query: string, filter: string, seqId: number) => {
    const trimmed = query.trim();

    setIsLoading(true);

    // If query is short but a specific filter is active, provide default category results
    if (trimmed.length < 3) {
      let filteredData: FatSecretFoodItem[] = [];
      if (filter === 'High Protein') {
        const data = await searchFatSecretFoods('chicken');
        filteredData = data.filter((item) => item.protein >= 15);
      } else if (filter === 'Low Carb') {
        const data = await searchFatSecretFoods('egg');
        filteredData = data.filter((item) => item.carbs <= 10);
      } else if (filter === 'Breakfast') {
        const data = await searchFatSecretFoods('egg');
        filteredData = data;
      } else if (filter === 'Snacks') {
        const data = await searchFatSecretFoods('yogurt');
        filteredData = data;
      }

      if (seqId !== searchSeqRef.current) return;
      setResults(filteredData);
      setIsLoading(false);
      return;
    }

    try {
      const data = await searchFatSecretFoods(trimmed);
      if (seqId !== searchSeqRef.current) return;

      let filteredData = data;

      if (filter === 'High Protein') {
        const hp = data.filter((item) => item.protein >= 12);
        filteredData = hp.length > 0 ? hp : data;
      } else if (filter === 'Low Carb') {
        const lc = data.filter((item) => item.carbs <= 12);
        filteredData = lc.length > 0 ? lc : data;
      } else if (filter === 'Breakfast') {
        const b = data.filter((item) =>
          /egg|oat|yogurt|bread|pancake|toast|coffee|bacon|waffle|bagel/i.test(item.food_name)
        );
        filteredData = b.length > 0 ? b : data;
      } else if (filter === 'Snacks') {
        const s = data.filter((item) =>
          /yogurt|apple|banana|nut|almond|shake|bar|fruit|snack|cookie/i.test(item.food_name)
        );
        filteredData = s.length > 0 ? s : data;
      }

      setResults(filteredData);
    } catch (err) {
      if (seqId !== searchSeqRef.current) return;
      console.error('Error during food search:', err);
      setResults([]);
    } finally {
      if (seqId === searchSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const seqId = ++searchSeqRef.current;
    const timer = setTimeout(() => {
      performSearch(searchQuery, activeFilter, seqId);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, performSearch]);

  const handleSelectFood = (item: FatSecretFoodItem) => {
    router.push({
      pathname: '/log-food-detail',
      params: {
        foodName: item.food_name,
        servingSize: item.serving_size,
        calories: String(item.calorie_number),
        protein: String(item.protein || 0),
        carbs: String(item.carbs || 0),
        fat: String(item.fat || 0),
      },
    } as any);
  };

  const handleFilterPress = (filterName: string) => {
    setActiveFilter(filterName);
  };

  const renderFoodCard = ({ item }: { item: FatSecretFoodItem }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectFood(item)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.food_name}`}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.foodName} numberOfLines={1}>
            {item.food_name}
          </Text>
          <Text style={styles.servingText} numberOfLines={1}>
            {item.serving_size}
          </Text>

          {/* Macro breakdown pills */}
          <View style={styles.macroPillRow}>
            <View style={[styles.macroPill, { backgroundColor: '#F1F5F9' }]}>
              <Text style={[styles.macroPillText, { color: '#0F172A' }]}>
                P: {item.protein || 0}g
              </Text>
            </View>
            <View style={[styles.macroPill, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.macroPillText, { color: '#1D4ED8' }]}>
                C: {item.carbs || 0}g
              </Text>
            </View>
            <View style={[styles.macroPill, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.macroPillText, { color: '#B45309' }]}>
                F: {item.fat || 0}g
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={styles.calorieBadge}>
            <Ionicons name="flame-outline" size={14} color="#EF4444" />
            <Text style={styles.calorieBadgeText}>{item.calories}</Text>
          </View>

          <View style={styles.addButton}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.mainWrapper}>
          {/* Top Navigation Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.verifiedTag}>
              <Ionicons name="sparkles" size={12} color="#10B981" />
              <Text style={styles.verifiedTagText}>FatSecret Database</Text>
            </View>
          </View>

          {/* Heading Title */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>search food</Text>
            <Text style={styles.headerSub}>
              Search 100,000+ verified foods & recipes
            </Text>
          </View>

          {/* Elevated Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#94A3B8"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search egg, chicken, oats, rice..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Horizontal Filter Chips */}
          <View style={styles.filterWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {(['All', 'High Protein', 'Low Carb', 'Low Fat', 'Snacks'] as string[]).map((filter: string) => {
                const isActive = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                    ]}
                    onPress={() => handleFilterPress(filter)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Results Section */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0F172A" />
              <Text style={styles.statusText}>Searching database...</Text>
            </View>
          ) : searchQuery.trim().length < 3 && activeFilter === 'All' ? (
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="search" size={32} color="#64748B" />
              </View>
              <Text style={styles.placeholderTitle}>Discover 100k+ Foods</Text>
              <Text style={styles.placeholderSub}>
                Type at least 3 characters or select a quick filter above to search.
              </Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="nutrition-outline" size={32} color="#64748B" />
              </View>
              <Text style={styles.placeholderTitle}>No Foods Found</Text>
              <Text style={styles.placeholderSub}>
                {`No results found for "${searchQuery}". Try searching another item.`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.food_id}
              renderItem={renderFoodCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  mainWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  headerSection: {
    marginTop: 10,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'lowercase',
    letterSpacing: -0.6,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterWrapper: {
    marginBottom: 16,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  servingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  macroPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  macroPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  calorieBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
