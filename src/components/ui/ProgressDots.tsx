import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/constants/theme';

export function ProgressDots({ total, index }: { total: number; index: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i === index && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  active: { width: 24, backgroundColor: colors.brand },
});
