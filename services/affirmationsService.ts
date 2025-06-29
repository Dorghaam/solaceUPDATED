import { supabase } from './supabaseClient';

/**
 * Service for managing user affirmations in Supabase database
 */

export interface UserAffirmation {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
}

/**
 * Save a new affirmation to the database for the current user
 */
export const saveAffirmationToDatabase = async (
  userId: string, 
  affirmationText: string
): Promise<UserAffirmation> => {
  try {
    console.log(`[AffirmationsService] Saving affirmation for user ${userId}`);
    
    const { data, error } = await supabase
      .from('user_affirmations')
      .insert({ 
        user_id: userId, 
        text: affirmationText
      })
      .select()
      .single();

    if (error) {
      console.error('[AffirmationsService] Error saving affirmation to database:', error);
      throw error;
    }

    console.log(`[AffirmationsService] Successfully saved affirmation ${data.id}`);
    return data;
  } catch (error) {
    console.error('[AffirmationsService] Failed to save affirmation to database:', error);
    throw error;
  }
};

/**
 * Update an existing affirmation in the database
 */
export const updateAffirmationInDatabase = async (
  userId: string,
  affirmationId: string,
  affirmationText: string
): Promise<UserAffirmation> => {
  try {
    console.log(`[AffirmationsService] Updating affirmation ${affirmationId} for user ${userId}`);
    
    const { data, error } = await supabase
      .from('user_affirmations')
      .update({ 
        text: affirmationText
      })
      .eq('id', affirmationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[AffirmationsService] Error updating affirmation in database:', error);
      throw error;
    }

    console.log(`[AffirmationsService] Successfully updated affirmation ${affirmationId}`);
    return data;
  } catch (error) {
    console.error('[AffirmationsService] Failed to update affirmation in database:', error);
    throw error;
  }
};

/**
 * Delete an affirmation from the database
 */
export const deleteAffirmationFromDatabase = async (userId: string, affirmationId: string): Promise<void> => {
  try {
    console.log(`[AffirmationsService] Deleting affirmation ${affirmationId} for user ${userId}`);
    
    const { error } = await supabase
      .from('user_affirmations')
      .delete()
      .eq('id', affirmationId)
      .eq('user_id', userId);

    if (error) {
      console.error('[AffirmationsService] Error deleting affirmation from database:', error);
      throw error;
    }

    console.log(`[AffirmationsService] Successfully deleted affirmation ${affirmationId}`);
  } catch (error) {
    console.error('[AffirmationsService] Failed to delete affirmation from database:', error);
    throw error;
  }
};

/**
 * Load all affirmations for the current user from the database
 */
export const loadAffirmationsFromDatabase = async (userId: string): Promise<UserAffirmation[]> => {
  try {
    console.log(`[AffirmationsService] Loading affirmations for user ${userId}`);
    
    const { data, error } = await supabase
      .from('user_affirmations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // Most recent first

    if (error) {
      console.error('[AffirmationsService] Error loading affirmations from database:', error);
      throw error;
    }

    const affirmations = data || [];
    console.log(`[AffirmationsService] Loaded ${affirmations.length} affirmations for user ${userId}`);
    
    return affirmations;
  } catch (error) {
    console.error('[AffirmationsService] Failed to load affirmations from database:', error);
    // Return empty array on error to allow app to continue functioning
    return [];
  }
};

/**
 * Get a single affirmation by ID
 */
export const getAffirmationById = async (userId: string, affirmationId: string): Promise<UserAffirmation | null> => {
  try {
    console.log(`[AffirmationsService] Getting affirmation ${affirmationId} for user ${userId}`);
    
    const { data, error } = await supabase
      .from('user_affirmations')
      .select('*')
      .eq('id', affirmationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log(`[AffirmationsService] Affirmation ${affirmationId} not found`);
        return null;
      }
      console.error('[AffirmationsService] Error getting affirmation from database:', error);
      throw error;
    }

    console.log(`[AffirmationsService] Successfully retrieved affirmation ${affirmationId}`);
    return data;
  } catch (error) {
    console.error('[AffirmationsService] Failed to get affirmation from database:', error);
    throw error;
  }
}; 