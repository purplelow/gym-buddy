import { Pressable, StyleSheet } from 'react-native';

import { colors, font, radius, spacing } from '@/constants/theme';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function Chip({ label, selected, onPress, size = 'md' }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        size === 'sm' && styles.sm,
        selected && styles.selected,
      ]}
    >
      <Text
        variant={size === 'sm' ? 'caption' : 'captionMd'}
        color={selected ? colors.textInvert : colors.textSecondary}
        style={selected && { fontFamily: font.semiBold }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 12, paddingVertical: 6 },
  selected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
});
