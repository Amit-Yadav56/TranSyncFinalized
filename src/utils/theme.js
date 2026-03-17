// src/utils/theme.js
export const COLORS = {
  // Primary Palette - Deep Navy / Industrial Dark
  background: '#0A0F1E',
  surface: '#111827',
  surfaceElevated: '#1C2333',
  surfaceBorder: '#1E293B',

  // Accent - Amber/Orange (truck/transport feel)
  primary: '#F97316',
  primaryLight: '#FB923C',
  primaryDark: '#EA580C',
  primaryMuted: 'rgba(249,115,22,0.15)',

  // Secondary - Electric Cyan
  secondary: '#06B6D4',
  secondaryMuted: 'rgba(6,182,212,0.12)',

  // Status Colors
  success: '#10B981',
  successMuted: 'rgba(16,185,129,0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245,158,11,0.12)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239,68,68,0.12)',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textInverse: '#0A0F1E',

  // Gradients
  gradientPrimary: ['#F97316', '#EA580C'],
  gradientDark: ['#111827', '#0A0F1E'],
  gradientCard: ['#1C2333', '#111827'],
};

export const FONTS = {
  // Using system fonts with bold weight emphasis
  black: { fontWeight: '900' },
  bold: { fontWeight: '700' },
  semiBold: { fontWeight: '600' },
  medium: { fontWeight: '500' },
  regular: { fontWeight: '400' },
  light: { fontWeight: '300' },
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Border radius
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 999,

  // Font sizes
  fontXs: 11,
  fontSm: 13,
  fontMd: 15,
  fontLg: 17,
  fontXl: 20,
  fontXxl: 24,
  fontXxxl: 32,
  fontDisplay: 40,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};
