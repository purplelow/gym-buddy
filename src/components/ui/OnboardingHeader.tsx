import { StyleSheet, View } from 'react-native';

import { BackButton } from './BackButton';

import { colors, radius, spacing } from '@/constants/theme';

interface OnboardingHeaderProps {
  step: number; // 1-based
  total: number;
  /** 첫 스텝은 뒤로가기 숨김 */
  canGoBack?: boolean;
}

/** Fitty 레퍼런스: 원형 뒤로가기 + 세그먼트 프로그레스 바 */
export function OnboardingHeader({ step, total, canGoBack = true }: OnboardingHeaderProps) {
  return (
    <View style={styles.row}>
      {canGoBack ? (
        <BackButton fallback="/onboarding" />
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, i === step - 1 && styles.segmentActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.brand,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: 36, height: 36 },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  segmentActive: { backgroundColor: colors.brand },
});
