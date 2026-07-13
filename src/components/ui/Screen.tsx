import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

interface ScreenProps extends ViewProps {
  /** 좌우 패딩 없이 풀블리드로 쓸 때 false */
  padded?: boolean;
  /** 탭 화면은 하단 인셋을 탭바가 처리하므로 false */
  bottomInset?: boolean;
}

export function Screen({
  padded = true,
  bottomInset = false,
  style,
  children,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          // 웹은 안전영역이 0이라 최소 여백을 보장해 CTA가 바닥에 붙지 않게 한다
          paddingBottom: bottomInset ? Math.max(insets.bottom, spacing.lg) : 0,
        },
        padded && { paddingHorizontal: spacing.lg },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
