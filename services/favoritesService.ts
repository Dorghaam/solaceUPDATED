import { supabase } from './supabaseClient';

/**
 * Service for managing user favorites in Supabase database
 */

export interface UserFavorite {
  user_id: string;
  quote_id: string;
  created_at: string;
}

/**
 * Lookup a quote ID by its text (fallback for widget modal)
 */
export const lookupQuoteIdByText = async (quoteText: string): Promise<string | null> => {
  try {
    console.log(`[FavoritesService] Looking up quote ID for text: "${quoteText.substring(0, 50)}..."`);
    
    const { data, error } = await supabase
      .from('quotes')
      .select('id')
      .eq('text', quoteText)
      .limit(1);

    if (error) {
      console.error('[FavoritesService] Error looking up quote ID:', error);
      return null;
    }

    if (data && data.length > 0) {
      console.log(`[FavoritesService] Found quote ID: ${data[0].id}`);
      return data[0].id;
    }

    console.log('[FavoritesService] No quote found with matching text');
    return null;
  } catch (error) {
    console.error('[FavoritesService] Failed to lookup quote ID:', error);
    return null;
  }
};

/**
 * Save a favorite quote to the database for the current user
 */
export const saveFavoriteToDatabase = async (userId: string, quoteId: string): Promise<void> => {
  try {
    console.log(`[FavoritesService] Saving favorite ${quoteId} for user ${userId}`);
    
    const { error } = await supabase
      .from('user_favorites')
      .insert({ 
        user_id: userId, 
        quote_id: quoteId,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[FavoritesService] Error saving favorite to database:', error);
      throw error;
    }

    console.log(`[FavoritesService] Successfully saved favorite ${quoteId}`);
  } catch (error) {
    console.error('[FavoritesService] Failed to save favorite to database:', error);
    throw error;
  }
};

/**
 * Remove a favorite quote from the database for the current user
 */
export const removeFavoriteFromDatabase = async (userId: string, quoteId: string): Promise<void> => {
  try {
    console.log(`[FavoritesService] Removing favorite ${quoteId} for user ${userId}`);
    
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('quote_id', quoteId);

    if (error) {
      console.error('[FavoritesService] Error removing favorite from database:', error);
      throw error;
    }

    console.log(`[FavoritesService] Successfully removed favorite ${quoteId}`);
  } catch (error) {
    console.error('[FavoritesService] Failed to remove favorite from database:', error);
    throw error;
  }
};

/**
 * Load all favorite quote IDs for the current user from the database
 */
export const loadFavoritesFromDatabase = async (userId: string): Promise<string[]> => {
  try {
    console.log(`[FavoritesService] Loading favorites for user ${userId}`);
    
    const { data, error } = await supabase
      .from('user_favorites')
      .select('quote_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // Most recent first

    if (error) {
      console.error('[FavoritesService] Error loading favorites from database:', error);
      throw error;
    }

    const favoriteIds = data?.map(item => item.quote_id) || [];
    console.log(`[FavoritesService] Loaded ${favoriteIds.length} favorites for user ${userId}`);
    
    return favoriteIds;
  } catch (error) {
    console.error('[FavoritesService] Failed to load favorites from database:', error);
    // Return empty array on error to allow app to continue functioning
    return [];
  }
};

/**
 * Sync local favorites to database (used when user logs in or after local changes)
 * This handles the case where user had favorites locally but they weren't synced to database
 */
export const syncLocalFavoritesToDatabase = async (userId: string, localFavoriteIds: string[]): Promise<void> => {
  try {
    console.log(`[FavoritesService] Syncing ${localFavoriteIds.length} local favorites to database for user ${userId}`);
    
    if (localFavoriteIds.length === 0) {
      console.log('[FavoritesService] No local favorites to sync');
      return;
    }

    // Get existing favorites from database
    const existingFavorites = await loadFavoritesFromDatabase(userId);
    
    // Find favorites that exist locally but not in database
    const favoritesToAdd = localFavoriteIds.filter(id => !existingFavorites.includes(id));
    
    if (favoritesToAdd.length === 0) {
      console.log('[FavoritesService] All local favorites already exist in database');
      return;
    }

    // Insert missing favorites
    const favoritesToInsert = favoritesToAdd.map(quoteId => ({
      user_id: userId,
      quote_id: quoteId,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('user_favorites')
      .insert(favoritesToInsert);

    if (error) {
      console.error('[FavoritesService] Error syncing local favorites to database:', error);
      throw error;
    }

    console.log(`[FavoritesService] Successfully synced ${favoritesToAdd.length} local favorites to database`);
  } catch (error) {
    console.error('[FavoritesService] Failed to sync local favorites to database:', error);
    throw error;
  }
};

/**
 * Create user_favorites table (this would typically be done via Supabase dashboard or migrations)
 * This is provided for reference/documentation
 */
export const createUserFavoritesTableSQL = `
-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quote_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_quote_id ON user_favorites(quote_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);
`; 