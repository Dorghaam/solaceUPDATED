import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Fetch Supabase URL and Anon Key from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This error will be caught during development if the keys are missing.
  // In a production build, these should always be present.
  console.error("Supabase URL or Anon Key is missing. Check .env configuration.");
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