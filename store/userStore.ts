import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// --- Types ---
export type FamiliarityAffirmations = 'new' | 'occasional' | 'regular' | null;
export type NotificationFrequency = '1x' | '3x' | '5x' | '10x' | null;
export type SubscriptionTier = 'unknown' | 'free' | 'premium'; // Added subscription tier with unknown state

export interface NotificationSettings {
  enabled: boolean;
  frequency: NotificationFrequency;
  // time?: string; // Consider if specific time selection is needed later
}

export interface DailyMood {
  emoji: string;
  mood: string;
  date: string; // YYYY-MM-DD
}

export interface TargetQuote {
  id: string;
  text: string;
  category?: string;
}

// Define the shape of a quote
export interface Quote {
  id: string;
  text: string;
  category?: string;
}

// NEW: Breakup-specific categories with premium flag - UPDATED to match database
export interface BreakupCategory {
  id: string;
  label: string;
  premium: boolean; // True if this category requires a premium subscription
}

export const breakupInterestCategories: BreakupCategory[] = [
  { id: 'general_healing', label: 'General Healing', premium: false }, // Free
  { id: 'moving_on', label: 'Moving On', premium: false }, // Free
  { id: 'moving_forward', label: 'Moving Forward', premium: false }, // Free - matches DB
  { id: 'self_love', label: 'Self-Love', premium: false }, // Free - matches DB
  { id: 'self_love_discovery', label: 'Self-Love & Discovery', premium: true },
  { id: 'coping_loneliness', label: 'Coping with Loneliness', premium: true },
  { id: 'overcoming_loneliness', label: 'Overcoming Loneliness', premium: true }, // matches DB
  { id: 'rebuilding_confidence', label: 'Rebuilding Confidence', premium: true },
  { id: 'managing_anger_resentment', label: 'Managing Anger/Resentment', premium: true },
  { id: 'finding_closure', label: 'Finding Closure', premium: true },
  { id: 'finding_peace', label: 'Finding Peace', premium: true }, // matches DB
  { id: 'hope_future', label: 'Hope for the Future', premium: true }, // matches DB
  { id: 'healing_from_betrayal', label: 'Healing from Betrayal (Cheating)', premium: true },
  { id: 'loss_of_partner_widow', label: 'Loss of a Partner (Widow/Widower)', premium: true },
  { id: 'navigating_divorce', label: 'Navigating Divorce', premium: true },
  { id: 'heartbreak_recovery', label: 'Heartbreak Recovery', premium: true },
  { id: 'letting_go_of_ex', label: 'Letting Go of an Ex', premium: true },
  { id: 'letting_go', label: 'Letting Go', premium: true }, // matches DB
  { id: 'letting_go_acceptance', label: 'Letting Go & Acceptance', premium: true }, // matches DB
  { id: 'embracing_single_life', label: 'Embracing Single Life', premium: true },
  { id: 'overcoming_codependency', label: 'Overcoming Codependency', premium: true },
  { id: 'gratitude_reflection', label: 'Gratitude & Reflection', premium: true }, // matches DB
];


export interface WidgetSettings {
  category: BreakupCategory['id'] | 'favorites' | 'all'; // Can be a specific category ID, 'favorites', or 'all'
  theme: WidgetTheme;
}

export type WidgetTheme = 'light' | 'dark' | 'pink_text_on_white' | 'dark_text_on_pink';

// --- State ---
interface UserState {
  // Onboarding & Profile
  userName: string | null;
  hasCompletedOnboarding: boolean;
  affirmationFamiliarity: FamiliarityAffirmations;
  interestCategories: string[]; // Stores IDs of selected BreakupCategory
  activeQuoteCategory: string | null; // ID of the currently active category for the feed

  // Authentication
  supabaseUser: any | null; // Consider using Supabase User type if available

  // Quotes
  quotes: Quote[];
  isLoading: boolean;
  fetchQuotesTimeout: number | null; // For debouncing fetchQuotes calls

  // App Features
  favoriteQuoteIds: string[];
  notificationSettings: NotificationSettings | null;
  pushToken: string | null;
  dailyMood: DailyMood | null;
  targetQuote: TargetQuote | null; // For handling notification navigations

  // Widget Settings
  widgetSettings: WidgetSettings;
  isWidgetCustomizing: boolean; // To control UI on widget config screen

  // Monetization
  subscriptionTier: SubscriptionTier; // Added subscriptionTier

