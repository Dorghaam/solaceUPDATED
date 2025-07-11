import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import MMKVStorage from 'react-native-mmkv-storage';

// Initialize MMKV Storage
const storage = new MMKVStorage.Loader().initialize();

const zustandStorage = createJSONStorage(() => ({
  setItem: (name, value) => storage.setString(name, value),
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => storage.removeItem(name),
}));

// --- Types ---
export type FamiliarityAffirmations = 'new' | 'occasional' | 'regular' | null;
export type NotificationFrequency = '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x' | null;
export type SubscriptionTier = 'unknown' | 'free' | 'premium'; // Added subscription tier with unknown state

export interface NotificationSettings {
  enabled: boolean;
  frequency: NotificationFrequency;
  selectedCategories?: string[]; // Store selected category IDs for reminders
  customTimeRange?: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
}

export interface DailyMood {
  emoji: string;
  mood: string;
  date: string; // YYYY-MM-DD
}

export interface StreakData {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyActivity: { [key: string]: boolean }; // date -> active
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
  { id: 'hope_for_future', label: 'Hope for Future', premium: true }, // Added missing DB category (10 quotes)
  { id: 'healing_from_betrayal', label: 'Healing from Betrayal (Cheating)', premium: true },
  { id: 'healing_heartbreak', label: 'Healing Heartbreak', premium: true }, // Added missing DB category (23 quotes)
  { id: 'loss_of_partner_widow', label: 'Loss of a Partner (Widow/Widower)', premium: true },
  { id: 'navigating_divorce', label: 'Navigating Divorce', premium: true },
  { id: 'heartbreak_recovery', label: 'Heartbreak Recovery', premium: true },
  { id: 'letting_go_of_ex', label: 'Letting Go of an Ex', premium: true },
  { id: 'letting_go', label: 'Letting Go', premium: true }, // matches DB
  { id: 'letting_go_acceptance', label: 'Letting Go & Acceptance', premium: true }, // matches DB
  { id: 'embracing_single_life', label: 'Embracing Single Life', premium: true },
  { id: 'overcoming_codependency', label: 'Overcoming Codependency', premium: true },
  { id: 'gratitude_reflection', label: 'Gratitude & Reflection', premium: true }, // matches DB
  // For the Hardest Moments section
  { id: 'first_steps_letting_go', label: 'First Steps to Letting Go', premium: true },
  { id: 'when_you_want_to_text_them', label: 'When You Want to Text Them', premium: true },
  { id: 'quieting_the_overthinking', label: 'Quieting the Overthinking', premium: true },
  { id: 'when_it_hurts_to_see_them_move_on', label: 'When It Hurts to See Them Move On', premium: true },
  { id: 'its_okay_to_feel_the_pain', label: 'It\'s Okay to Feel the Pain', premium: true },
  // Returning to You section
  { id: 'remembering_your_worth', label: 'Remembering Your Worth', premium: true },
  { id: 'finding_your_spark_again', label: 'Finding Your Spark Again', premium: true },
  { id: 'forgiving_for_your_freedom', label: 'Forgiving for Your Freedom', premium: true },
  // Her Next Chapter section
  { id: 'protecting_your_peace', label: 'Protecting Your Peace', premium: true },
  { id: 'attract_dont_chase', label: 'Attract, Don\'t Chase', premium: true },
  { id: 'becoming_that_girl', label: 'Becoming That Girl', premium: true },
  { id: 'trusting_the_journey', label: 'Trusting the Journey', premium: true },
  { id: 'ready_for_healthy_love', label: 'Ready for Healthy Love', premium: true },
];


export interface WidgetSettings {
  category: BreakupCategory['id'] | 'favorites'; // Can be a specific category ID or 'favorites'
  theme: WidgetTheme;
}

export type WidgetTheme = 'light' | 'dark' | 'pink_text_on_white' | 'dark_text_on_pink';

// --- State ---
interface UserState {
  // ✅ FIX: Enhanced app state control for flicker prevention
  hydrated: boolean;
  authChecked: boolean;
  subscriptionInitialized: boolean; // New flag to track when subscription state is reliable
  
