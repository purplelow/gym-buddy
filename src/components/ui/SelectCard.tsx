import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, font, radius, spacing } from '@/constants/theme';
import { Text } from './Text';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SelectCardProps {
  label: string;
  icon: IconName;
  selected?: boolean;
  onPress: () => void;
}

/** Fitty 레퍼런스의 큰 선택 카드 — 선택 시 라임 그라데이션 + 검정 콘텐츠 */
export function SelectCard({ label, icon, selected, onPress }: SelectCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <View style={[styles.card, selected && styles.cardSelected]}>
        {selected ? (
          <LinearGradient
            colors={[colors.brand, colors.brand400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Ionicons
          name={icon}
          size={44}
          color={selected ? colors.textInvert : colors.textTertiary}
        />
      </View>
      <Text
        variant="bodyMd"
        color={selected ? colors.brand : colors.textSecondary}
        style={selected && { fontFamily: font.semiBold }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1, alignItems: 'center', gap: spacing.md },
  card: {
    alignSelf: 'stretch',
    aspectRatio: 0.86,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardSelected: { borderColor: colors.brand },
});
