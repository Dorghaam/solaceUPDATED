// constants/theme.ts

export const theme = {
  colors: {
    background: '#FDF8F6', // The soft, warm off-white from the design
    text: '#4B423F',        // A dark, earthy brown for primary text
    textSecondary: '#9E9390', // A lighter, muted brown for secondary text
    primary: '#806A61',       // A muted, elegant primary color for active states
    accent: '#D4A392',         // A soft pink/peach accent for "liked" states
    white: '#FFFFFF',
    black: '#000000',
    // New lighter pink gradient colors
    lightPink: {
      lightest: '#FFF5F7',
      light: '#FFE8ED',
      medium: '#FFD1DC',
      dark: '#FFC0CB',
    },
    // Category card backgrounds
    categoryColors: {
      purple: '#E8D5F0',
      teal: '#B8E6E1',
      orange: '#FFD4A3',
      blue: '#B3D9FF',
      green: '#C8E6C9',
      pink: '#FFD1DC',
      coral: '#FFCCCB',
      lavender: '#E6E6FA',
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