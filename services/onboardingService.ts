import { supabase } from './supabaseClient';

export interface OnboardingData {
  user_id: string;
  age_range?: string;
  gender?: string;
  relationship_status?: string;
  spiritual_preference?: string;
  growth_focus?: string;
  healing_goals?: string;
  affirmation_familiarity?: 'new' | 'occasional' | 'regular';
  discovery_source?: string;
  selected_struggle?: string; // NEW: Step 3 data
  focus_areas?: string[]; // NEW: Step 4 data (array of focus area IDs)
  completed_at?: string;
}

/**
 * Saves onboarding data to the database
 * Uses UPSERT to handle both new users and updates
 */
export const saveOnboardingData = async (data: Partial<OnboardingData>) => {
  try {
    console.log('[OnboardingService] Saving onboarding data:', data);
    
    const { data: result, error } = await supabase
      .from('onboarding_data')
      .upsert({
        ...data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id' // Update if user already exists
      })
      .select();

    if (error) {
      console.error('[OnboardingService] Error saving onboarding data:', error);
      throw error;
    }

    console.log('[OnboardingService] Successfully saved onboarding data:', result);
    return result;
  } catch (error) {
    console.error('[OnboardingService] Failed to save onboarding data:', error);
    throw error;
  }
};

/**
 * Retrieves onboarding data for a user
 */
export const getOnboardingData = async (userId: string): Promise<OnboardingData | null> => {
  try {
    console.log('[OnboardingService] Fetching onboarding data for user:', userId);
    
    const { data, error } = await supabase
      .from('onboarding_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - this is normal for new users
        console.log('[OnboardingService] No onboarding data found for user');
        return null;
      }
      throw error;
    }

    console.log('[OnboardingService] Retrieved onboarding data:', data);
    return data;
  } catch (error) {
    console.error('[OnboardingService] Failed to get onboarding data:', error);
    throw error;
  }
};

/**
 * Updates specific fields in onboarding data
 */
