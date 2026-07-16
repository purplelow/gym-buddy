import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ProgressDots, Text, useContentWidth } from '@/components/ui';
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

const LAST = SLIDES.length - 1;

function SlideView({
  slide,
  width,
  topInset,
}: {
  slide: Slide;
  width: number;
  topInset: number;
}) {
  return (
    <View style={[styles.slideFill, { width }]}>
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
  // 창 너비가 아니라 셸(콘텐츠) 폭을 써야 PC에서 슬라이드가 어긋나지 않는다
  const width = useContentWidth();
  const completeIntro = useAppStore((s) => s.completeIntro);

  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);

  const finish = () => {
    completeIntro();
    router.replace('/(tabs)');
  };

  const goTo = (next: number) => {
    const clamped = Math.min(LAST, Math.max(0, next));
    setIndex(clamped);
    translateX.value = withTiming(-clamped * width, { duration: 260 });
  };

  const handleNext = () => {
    if (index >= LAST) finish();
    else goTo(index + 1);
  };

  // 드래그 스와이프 (웹·네이티브 공통)
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12]) // 세로 스크롤과 충돌 방지
    .onChange((e) => {
      translateX.value = -index * width + e.translationX;
    })
    .onEnd((e) => {
      const threshold = width * 0.2;
      let next = index;
      if (e.translationX < -threshold || e.velocityX < -500) next = index + 1;
      else if (e.translationX > threshold || e.velocityX > 500) next = index - 1;
      runOnJS(goTo)(next);
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.root}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.track,
            { width: width * SLIDES.length },
            trackStyle,
          ]}
        >
          {SLIDES.map((slide) => (
            <SlideView
              key={slide.title}
              slide={slide}
              width={width}
              topInset={insets.top}
            />
          ))}
        </Animated.View>
      </GestureDetector>

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
          label={index === LAST ? '시작하기' : '다음'}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  track: { flex: 1, flexDirection: 'row' },
  slideFill: { height: '100%' },
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
