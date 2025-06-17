import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Design System Constants
export const COLORS = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Secondary Colors
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  
  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Semantic Colors
  background: '#f8fafc',
  surface: '#ffffff',
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
  },
  
  // Gradients
  gradients: {
    primary: ['#0ea5e9', '#0284c7'],
    secondary: ['#d946ef', '#c026d3'],
    success: ['#22c55e', '#16a34a'],
    warning: ['#f59e0b', '#d97706'],
    error: ['#ef4444', '#dc2626'],
    dark: ['#1e293b', '#0f172a'],
    ocean: ['#667eea', '#764ba2'],
    sunset: ['#ff9a9e', '#fecfef'],
    forest: ['#56ab2f', '#a8e6cf'],
    royal: ['#667eea', '#764ba2'],
  },
};

export const TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    bold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const LAYOUT = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  isLargeDevice: width >= 414,
  headerHeight: Platform.OS === 'ios' ? 88 : 64,
  tabBarHeight: Platform.OS === 'ios' ? 83 : 56,
};

// Animation Constants
export const ANIMATIONS = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Common Styles
export const COMMON_STYLES = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  
  button: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  input: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  
  text: {
    primary: {
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.text.primary,
      fontFamily: TYPOGRAPHY.fontFamily.regular,
    },
    secondary: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
      fontFamily: TYPOGRAPHY.fontFamily.regular,
    },
    heading: {
      fontSize: TYPOGRAPHY.fontSize['2xl'],
      color: COLORS.text.primary,
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  LAYOUT,
  ANIMATIONS,
  COMMON_STYLES,
};