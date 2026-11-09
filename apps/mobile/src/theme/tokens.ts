/**
 * MORS Mobile Design Tokens
 * Strictly mirroring web tokens: dark charcoal background, warm off-white text, muted olive accent.
 */

export const colors = {
  bgPrimary: '#141414',
  bgSecondary: '#1c1c1c',
  bgSurface: '#242424',
  bgElevated: '#2d2d2d',

  textPrimary: '#f5f5f0',
  textSecondary: '#a3a39e',
  textMuted: '#6e6e69',

  accentPrimary: '#8a9a5b',
  accentHover: '#798850',
  accentSubtle: 'rgba(138, 154, 91, 0.15)',

  dangerText: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.15)',

  borderSubtle: '#2a2a2a',
  borderMuted: '#383838',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontFamilySerif: 'Newsreader',
  fontFamilySans: 'Inter',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
} as const;
