import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Fetch Supabase URL and Anon Key from app.json extra config
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // This error will be caught during development if the keys are missing.
  // In a production build, these should always be present.
  console.error("Supabase URL or Anon Key is missing. Check .env and app.json configuration.");
  // Potentially throw an error to halt app execution if this is critical at startup
  // throw new Error("Supabase credentials are not configured.");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for session persistence in React Native
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native, disable URL session detection
  },
}); 