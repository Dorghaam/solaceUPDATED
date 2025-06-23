// constants/theme.ts

export const theme = {
  colors: {
    background: '#FDF8F6', // The soft, warm off-white from the design
    text: '#2D2D2D',        // Dark grey for primary text - excellent readability
    textSecondary: '#6B6B6B', // Medium grey for secondary text
    primary: '#F48FB1',       // Brighter warm pink for buttons - vibrant and cute
    primaryDark: '#E91E63',   // Deeper bright pink for pressed states
    primaryLight: '#FCE4EC',  // Light pink for subtle accents
    accent: '#FF4081',        // Bright pink accent for highlights
    white: '#FFFFFF',
    black: '#000000',

    // Full Primary Palette (bright warm pink-based)
    primaryPalette: {
      50: '#FCE4EC',
      100: '#F8BBD9',
      200: '#F48FB1',
      300: '#F06292',
      400: '#EC407A',
      500: '#E91E63', // Main bright pink
      600: '#D81B60',
      700: '#C2185B',
      800: '#AD1457',
      900: '#880E4F',
    },

    // Gradient colors - original pink gradient (restored to original)
    lightPink: {
      lightest: '#FFF5F7',    // Original lightest pink
      light: '#FFE8ED',       // Original light pink  
      medium: '#FFD1DC',      // Original medium pink
      dark: '#FFC0CB',        // Original dark pink
      accent: '#E91E63',      // Main bright pink accent
    },
    
    // Category card backgrounds - bright pink toned palette
    categoryColors: {
      purple: '#F48FB1',      // Use pink theme instead of purple
      teal: '#E0F2F1',        // Soft mint with pink undertone
      orange: '#FFF3E0',      // Soft warm peach (brighter)
      blue: '#E3F2FD',        // Soft blue (brighter)
      green: '#E8F5E8',       // Soft green (brighter)
      pink: '#FCE4EC',        // Primary bright pink
      coral: '#FFEBEE',       // Soft coral pink (brighter)
      lavender: '#F3E5F5',    // Bright pink-lavender
    }
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 40,
  },
  radii: {
    s: 5,
    m: 12,
    l: 24,
    full: 9999,
  },
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      semiBold: 'Inter-SemiBold',
    },
    fontSizes: {
      xs: 12,
      s: 14,
      m: 16,
      l: 24,
      xl: 32,
    },
  },
} as const; // 'as const' makes the theme object deeply readonly 