  // Onboarding & Profile
  userName: string | null;
  hasCompletedOnboarding: boolean;
  affirmationFamiliarity: FamiliarityAffirmations;
  interestCategories: string[]; // Stores IDs of selected BreakupCategory
  activeQuoteCategory: string | null; // ID of the currently active category for the feed
  
  // Onboarding data (stored locally AND synced to database)
  age: string | null;
  gender: string | null;
  relationshipStatus: string | null;
  spiritualPreference: string | null;
  growthFocus: string | null;
  discoverySource: string | null;
  healingGoals: string | null;
  selectedStruggle: string | null; // NEW: Step 3 data
  focusAreas: string[] | null; // NEW: Step 4 data

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
  streakData: StreakData;
  targetQuote: TargetQuote | null; // For handling notification navigations

  // Widget Settings
  widgetSettings: WidgetSettings;
  isWidgetCustomizing: boolean; // To control UI on widget config screen

  // Monetization
  subscriptionTier: SubscriptionTier; // Added subscriptionTier
  loggingOut: boolean; // Added loggingOut flag

  // Actions
  setUserName: (name: string) => void;
  setHasCompletedOnboarding: (status: boolean) => void;
  setAffirmationFamiliarity: (familiarity: FamiliarityAffirmations) => void;
  toggleInterestCategory: (categoryId: string) => void;
  setInterestCategories: (categoryIds: string[]) => void; // For setting all at once if needed
  setActiveQuoteCategory: (categoryId: string | null) => void;
  
  // Onboarding data actions
  setAge: (age: string) => void;
  setGender: (gender: string) => void;
  setRelationshipStatus: (status: string) => void;
  setSpiritualPreference: (preference: string) => void;
  setGrowthFocus: (focus: string) => void;
  setDiscoverySource: (source: string) => void;
  setHealingGoals: (goals: string) => void;
  setSelectedStruggle: (struggle: string) => void; // NEW: Step 3 setter
  setFocusAreas: (areas: string[]) => void; // NEW: Step 4 setter
  syncOnboardingToDatabase: () => Promise<void>;

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
  updateStreakData: () => void;
  setTargetQuote: (quote: TargetQuote | null) => void;
  clearTargetQuote: () => void;

  setWidgetSettings: (settings: Partial<WidgetSettings>) => void;
  setIsWidgetCustomizing: (isCustomizing: boolean) => void;

  setSubscriptionTier: (tier: SubscriptionTier) => void; // Added action for subscription tier
  setLoggingOut: (loggingOut: boolean) => void; // Added action for loggingOut flag

  // App State Control Actions
  setAuthChecked: (checked: boolean) => void;
  setSubscriptionInitialized: (initialized: boolean) => void; // ✅ FIX: New action for subscription initialization

  resetState: () => void;
  
  // Authentication helpers
  isAuthenticated: () => boolean;
  isFullyOnboarded: () => boolean;
  isAppReady: () => boolean;
}