export const updateOnboardingField = async (userId: string, field: keyof OnboardingData, value: any) => {
  try {
    console.log(`[OnboardingService] Updating ${field} for user ${userId}:`, value);
    
    const { data, error } = await supabase
      .from('onboarding_data')
      .upsert({
        user_id: userId,
        [field]: value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error(`[OnboardingService] Error updating ${field}:`, error);
      throw error;
    }

    console.log(`[OnboardingService] Successfully updated ${field}:`, data);
    return data;
  } catch (error) {
    console.error(`[OnboardingService] Failed to update ${field}:`, error);
    throw error;
  }
};

/**
 * Marks onboarding as completed with all collected data
 */
export const completeOnboarding = async (userId: string, onboardingData: Partial<OnboardingData>) => {
  try {
    console.log('[OnboardingService] Completing onboarding with data:', onboardingData);
    
    const { data, error } = await supabase
      .from('onboarding_data')
      .upsert({
        user_id: userId,
        ...onboardingData,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('[OnboardingService] Error completing onboarding:', error);
      throw error;
    }

    console.log('[OnboardingService] Successfully completed onboarding:', data);
    return data;
  } catch (error) {
    console.error('[OnboardingService] Failed to complete onboarding:', error);
    throw error;
  }
};

/**
 * Comprehensive analytics function to get aggregated onboarding stats
 * (For admin/analytics dashboard)
 */
export const getOnboardingAnalytics = async () => {
  try {
    const { data, error } = await supabase
      .from('onboarding_data')
      .select(`
        age_range,
        gender,
        relationship_status,
        spiritual_preference,
        growth_focus,
        discovery_source,
        selected_struggle,
        focus_areas,
        healing_goals,
        affirmation_familiarity,
        completed_at
      `);

    if (error) throw error;

    // Process analytics data
    const analytics = {
      totalUsers: data.length,
      completionRate: data.filter(user => user.completed_at).length / data.length * 100,
      
      // Demographics
      ageDistribution: {},
      genderDistribution: {},
      relationshipStatusDistribution: {},
      spiritualPreferenceDistribution: {},
      
      // New onboarding insights
      strugglesDistribution: {},
      focusAreasDistribution: {},
      
      // Engagement metrics
      discoverySourceDistribution: {},
      affirmationFamiliarityDistribution: {},
      
      // Goals analysis
      healingGoalsCount: data.filter(user => user.healing_goals).length,
      avgHealingGoalLength: 0,
      
      // Completion patterns
      completionsByMonth: {},
      
      // Combined insights
      mostCommonCombinations: {
        relationshipAndStruggle: {},
        spiritualAndFocus: {},
      }
    };

    // Process each user's data
    data.forEach(user => {
      // Basic demographics
      if (user.age_range) {
        analytics.ageDistribution[user.age_range] = (analytics.ageDistribution[user.age_range] || 0) + 1;
      }
      if (user.gender) {
        analytics.genderDistribution[user.gender] = (analytics.genderDistribution[user.gender] || 0) + 1;
      }
      if (user.relationship_status) {
        analytics.relationshipStatusDistribution[user.relationship_status] = (analytics.relationshipStatusDistribution[user.relationship_status] || 0) + 1;
      }
      if (user.spiritual_preference) {
        analytics.spiritualPreferenceDistribution[user.spiritual_preference] = (analytics.spiritualPreferenceDistribution[user.spiritual_preference] || 0) + 1;
      }

      // New onboarding data
      if (user.selected_struggle) {
        analytics.strugglesDistribution[user.selected_struggle] = (analytics.strugglesDistribution[user.selected_struggle] || 0) + 1;
      }
      
      if (user.focus_areas && Array.isArray(user.focus_areas)) {
        user.focus_areas.forEach(area => {
          analytics.focusAreasDistribution[area] = (analytics.focusAreasDistribution[area] || 0) + 1;
        });
      }

      // Other metrics
      if (user.discovery_source) {
        analytics.discoverySourceDistribution[user.discovery_source] = (analytics.discoverySourceDistribution[user.discovery_source] || 0) + 1;
      }
      if (user.affirmation_familiarity) {
        analytics.affirmationFamiliarityDistribution[user.affirmation_familiarity] = (analytics.affirmationFamiliarityDistribution[user.affirmation_familiarity] || 0) + 1;
      }

      // Goals analysis
      if (user.healing_goals) {
        analytics.avgHealingGoalLength += user.healing_goals.length;
      }

      // Completion patterns
      if (user.completed_at) {
        const month = new Date(user.completed_at).toISOString().substring(0, 7);
        analytics.completionsByMonth[month] = (analytics.completionsByMonth[month] || 0) + 1;
      }

      // Combined insights
      if (user.relationship_status && user.selected_struggle) {
        const key = `${user.relationship_status} → ${user.selected_struggle}`;
        analytics.mostCommonCombinations.relationshipAndStruggle[key] = (analytics.mostCommonCombinations.relationshipAndStruggle[key] || 0) + 1;
      }
      
      if (user.spiritual_preference && user.focus_areas && Array.isArray(user.focus_areas)) {
        user.focus_areas.forEach(area => {
          const key = `${user.spiritual_preference} → ${area}`;
          analytics.mostCommonCombinations.spiritualAndFocus[key] = (analytics.mostCommonCombinations.spiritualAndFocus[key] || 0) + 1;
        });
      }
    });

    // Calculate average healing goal length
    if (analytics.healingGoalsCount > 0) {
      analytics.avgHealingGoalLength = Math.round(analytics.avgHealingGoalLength / analytics.healingGoalsCount);
    }

    return analytics;
  } catch (error) {
    console.error('[OnboardingService] Failed to get analytics:', error);
    throw error;
  }
};

/**
 * Get top insights from onboarding data
 */
export const getOnboardingInsights = async () => {
  try {
    const analytics = await getOnboardingAnalytics();
    
    // Find top patterns
    const topStruggle = Object.entries(analytics.strugglesDistribution)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    const topFocusAreas = Object.entries(analytics.focusAreasDistribution)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3);
    
    const topRelationshipStatus = Object.entries(analytics.relationshipStatusDistribution)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];

    return {
      userCount: analytics.totalUsers,
      completionRate: Math.round(analytics.completionRate),
      
      // Key insights
      topStruggle: topStruggle ? { struggle: topStruggle[0], count: topStruggle[1] } : null,
      topFocusAreas: topFocusAreas.map(([area, count]) => ({ area, count })),
      topRelationshipStatus: topRelationshipStatus ? { status: topRelationshipStatus[0], count: topRelationshipStatus[1] } : null,
      
      // Engagement metrics
      usersWithGoals: analytics.healingGoalsCount,
      avgGoalLength: analytics.avgHealingGoalLength,
      
      // Full analytics for detailed view
      fullAnalytics: analytics
    };
  } catch (error) {
    console.error('[OnboardingService] Failed to get insights:', error);
    throw error;
  }
}; 