  // Actions
  setUserName: (name: string) => void;
  setHasCompletedOnboarding: (status: boolean) => void;
  setAffirmationFamiliarity: (familiarity: FamiliarityAffirmations) => void;
  toggleInterestCategory: (categoryId: string) => void;
  setInterestCategories: (categoryIds: string[]) => void; // For setting all at once if needed
  setActiveQuoteCategory: (categoryId: string | null) => void;

  setSupabaseUser: (user: any | null) => void;

  // Quote actions
  fetchQuotes: () => Promise<void>;
  setQuotes: (quotes: Quote[]) => void;
  setIsLoading: (loading: boolean) => void;

  addFavorite: (quoteId: string) => void;
  removeFavorite: (quoteId: string) => void;
  loadFavoritesFromDatabase: () => Promise<void>;
  syncFavoritesToDatabase: () => Promise<void>;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setPushToken: (token: string | null) => void;
  setDailyMood: (mood: DailyMood) => void;
  setTargetQuote: (quote: TargetQuote | null) => void;
  clearTargetQuote: () => void;

  setWidgetSettings: (settings: Partial<WidgetSettings>) => void;
  setIsWidgetCustomizing: (isCustomizing: boolean) => void;

  setSubscriptionTier: (tier: SubscriptionTier) => void; // Added action for subscription tier

  resetState: () => void;
  
  // Authentication helpers
  isAuthenticated: () => boolean;
  isFullyOnboarded: () => boolean;
}

