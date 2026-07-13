import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { VERIFICATION_LABEL, type VerificationLevel } from '@/types';
import { Text } from './Text';

const BADGE_COLOR: Record<VerificationLevel, { bg: string; text: string }> = {
  unverified: { bg: colors.glass, text: colors.textTertiary },
  peer: { bg: colors.brandDim, text: colors.brand },
  video: { bg: colors.brand, text: colors.textInvert },
};

interface VerificationBadgeProps {
  level: VerificationLevel;
  style?: StyleProp<ViewStyle>;
}

export function VerificationBadge({ level, style }: VerificationBadgeProps) {
  const c = BADGE_COLOR[level];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <Text variant="caption" color={c.text}>
        {level === 'video' ? '✓ ' : level === 'peer' ? '✓ ' : ''}
        {VERIFICATION_LABEL[level]}
      </Text>
    </View>
  );
}

interface BadgeProps {
  label: string;
  variant?: 'default' | 'neutral';
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const bg = variant === 'neutral' ? colors.glass : colors.brandDim;
  const text = variant === 'neutral' ? colors.textTertiary : colors.brand;
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text variant="caption" color={text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