// --- Store ---
const initialState = {
  // ✅ FIX: Enhanced app state control for flicker prevention
  hydrated: false,
  authChecked: false,
  subscriptionInitialized: false, // Start as false until RevenueCat provides reliable data
  
  // Onboarding & Profile
  userName: null,
  hasCompletedOnboarding: false,
  affirmationFamiliarity: null,
  interestCategories: [breakupInterestCategories.find(cat => !cat.premium)?.id || 'general_healing'], // Default to the first free category
  activeQuoteCategory: null, // No active category by default, shows all (or all from selected free)
  
  // Onboarding data
  age: null,
  gender: null,
  relationshipStatus: null,
  spiritualPreference: null,
  growthFocus: null,
  discoverySource: null,
  healingGoals: null,
  selectedStruggle: null, // NEW: Step 3 data
  focusAreas: null, // NEW: Step 4 data

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
    selectedCategories: [], // Store selected category IDs for reminders persistence
  },
  pushToken: null,
  dailyMood: null,
  streakData: {
    currentStreak: 0,
    lastActiveDate: '',
    dailyActivity: {},
  },
  targetQuote: null,

  // Widget Settings
  widgetSettings: {
    category: 'general_healing', // Default to general healing for widget
    theme: 'light' as WidgetTheme,
  },
  isWidgetCustomizing: false, // Default to not customizing

  // Monetization - SAFE: Start as unknown, will be determined by RevenueCat
  subscriptionTier: 'unknown' as SubscriptionTier, // Safe default until RC confirms
  loggingOut: false, // Added loggingOut flag
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

      // Onboarding data actions
      setAge: (age) => set({ age }),
      setGender: (gender) => set({ gender }),
      setRelationshipStatus: (status) => set({ relationshipStatus: status }),
      setSpiritualPreference: (preference) => set({ spiritualPreference: preference }),
      setGrowthFocus: (focus) => set({ growthFocus: focus }),
      setDiscoverySource: (source) => set({ discoverySource: source }),
      setHealingGoals: (goals) => set({ healingGoals: goals }),
      setSelectedStruggle: (struggle) => set({ selectedStruggle: struggle }), // NEW: Step 3 setter
      setFocusAreas: (areas) => set({ focusAreas: areas }), // NEW: Step 4 setter
      
      syncOnboardingToDatabase: async () => {
        const state = get();
        if (!state.supabaseUser?.id) {
          console.log('[UserStore] No user ID, skipping onboarding sync');
          return;
        }

        // Check if we have any onboarding data to sync
        const hasOnboardingData = state.age || state.gender || state.relationshipStatus || 
          state.spiritualPreference || state.growthFocus || state.discoverySource || 
          state.healingGoals || state.affirmationFamiliarity || state.selectedStruggle || 
          state.focusAreas;

        if (!hasOnboardingData) {
          console.log('[UserStore] No onboarding data to sync');
          return;
        }

        try {
          const { saveOnboardingData } = await import('../services/onboardingService');
          await saveOnboardingData({
            user_id: state.supabaseUser.id,
            age_range: state.age,
            gender: state.gender,
            relationship_status: state.relationshipStatus,
            spiritual_preference: state.spiritualPreference,
            growth_focus: state.growthFocus,
            discovery_source: state.discoverySource,
            healing_goals: state.healingGoals,
            affirmation_familiarity: state.affirmationFamiliarity,
            selected_struggle: state.selectedStruggle, // NEW: Step 3 data
            focus_areas: state.focusAreas, // NEW: Step 4 data
          });
          console.log('[UserStore] Successfully synced onboarding data to database');
        } catch (error) {
          console.error('[UserStore] Failed to sync onboarding data:', error);
          
          // 🔄 RETRY MECHANISM: Schedule retry after 30 seconds for failed syncs
          setTimeout(() => {
            console.log('[UserStore] Retrying onboarding sync...');
            get().syncOnboardingToDatabase().catch(e => 
              console.log('[UserStore] Retry also failed:', e)
            );
          }, 30000);
        }
      },

      setSupabaseUser: (user) => {
        set({ supabaseUser: user });
        
        // Automatically sync onboarding data when user is authenticated
        if (user?.id) {
          const currentState = get();
          // Only sync if we have some onboarding data
          const hasOnboardingData = currentState.age || currentState.gender || 
            currentState.relationshipStatus || currentState.spiritualPreference || 
            currentState.growthFocus || currentState.discoverySource || 
            currentState.healingGoals || currentState.affirmationFamiliarity || 
            currentState.selectedStruggle || currentState.focusAreas;
          
          if (hasOnboardingData) {
            console.log('[UserStore] User authenticated, syncing onboarding data...');
            // Use setTimeout to avoid blocking the UI
            setTimeout(() => {
              currentState.syncOnboardingToDatabase();
            }, 100);
          }
        }
      },

      fetchQuotes: async () => {
        const { supabase } = await import('../services/supabaseClient');
        const state = get();
        
        set({ isLoading: true });

        try {
          let query = supabase
            .from('quotes')
            .select('id, text, category');

          // --- EXISTING LOGIC ---
          if (state.activeQuoteCategory === 'favorites') {
            // Special handling for favorites category
            console.log('Fetching favorite quotes and user affirmations');
            if (state.favoriteQuoteIds.length === 0) {
              console.log('No favorite quotes found');
              set({ 
                quotes: [{ id: 'no-favorites', text: "You haven't added any favorites yet. Heart some quotes to see them here!" }], 
                isLoading: false 
              });
              return;
            }
            
            // Fetch both regular quotes and user affirmations for favorites
            const [quotesResponse, affirmationsResponse] = await Promise.all([
              supabase
                .from('quotes')
                .select('id, text, category')
                .in('id', state.favoriteQuoteIds),
              supabase
                .from('user_affirmations')
                .select('id, text, created_at')
                .in('id', state.favoriteQuoteIds)
            ]);

            if (quotesResponse.error) {
              console.error('Error fetching favorite quotes:', quotesResponse.error);
            }
            if (affirmationsResponse.error) {
              console.error('Error fetching favorite user affirmations:', affirmationsResponse.error);
            }

            // Combine results
            const mappedAffirmations = (affirmationsResponse.data || []).map(item => ({
              id: item.id,
              text: item.text,
              category: 'My Affirmations'
            }));
            
            const allFavorites = (quotesResponse.data || []).concat(mappedAffirmations);

            if (allFavorites.length === 0) {
              console.warn('No favorite content found');
              set({ 
                quotes: [{ id: 'no-favorites', text: "Your favorites will appear here once you heart some quotes or affirmations!" }], 
                isLoading: false 
              });
              return;
            }

            // Sort to maintain order based on favoriteQuoteIds (most recent first)
            const sortedFavorites = allFavorites.sort((a, b) => {
              const aIndex = state.favoriteQuoteIds.indexOf(a.id);
              const bIndex = state.favoriteQuoteIds.indexOf(b.id);
              return aIndex - bIndex;
            });

            console.log('[FetchQuotes] Successfully fetched', sortedFavorites.length, 'favorite items (quotes + affirmations)');
            set({ quotes: sortedFavorites, isLoading: false });
            return;
          } else if (state.activeQuoteCategory) {
            // If a category is selected, fetch ONLY from that category.
            console.log(`Fetching quotes for single active category: ${state.activeQuoteCategory}`);
            query = query.eq('category', state.activeQuoteCategory);
          } else {
            // If NO category is selected (default state), fetch from all available categories.
            console.log('No active category. Fetching default quotes based on subscription tier.');
            console.log('[FetchQuotes] Current subscription tier:', state.subscriptionTier);
            
            // ✅ FIX: Enhanced tier logic with subscription initialization guard
            let effectiveTier: 'free' | 'premium';
            if (!state.subscriptionInitialized) {
              // If subscription not initialized, be conservative and assume free
              effectiveTier = 'free';
              console.log('[FetchQuotes] Subscription not initialized, using conservative free tier');
            } else {
              // Use actual tier once subscription is initialized
              effectiveTier = state.subscriptionTier === 'premium' ? 'premium' : 'free';
              console.log('[FetchQuotes] Using initialized tier:', effectiveTier);
            }
            
            if (effectiveTier === 'free') {
              const freeCategoryIds = breakupInterestCategories
                .filter(c => !c.premium)
                .map(c => c.id);
              console.log('User is free/unknown, fetching from categories:', freeCategoryIds);
              query = query.in('category', freeCategoryIds);
            } else {
              console.log('User is premium, fetching from all categories');
            }
          }

          console.log('[FetchQuotes] Executing Supabase query...');
          
          // Apply different limits based on fetch type
          let queryWithLimit;
          if (state.activeQuoteCategory && state.activeQuoteCategory !== 'favorites') {
            // For specific categories, fetch ALL quotes available
            console.log(`[FetchQuotes] Fetching ALL quotes for category: ${state.activeQuoteCategory}`);
            queryWithLimit = query; // No limit for specific categories
          } else {
            // For "all categories" view, use a reasonable limit to avoid performance issues
            console.log('[FetchQuotes] Fetching with limit for general view');
            queryWithLimit = query.limit(100); // Increased from 50 to 100 for general view
          }
          
          const { data, error } = await queryWithLimit;

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

          let finalQuotes;
          if (state.activeQuoteCategory === 'favorites') {
            // For favorites, maintain order based on favoriteQuoteIds (most recent first)
            finalQuotes = data.sort((a, b) => {
              const aIndex = state.favoriteQuoteIds.indexOf(a.id);
              const bIndex = state.favoriteQuoteIds.indexOf(b.id);
              return aIndex - bIndex;
            });
            console.log('[FetchQuotes] Successfully fetched', finalQuotes.length, 'favorite quotes in order');
          } else {
            // For regular categories, shuffle the quotes
            finalQuotes = [...data].sort(() => Math.random() - 0.5);
            console.log('[FetchQuotes] Successfully fetched and shuffled', finalQuotes.length, 'quotes');
          }
          
          set({ quotes: finalQuotes, isLoading: false });

        } catch (error: any) {
          console.error('Failed to fetch quotes:', error.message);
          
          // Show error message
          set({ 
            quotes: [{ id: 'error', text: "Could not load affirmations. Please check your internet connection and try again." }], 
            isLoading: false 
          });
        }
      },

      setQuotes: (quotes) => set({ quotes }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      addFavorite: (quoteId) => {
        const state = get();
        
        // Prevent adding placeholder quotes to favorites
        const placeholderIds = ['no-favorites', 'no-quotes', 'error'];
        if (placeholderIds.includes(quoteId)) {
          console.log(`[UserStore] Ignoring favorite action for placeholder quote: ${quoteId}`);
          return;
        }
        
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

        // ✅ No fetchQuotes call. UI can get favourites
        //    by filtering quotes from state or via selector
        
        // Optional: If you genuinely need to refresh from Supabase, use debounced refresh:
        // import debounce from 'lodash.debounce';
        // const refreshFavorites = debounce(() => get().fetchQuotes(), 1000);
        // if (state.activeQuoteCategory === 'favorites') refreshFavorites();
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

        // ✅ Still no fetchQuotes call
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
            ...(state.notificationSettings || { enabled: false, frequency: '3x', selectedCategories: [] }), // Ensure defaults
            ...settingsUpdate,
          } as NotificationSettings, // Type assertion
        })),
      setPushToken: (token) => set({ pushToken: token }),
      setDailyMood: (mood) => set({ dailyMood: mood }),
              updateStreakData: () => {
          const state = get();
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          // If already marked active today, don't update
          if (state.streakData.dailyActivity[today]) {
            return;
          }
          
          // Mark today as active
          const newDailyActivity = {
            ...state.streakData.dailyActivity,
            [today]: true
          };
          
          let newStreak: number;
          
          // Calculate streak
          if (state.streakData.lastActiveDate === yesterday || state.streakData.lastActiveDate === '') {
            // Continue streak or start new one
            newStreak = state.streakData.currentStreak + 1;
          } else {
            // Streak broken, restart
            newStreak = 1;
          }
          
          set({
            streakData: {
              currentStreak: newStreak,
              lastActiveDate: today,
              dailyActivity: newDailyActivity,
            }
          });
          
          console.log(`🔥 Streak updated: ${newStreak} days`);
        },
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
        
        // Note: Quote fetching will now be handled by consolidated initialization
        // Remove auto-refetch to prevent duplicate calls during startup
      },

      setLoggingOut: (loggingOut) => set({ loggingOut }),

      // App State Control Actions
      setAuthChecked: (checked) => {
        console.log(`[UserStore] Auth checked: ${checked}`);
        set({ authChecked: checked });
      },

      setSubscriptionInitialized: (initialized) => {
        console.log(`[UserStore] Subscription initialized: ${initialized}`);
        set({ subscriptionInitialized: initialized });
      },

      resetState: () => {
        console.log('UserStore: Starting state reset...');
        
        try {
          // Clear any pending fetchQuotes timeout
          const state = get();
          if (state.fetchQuotesTimeout) {
            clearTimeout(state.fetchQuotesTimeout);
            console.log('UserStore: Cleared fetchQuotes timeout');
          }
          
          // Reset to initial state but keep critical app state flags
          const newState = {
            ...initialState,
            hydrated: state.hydrated, // Keep hydrated state
            authChecked: true, // Keep auth as checked (we just processed a logout)
            subscriptionInitialized: false, // Reset subscription state on logout
          };
          
          console.log('UserStore: Applying state reset...');
          set(newState);
          console.log('UserStore: State reset completed successfully');
          
        } catch (error) {
          console.error('UserStore: Error during state reset:', error);
          
          // Fallback: try to reset critical fields only
          try {
            console.log('UserStore: Attempting fallback state reset...');
            set({
              supabaseUser: null,
              hasCompletedOnboarding: false,
              subscriptionTier: 'unknown',
              quotes: [],
              favoriteQuoteIds: [],
              authChecked: true,
              subscriptionInitialized: false, // Reset subscription initialization
            });
            console.log('UserStore: Fallback state reset completed');
          } catch (fallbackError) {
            console.error('UserStore: Fallback state reset failed:', fallbackError);
          }
        }
      },

      // Authentication helpers
      isAuthenticated: () => !!get().supabaseUser,
      isFullyOnboarded: () => get().hasCompletedOnboarding,
      isAppReady: () => {
        const state = get();
        return state.hydrated && state.authChecked;
      },
    }),
    {
      name: 'solace-user-storage',
      storage: zustandStorage,
      // Partialize to persist only specific parts of the state
      partialize: (state) => ({
        userName: state.userName,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        affirmationFamiliarity: state.affirmationFamiliarity,
        interestCategories: state.interestCategories,
        // Onboarding data for instant personalization
        age: state.age,
        gender: state.gender,
        relationshipStatus: state.relationshipStatus,
        spiritualPreference: state.spiritualPreference,
        growthFocus: state.growthFocus,
        discoverySource: state.discoverySource,
        healingGoals: state.healingGoals,
        selectedStruggle: state.selectedStruggle, // NEW: Step 3 data
        focusAreas: state.focusAreas, // NEW: Step 4 data
        // supabaseUser is handled by Supabase client persistence
        favoriteQuoteIds: state.favoriteQuoteIds,
        notificationSettings: state.notificationSettings,
        // pushToken is often re-fetched
        dailyMood: state.dailyMood,
        streakData: state.streakData,
        widgetSettings: state.widgetSettings,
        isWidgetCustomizing: state.isWidgetCustomizing,
        subscriptionTier: state.subscriptionTier, // ✅ NOW PERSISTED - RevenueCat will update this via listener
        // subscriptionInitialized is NOT persisted - should reset on each app launch for fresh RevenueCat data
        // activeQuoteCategory and targetQuote are typically transient
        // quotes and isLoading are also transient
      }),
      // Custom hydration logic if needed
      onRehydrateStorage: () => (state) => {
        console.log('UserStore: Hydration starts.');
        
        if (state) {
          // Ensure critical defaults if hydration somehow misses them
          state.widgetSettings = state.widgetSettings || initialState.widgetSettings;
          state.notificationSettings = state.notificationSettings || initialState.notificationSettings;
          state.interestCategories = state.interestCategories && state.interestCategories.length > 0 ? state.interestCategories : initialState.interestCategories;
          state.isWidgetCustomizing = state.isWidgetCustomizing !== undefined ? state.isWidgetCustomizing : initialState.isWidgetCustomizing;
          
          // ✅ KEEP PERSISTED SUBSCRIPTION TIER - Don't reset to 'unknown'
          // Only reset to unknown if it was never set before
          if (!state.subscriptionTier) {
            state.subscriptionTier = 'unknown';
          }

          // ✅ FIX: subscriptionInitialized always starts false to ensure fresh RevenueCat validation
          state.subscriptionInitialized = false;
          
          // Reset transient quote state
          state.quotes = [];
          state.isLoading = false;
          
          // Mark as hydrated
          state.hydrated = true;
          
          console.log('UserStore: Hydration complete. Subscription tier:', state.subscriptionTier);
        } else {
          console.log('UserStore: No persisted state found');
        }
      },
    }
  )
);

// --- Hooks for easy access ---
/**
 * A reactive hook to get the current user's subscription tier.
 * This should be the ONLY way UI components access subscription status.
 */
export const useSubscription = () => {
  return useUserStore(s => s.subscriptionTier);
};

/**
 * ✅ FIX: Hydration guard hook to prevent flicker during app initialization
 * Ensures UI waits for proper hydration + subscription initialization before rendering
 */
export const useHydrationGuard = () => {
  const { hydrated, subscriptionInitialized, authChecked } = useUserStore();
  
  return {
    hydrated,
    subscriptionInitialized,
    authChecked,
    isAppReady: hydrated && authChecked, // Basic app readiness
    isSubscriptionReady: hydrated && subscriptionInitialized, // Subscription-aware readiness
  };
};

// export const useUserName = () => useUserStore((state) => state.userName);
// export const useIsOnboardingComplete = () => useUserStore((state) => state.hasCompletedOnboarding);
// ... add more specific hooks if needed for performance critical components