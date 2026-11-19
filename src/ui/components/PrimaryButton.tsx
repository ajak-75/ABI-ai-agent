import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BACKGROUNDS: Record<Variant, string> = {
  primary: colors.accent,
  secondary: colors.surfaceMuted,
  danger: colors.dangerSoft,
  ghost: 'transparent',
};

const TEXT_COLORS: Record<Variant, string> = {
  primary: colors.onAccent,
  secondary: colors.text,
  danger: colors.danger,
  ghost: colors.accent,
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  small = false,
  style,
}: PrimaryButtonProps) {
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.button,
        small && styles.small,
        { backgroundColor: BACKGROUNDS[variant] },
        variant === 'ghost' && styles.ghost,
        pressed && !isInactive && styles.pressed,
        isInactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={TEXT_COLORS[variant]} />
      ) : (
        <Text style={[styles.label, small && styles.smallLabel, { color: TEXT_COLORS[variant] }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  ghost: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.82,
  },
  inactive: {
    opacity: 0.45,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  smallLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
