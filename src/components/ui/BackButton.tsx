import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

interface BackButtonProps {
  icon?: 'arrow-back' | 'close';
  /** 히스토리가 없을 때(새로고침·딥링크) 대신 이동할 경로 */
  fallback?: Href;
  style?: StyleProp<ViewStyle>;
}

/** 공용 뒤로가기 — 원형 라임 링. back 스택이 없어도 에러 없이 fallback으로 이동 */
export function BackButton({
  icon = 'arrow-back',
  fallback = '/(tabs)',
  style,
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={[styles.btn, style]}>
      <Ionicons name={icon} size={18} color={colors.brand} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.brand,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
