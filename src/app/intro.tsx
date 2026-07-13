import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ProgressDots, Text } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface Slide {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  desc: string;
  gradient: [string, string, string];
}

const SLIDES: Slide[] = [
  {
    icon: 'barbell',
    title: '3대 몇 치세요?',
    desc: '스쿼트・벤치・데드 실측 수치로\n내 수준에 맞는 파트너를 찾아드려요',
    gradient: ['#0A0B08', '#16240A', '#0A0B08'],
  },
  {
    icon: 'location',
    title: '같은 헬스장, 같은 시간',
    desc: '어차피 가는 헬스장에서 만나요.\n시간대만 맞추면 끝',
    gradient: ['#0A0B08', '#101907', '#0A0B08'],
  },
  {
    icon: 'flash',
    title: '지금 스팟이 필요할 때',
    desc: '고중량 마지막 세트,\n실시간으로 보조를 요청하세요',
    gradient: ['#0A0B08', '#1C2C04', '#0A0B08'],
  },
];

const isWeb = Platform.OS === 'web';

function SlideView({ slide, topInset }: { slide: Slide; topInset: number }) {
  return (
    <View style={styles.slideFill}>
      <LinearGradient
        colors={slide.gradient}
        start={{ x: 0.5, y: 0.15 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.slideContent, { paddingTop: topInset + 96 }]}>
        <View style={styles.iconWrap}>
          <Ionicons name={slide.icon} size={72} color={colors.brand} />
        </View>
        <Text variant="display" style={styles.title}>
          {slide.title}
        </Text>
        <Text variant="bodyLg" color={colors.textSecondary} style={styles.desc}>
          {slide.desc}
        </Text>
      </View>
    </View>
  );
}

export default function Intro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const completeIntro = useAppStore((s) => s.completeIntro);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const finish = () => {
    completeIntro();
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    const next = index + 1;
    setIndex(next);
    // 네이티브만 스크롤 동기화 (웹은 state 기반 렌더)
    if (!isWeb) {
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    }
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.root}>
      {isWeb ? (
        // 웹: 스크롤 의존성 제거 — 현재 슬라이드만 state로 렌더
        <SlideView slide={SLIDES[index]} topInset={insets.top} />
      ) : (
        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.title}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item }) => (
            <View style={{ width, height: '100%' }}>
              <SlideView slide={item} topInset={insets.top} />
            </View>
          )}
        />
      )}

      <Pressable
        onPress={finish}
        hitSlop={12}
        style={[styles.skip, { top: insets.top + spacing.sm }]}
      >
        <Text variant="bodyMd" color={colors.textSecondary}>
          건너뛰기
        </Text>
      </Pressable>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <ProgressDots total={SLIDES.length} index={index} />
        <Button
          label={index === SLIDES.length - 1 ? '시작하기' : '다음'}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  slideFill: { flex: 1 },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.brandDim,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  desc: {
    textAlign: 'center',
  },
  skip: {
    position: 'absolute',
    right: spacing.lg,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  nextButton: {
    width: '100%',
  },
});
