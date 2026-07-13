import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  onPress?: () => void;
  raised?: boolean;
}

export function Card({ onPress, raised, style, children, ...rest }: CardProps) {
  const inner = (
    <View
      style={[
        styles.card,
        raised && { backgroundColor: colors.surfaceRaised },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pressed: { opacity: 0.9 },
});
