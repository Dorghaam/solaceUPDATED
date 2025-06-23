import { hapticService } from '@/services/hapticService';
import { supabase } from '@/services/supabaseClient';
import { BreakupCategory, breakupInterestCategories, useUserStore, WidgetTheme } from '@/store/userStore';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, NativeModules, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WidgetConfigScreen() {
  const { 
    widgetSettings, 
    setWidgetSettings, 
    subscriptionTier, 
    favoriteQuoteIds,
    userName,
    supabaseUser
  } = useUserStore();

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Initialize with default settings if none exist
    if (!widgetSettings) {
      setWidgetSettings({ category: 'all', theme: 'light' });
    }
  }, [widgetSettings, setWidgetSettings]);

  const handleCategoryChange = (value: string) => {
    hapticService.selection();
    const selectedCategoryInfo = breakupInterestCategories.find(cat => cat.id === value);

    if (selectedCategoryInfo?.premium && subscriptionTier === 'free') {
      Alert.alert(
        "Premium Feature",
        `"${selectedCategoryInfo.label}" is a premium category. Please upgrade to use this topic on your widget.`
      );
      return;
    }
    
    setWidgetSettings({ category: value as any });
  };

  const updateWidgetData = async () => {
    if (!widgetSettings || Platform.OS !== 'ios') {
      if (Platform.OS !== 'ios') {
        Alert.alert("iOS Only", "Widgets are only available on iOS devices.");
      }
      return;
    }

    setIsUpdating(true);
    hapticService.success();

    try {
      let quotesToSend: string[] = [`Hello ${userName || 'User'}! Open Solace to get inspired.`];
      let queryCategory = widgetSettings.category;

      if (queryCategory === 'favorites') {
        // Handle favorites
        if (favoriteQuoteIds.length === 0) {
          quotesToSend = [`Hi ${userName || 'User'}! Add some favorites first to see them in your widget.`];
        } else {
          const { data, error } = await supabase
            .from('quotes')
            .select('text')
            .in('id', favoriteQuoteIds)
            .limit(20);
          
          if (error) throw error;
          if (data && data.length > 0) {
            quotesToSend = data.map(q => q.text);
          }
        }
      } else {
        // Handle category-based quotes
        const categoriesToFetch = queryCategory === 'all' 
          ? breakupInterestCategories
              .filter(c => subscriptionTier === 'premium' || !c.premium)
              .map(c => c.id)
          : [queryCategory];

        const { data, error } = await supabase
          .from('quotes')
          .select('text')
          .in('category', categoriesToFetch)
          .limit(50);
        
        if (error) throw error;
        if (data && data.length > 0) {
          // Shuffle the quotes
          const shuffledQuotes = [...data].sort(() => Math.random() - 0.5);
          quotesToSend = shuffledQuotes.map(q => q.text);
        }
      }

      // Update widget with quotes and user name
      const { WidgetUpdateModule } = NativeModules;
      if (WidgetUpdateModule) {
        await WidgetUpdateModule.updateQuotes(quotesToSend);
        if (userName) {
          await WidgetUpdateModule.updateUserName(userName);
        }
        Alert.alert("Widget Updated!", "Your widget will update with new affirmations.");
      } else {
        throw new Error("Widget module not found");
      }

    } catch (e: any) {
      console.error('Widget update error:', e);
      Alert.alert("Error Updating Widget", e.message || "Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!widgetSettings) return null; // Wait for initialization

  const selectedCategory = breakupInterestCategories.find(c => c.id === widgetSettings.category);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Widget Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Preview Box */}
          <View style={styles.previewSection}>
            <View style={styles.previewBox}>
              <View style={styles.previewWidget}>
                <View style={styles.previewHeader}>
                  <Ionicons name="heart" size={16} color={theme.colors.primary} />
                  <Text style={styles.previewAppName}>Solace</Text>
                </View>
                <Text style={styles.previewQuote}>
                  {selectedCategory ? `${selectedCategory.label} affirmations` : 'All affirmations'}
                </Text>
                <Text style={styles.previewUser}>Hello, {userName || 'User'}</Text>
              </View>
            </View>
            <Text style={styles.previewLabel}>Widget Preview</Text>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Affirmation Topic</Text>
            <Text style={styles.sectionSubtitle}>Choose what type of affirmations to show</Text>
            
            <View style={styles.optionsList}>
              
              {/* All Quotes Option */}
              <TouchableOpacity 
                style={[styles.option, widgetSettings.category === 'all' && styles.selectedOption]}
                onPress={() => handleCategoryChange('all')}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionText, widgetSettings.category === 'all' && styles.selectedOptionText]}>
                    All Quotes
                  </Text>
                  <Text style={styles.optionDescription}>Mix of all available affirmations</Text>
                </View>
                {widgetSettings.category === 'all' && (
                                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>

            {/* Favorites Option */}
            <TouchableOpacity 
              style={[styles.option, widgetSettings.category === 'favorites' && styles.selectedOption]}
              onPress={() => handleCategoryChange('favorites')}
            >
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, widgetSettings.category === 'favorites' && styles.selectedOptionText]}>
                  My Favorites
                </Text>
                <Text style={styles.optionDescription}>
                  Your saved affirmations ({favoriteQuoteIds.length} saved)
                </Text>
              </View>
              {widgetSettings.category === 'favorites' && (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>

              {/* Category Options */}
              {breakupInterestCategories.map(category => {
                const isLocked = category.premium && subscriptionTier === 'free';
                const isSelected = widgetSettings.category === category.id;
                
                return (
                  <TouchableOpacity 
                    key={category.id}
                    style={[
                      styles.option, 
                      isSelected && styles.selectedOption,
                      isLocked && styles.lockedOption
                    ]}
                    onPress={() => handleCategoryChange(category.id)}
                    disabled={isLocked}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionTitleRow}>
                        <Text style={[
                          styles.optionText, 
                          isSelected && styles.selectedOptionText,
                          isLocked && styles.lockedOptionText
                        ]}>
                          {category.label}
                        </Text>
                        {isLocked && <Ionicons name="lock-closed" size={16} color="#999" />}
                      </View>
                      {category.premium && (
                        <Text style={styles.premiumBadge}>Premium</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity 
            style={[styles.updateButton, isUpdating && styles.updatingButton]}
            onPress={updateWidgetData}
            disabled={isUpdating}
          >
            <Text style={styles.updateButtonText}>
              {isUpdating ? 'Updating Widget...' : 'Apply to Widget & Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FDF8F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  previewBox: {
    width: 200,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewWidget: {
    flex: 1,
    justifyContent: 'space-between',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewAppName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  previewQuote: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },
  previewUser: {
    fontSize: 10,
    color: '#999',
  },
  previewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  optionsList: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectedOption: {
    borderColor: '#FF69B4',
    backgroundColor: '#FFF5F8',
  },
  lockedOption: {
    backgroundColor: '#F5F5F5',
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedOptionText: {
    color: theme.colors.primary,
  },
  lockedOptionText: {
    color: '#999',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  premiumBadge: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  updatingButton: {
    backgroundColor: '#FFB3D1',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 