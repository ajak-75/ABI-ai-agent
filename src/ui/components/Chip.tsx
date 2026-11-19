import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';

export type ChipTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const TONES: Record<ChipTone, { background: string; text: string }> = {
  neutral: { background: colors.surfaceMuted, text: colors.textMuted },
  accent: { background: colors.accentSoft, text: colors.accent },
  success: { background: colors.successSoft, text: colors.success },
  warning: { background: colors.warningSoft, text: colors.warning },
  danger: { background: colors.dangerSoft, text: colors.danger },
};

interface ChipProps {
  label: string;
  tone?: ChipTone;
}

export function Chip({ label, tone = 'neutral' }: ChipProps) {
  const palette = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
