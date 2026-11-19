/**
 * Ajak AI Agent — app theme tokens.
 * Single source of truth for colors, spacing, radius and typography.
 */

export const colors = {
  background: '#F4F5FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F8',
  border: '#E2E6F0',
  borderStrong: '#CBD2E1',

  text: '#12141A',
  textMuted: '#5F6775',
  textFaint: '#98A0AE',

  accent: '#4F46E5',
  accentPressed: '#4338CA',
  accentSoft: '#EDEEFE',
  onAccent: '#FFFFFF',

  success: '#0E9F6E',
  successSoft: '#E4F7EF',
  warning: '#B45309',
  warningSoft: '#FDF1E1',
  danger: '#D14343',
  dangerSoft: '#FDECEC',

  bubbleUser: '#4F46E5',
  bubbleUserText: '#FFFFFF',
  bubbleAi: '#FFFFFF',
  bubbleAiText: '#12141A',

  tabInactive: '#8B93A3',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  section: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
  caption: { fontSize: 12, color: colors.textFaint },
} as const;
