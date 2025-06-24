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
 * Analytics function to get aggregated onboarding stats
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
        completed_at
      `);

    if (error) throw error;

    // Process analytics data
    const analytics = {
      totalUsers: data.length,
      ageDistribution: {},
      genderDistribution: {},
      discoverySourceDistribution: {},
      // Add more analytics as needed
    };

    // Count distributions
    data.forEach(user => {
      if (user.age_range) {
        analytics.ageDistribution[user.age_range] = (analytics.ageDistribution[user.age_range] || 0) + 1;
      }
      if (user.gender) {
        analytics.genderDistribution[user.gender] = (analytics.genderDistribution[user.gender] || 0) + 1;
      }
      if (user.discovery_source) {
        analytics.discoverySourceDistribution[user.discovery_source] = (analytics.discoverySourceDistribution[user.discovery_source] || 0) + 1;
      }
    });

    return analytics;
  } catch (error) {
    console.error('[OnboardingService] Failed to get analytics:', error);
    throw error;
  }
}; 