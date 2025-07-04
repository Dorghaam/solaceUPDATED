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
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      console.log('profileService: Profile found.');
      
      if (data.full_name) {
        useUserStore.getState().setUserName(data.full_name);
      }
      
    } else {
        console.warn('profileService: No profile found for user.');
        // Profile will be created by webhook when subscription events occur
    }

    // Load user's favorites from database after profile is loaded
    try {
      console.log('profileService: Loading user favorites from database...');
      const { loadFavoritesFromDatabase } = useUserStore.getState();
      await loadFavoritesFromDatabase();
    } catch (favoriteError) {
      console.error('profileService: Failed to load favorites, but continuing:', favoriteError);
    }
    
  } catch (error: any) {
    console.error('profileService: Error fetching user profile:', error.message);
    
    // Profile fetch failed - subscription tier managed by RevenueCat + webhooks anyway
    console.warn('profileService: Profile fetch failed, but subscription tier is managed independently');
    
    // Still try to load favorites even if profile fetch failed
    try {
      console.log('profileService: Attempting to load favorites despite profile error...');
      const { loadFavoritesFromDatabase } = useUserStore.getState();
      await loadFavoritesFromDatabase();
    } catch (favoriteError) {
      console.error('profileService: Failed to load favorites:', favoriteError);
    }
  }
};

// Legacy retry logic removed - now using centralized subscriptionSyncService 