// --- Store ---
const initialState = {
  // Onboarding & Profile
  userName: null,
  hasCompletedOnboarding: false,
  affirmationFamiliarity: null,
  interestCategories: [breakupInterestCategories.find(cat => !cat.premium)?.id || 'general_healing'], // Default to the first free category
  activeQuoteCategory: null, // No active category by default, shows all (or all from selected free)

  // Auth
  supabaseUser: null,

  // Quotes
  quotes: [] as Quote[],
  isLoading: false,
  fetchQuotesTimeout: null,

  // App Features
  favoriteQuoteIds: [],
  notificationSettings: {
    enabled: false,
    frequency: '3x' as NotificationFrequency,
  },
  pushToken: null,
  dailyMood: null,
  targetQuote: null,

  // Widget Settings
  widgetSettings: {
    category: 'all', // Default to 'all' breakup quotes for widget
    theme: 'light' as WidgetTheme,
  },
  isWidgetCustomizing: false, // Default to not customizing

  // Monetization - SAFE: Start as unknown, will be determined by RevenueCat
  subscriptionTier: 'unknown' as SubscriptionTier, // Safe default until RC confirms
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Actions ---
      setUserName: (name) => set({ userName: name }),
      setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
      setAffirmationFamiliarity: (familiarity) => set({ affirmationFamiliarity: familiarity }),
      toggleInterestCategory: (categoryId) =>
        set((state) => ({
          interestCategories: state.interestCategories.includes(categoryId)
            ? state.interestCategories.filter((id) => id !== categoryId)
            : [...state.interestCategories, categoryId],
        })),
      setInterestCategories: (categoryIds) => set({ interestCategories: categoryIds }),
      setActiveQuoteCategory: (categoryId) => set({ activeQuoteCategory: categoryId }),

      setSupabaseUser: (user) => set({ supabaseUser: user }),

      fetchQuotes: async () => {
        const { supabase } = await import('../services/supabaseClient');
        const state = get();
        
        set({ isLoading: true, quotes: [] }); // Clear previous quotes while loading
        try {
          let query = supabase
            .from('quotes')
            .select('id, text, category');

          // --- NEW SIMPLIFIED LOGIC ---
          if (state.activeQuoteCategory) {
            // If a category is selected, fetch ONLY from that category.
            console.log(`Fetching quotes for single active category: ${state.activeQuoteCategory}`);
            query = query.eq('category', state.activeQuoteCategory);
          } else {
                      // If NO category is selected (default state), fetch from all available categories.
          console.log('No active category. Fetching default quotes based on subscription tier.');
          console.log('[FetchQuotes] Current subscription tier:', state.subscriptionTier);
          
          // Treat 'unknown' as 'free' until RevenueCat confirms otherwise
          const effectiveTier = state.subscriptionTier === 'premium' ? 'premium' : 'free';
          console.log('[FetchQuotes] Effective tier for fetching:', effectiveTier);
          
          if (effectiveTier === 'free') {
            const freeCategoryIds = breakupInterestCategories
              .filter(c => !c.premium)
              .map(c => c.id);
            console.log('User is free/unknown, fetching from categories:', freeCategoryIds);
            query = query.in('category', freeCategoryIds);
          } else {
            console.log('User is premium, fetching from all categories');
          }
            // For premium users with no active category, the query remains unfiltered to fetch from ALL categories.
          }
          // --- END OF NEW LOGIC ---

          console.log('[FetchQuotes] Executing Supabase query...');
          const { data, error } = await query.limit(50);

          const logData: any = { dataCount: data?.length };
          if (error) {
            logData.error = error.message;
          }
          console.log('[FetchQuotes] Supabase response:', logData);

          if (error) {
            console.error('[FetchQuotes] Supabase error:', error);
            throw error;
          }

          if (!data || data.length === 0) {
            console.warn('[FetchQuotes] No quotes returned from database');
            set({ 
              quotes: [{ id: 'no-quotes', text: "No quotes found. Please check your internet connection or try again." }], 
              isLoading: false 
            });
            return;
          }

          const shuffledQuotes = [...data].sort(() => Math.random() - 0.5);
          console.log('[FetchQuotes] Successfully fetched and shuffled', shuffledQuotes.length, 'quotes');
          set({ quotes: shuffledQuotes, isLoading: false });

        } catch (error: any) {
          console.error('Failed to fetch quotes:', error.message);
          set({ 
            quotes: [{ id: 'error', text: "Could not load affirmations. Please try again." }], 
            isLoading: false 
          });
        }
      },

      setQuotes: (quotes) => set({ quotes }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      addFavorite: (quoteId) => {
        const state = get();
        if (state.favoriteQuoteIds.includes(quoteId)) {
          return; // Already favorited
        }
        
        // Update local state immediately
        set((state) => ({
          favoriteQuoteIds: [...state.favoriteQuoteIds, quoteId],
        }));
        
        // Save to database in background
        if (state.supabaseUser?.id) {
          import('../services/favoritesService').then(({ saveFavoriteToDatabase }) => {
            saveFavoriteToDatabase(state.supabaseUser.id, quoteId).catch(error => {
              console.error('Failed to save favorite to database:', error);
              // Could show a toast notification here
            });
          });
        }
      },
      
      removeFavorite: (quoteId) => {
        const state = get();
        
        // Update local state immediately
        set((state) => ({
          favoriteQuoteIds: state.favoriteQuoteIds.filter((id) => id !== quoteId),
        }));
        
        // Remove from database in background
        if (state.supabaseUser?.id) {
          import('../services/favoritesService').then(({ removeFavoriteFromDatabase }) => {
            removeFavoriteFromDatabase(state.supabaseUser.id, quoteId).catch(error => {
              console.error('Failed to remove favorite from database:', error);
              // Could show a toast notification here
            });
          });
        }
      },

      loadFavoritesFromDatabase: async () => {
        const state = get();
        if (!state.supabaseUser?.id) {
          console.log('[UserStore] No user ID, skipping favorites load');
          return;
        }

        try {
          const { loadFavoritesFromDatabase } = await import('../services/favoritesService');
          const favoriteIds = await loadFavoritesFromDatabase(state.supabaseUser.id);
          
          console.log(`[UserStore] Loaded ${favoriteIds.length} favorites from database`);
          set({ favoriteQuoteIds: favoriteIds });
        } catch (error) {
          console.error('[UserStore] Failed to load favorites from database:', error);
        }
      },

      syncFavoritesToDatabase: async () => {
        const state = get();
        if (!state.supabaseUser?.id || state.favoriteQuoteIds.length === 0) {
          console.log('[UserStore] No user ID or no local favorites, skipping sync');
          return;
        }

        try {
          const { syncLocalFavoritesToDatabase } = await import('../services/favoritesService');
          await syncLocalFavoritesToDatabase(state.supabaseUser.id, state.favoriteQuoteIds);
          console.log('[UserStore] Successfully synced favorites to database');
        } catch (error) {
          console.error('[UserStore] Failed to sync favorites to database:', error);
        }
      },

      setNotificationSettings: (settingsUpdate) =>
        set((state) => ({
          notificationSettings: {
            ...(state.notificationSettings || { enabled: false, frequency: '3x' }), // Ensure defaults
            ...settingsUpdate,
          } as NotificationSettings, // Type assertion
        })),
      setPushToken: (token) => set({ pushToken: token }),
      setDailyMood: (mood) => set({ dailyMood: mood }),
      setTargetQuote: (quote) => set({ targetQuote: quote }),
      clearTargetQuote: () => set({ targetQuote: null }),

      setWidgetSettings: (settingsUpdate) =>
        set((state) => ({
          widgetSettings: {
            ...state.widgetSettings,
            ...settingsUpdate,
          },
        })),
      setIsWidgetCustomizing: (isCustomizing) => set({ isWidgetCustomizing: isCustomizing }),

      setSubscriptionTier: (tier) => {
        const currentTier = get().subscriptionTier;
        console.log(`[UserStore] Subscription tier update: ${currentTier} → ${tier}`);
        
        set({ subscriptionTier: tier });
        
        // Auto-refetch quotes when subscription tier changes to ensure UI updates
        // Add debouncing to prevent rapid calls during login
        if (currentTier !== tier && tier !== 'unknown') {
          console.log('[UserStore] Subscription tier changed, refetching quotes...');
          
          // Clear any existing timeout
          const state = get();
          if (state.fetchQuotesTimeout) {
            clearTimeout(state.fetchQuotesTimeout);
          }
          
          // Set new timeout with longer delay to allow RevenueCat to settle
          const timeoutId = setTimeout(() => {
            console.log('[UserStore] Executing debounced fetchQuotes after tier change');
            get().fetchQuotes();
          }, 500); // Increased from 100ms to 500ms
          
          set({ fetchQuotesTimeout: timeoutId });
        }
      },

      resetState: () => {
        console.log('UserStore: Resetting state to initial values.');
        
        // Clear any pending fetchQuotes timeout
        const state = get();
        if (state.fetchQuotesTimeout) {
          clearTimeout(state.fetchQuotesTimeout);
        }
        
        set(initialState);
      },

      // Authentication helpers
      isAuthenticated: () => !!get().supabaseUser,
      isFullyOnboarded: () => get().hasCompletedOnboarding,
    }),
    {
      name: 'solace-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Partialize to persist only specific parts of the state
      partialize: (state) => ({
        userName: state.userName,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        affirmationFamiliarity: state.affirmationFamiliarity,
        interestCategories: state.interestCategories,
        // supabaseUser is handled by Supabase client persistence
        favoriteQuoteIds: state.favoriteQuoteIds,
        notificationSettings: state.notificationSettings,
        // pushToken is often re-fetched
        dailyMood: state.dailyMood,
        widgetSettings: state.widgetSettings,
        isWidgetCustomizing: state.isWidgetCustomizing,
        // REMOVED: subscriptionTier - Let RevenueCat be the single source of truth
        // activeQuoteCategory and targetQuote are typically transient
        // quotes and isLoading are also transient
      }),
      // Custom hydration logic if needed
      onRehydrateStorage: () => async (state) => {
        console.log('UserStore: Hydration starts.');
        if (state) {
          // Ensure critical defaults if hydration somehow misses them
          state.widgetSettings = state.widgetSettings || initialState.widgetSettings;
          state.notificationSettings = state.notificationSettings || initialState.notificationSettings;
          state.interestCategories = state.interestCategories && state.interestCategories.length > 0 ? state.interestCategories : initialState.interestCategories;
          state.isWidgetCustomizing = state.isWidgetCustomizing !== undefined ? state.isWidgetCustomizing : initialState.isWidgetCustomizing;
          
          // ALWAYS start with 'unknown' - RevenueCat will update this
          state.subscriptionTier = 'unknown';
          console.log('UserStore: Subscription tier reset to unknown for RevenueCat to determine');
          
          // Reset transient quote state
          state.quotes = [];
          state.isLoading = false;
          
          console.log('UserStore: Hydration complete, state:', {
            userName: state.userName,
            hasCompletedOnboarding: state.hasCompletedOnboarding,
            subscriptionTier: state.subscriptionTier,
            interestCategories: state.interestCategories,
            isWidgetCustomizing: state.isWidgetCustomizing,
          });
        } else {
          console.log('UserStore: Hydration - no persisted state found, using initial state.');
        }
      },
    }
  )
);

// --- Hooks for easy access ---
// export const useUserName = () => useUserStore((state) => state.userName);
// export const useIsOnboardingComplete = () => useUserStore((state) => state.hasCompletedOnboarding);
// ... add more specific hooks if needed for performance critical components