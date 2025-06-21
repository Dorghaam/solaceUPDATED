import { useUserStore } from '@/store/userStore';
import { supabase } from './supabaseClient';

/**
 * Fetches the user's profile from the 'profiles' table and updates the Zustand store.
 * This should be called after the user has been authenticated.
 * @param userId The ID of the authenticated user.
 */
export const fetchAndSetUserProfile = async (userId: string) => {
  console.log('profileService: Fetching profile for user ID:', userId);
  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .select(`username, subscription_tier`)
      .eq('id', userId)
      .single();

    if (error && status !== 406) {
      throw error;
    }

    if (data) {
      console.log('profileService: Profile found. Database tier:', data.subscription_tier);
      
      // Update the username if it exists in the profile
      if (data.username) {
        const { setUserName } = useUserStore.getState();
        setUserName(data.username);
      }
      
      // Note: subscription_tier is read-only on client now, managed by webhooks
      console.log('profileService: Subscription tier from DB (read-only):', data.subscription_tier);
      
    } else {
        console.warn('profileService: No profile found for user.');
        // Profile will be created by webhook when subscription events occur
    }
  } catch (error: any) {
    console.error('profileService: Error fetching user profile:', error.message);
    
    // Profile fetch failed - subscription tier managed by RevenueCat + webhooks anyway
    console.warn('profileService: Profile fetch failed, but subscription tier is managed independently');
  }
};

// Legacy retry logic removed - now using centralized subscriptionSyncService 