import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { colors, font, radius, spacing } from '@/constants/theme';
import { Text } from './Text';

interface RulerPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  /** 굵은 눈금+라벨 간격 (기본 5) */
  majorEvery?: number;
}

const PX_PER_UNIT = 12;
const TICK_RADIUS = 24; // 중앙 기준 양쪽으로 렌더할 눈금 수

/**
 * Fitty 레퍼런스의 체중/신장 룰러.
 * 드래그(팬)로 값을 조절하고, 중앙 고정 인디케이터에 현재 값이 걸린다.
 * 웹 접근성을 위해 양옆 -/+ 버튼도 제공.
 */
export function RulerPicker({
  min,
  max,
  value,
  onChange,
  unit,
  majorEvery = 5,
}: RulerPickerProps) {
  const startValue = useRef(value);
  const [width, setWidth] = useState(0);

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      startValue.current = value;
    })
    .onUpdate((e) => {
      onChange(clamp(startValue.current - e.translationX / PX_PER_UNIT));
    });

  const centerX = width / 2;
  const ticks: number[] = [];
  for (let t = value - TICK_RADIUS; t <= value + TICK_RADIUS; t++) {
    if (t >= min && t <= max) ticks.push(t);
  }

  return (
    <View style={styles.wrap}>
      <Text variant="display" color={colors.brand} style={styles.value}>
        {value}
        {unit}
      </Text>

      <View style={styles.trackRow}>
        <Pressable
          onPress={() => onChange(clamp(value - 1))}
          hitSlop={8}
          style={styles.stepBtn}
        >
          <Ionicons name="remove" size={18} color={colors.textSecondary} />
        </Pressable>

        <GestureDetector gesture={pan}>
          <View
            style={styles.track}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          >
            {width > 0 &&
              ticks.map((t) => {
                const x = centerX + (t - value) * PX_PER_UNIT;
                const isMajor = t % majorEvery === 0;
                return (
                  <View key={t} style={[styles.tickCol, { left: x }]}>
                    <View
                      style={[
                        styles.tick,
                        isMajor ? styles.tickMajor : styles.tickMinor,
                      ]}
                    />
                    {isMajor ? (
                      <Text variant="caption" color={colors.textTertiary}>
                        {t}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            {/* 중앙 고정 인디케이터 */}
            <View style={[styles.indicator, { left: centerX - 1.5 }]} />
          </View>
        </GestureDetector>

        <Pressable
          onPress={() => onChange(clamp(value + 1))}
          hitSlop={8}
          style={styles.stepBtn}
        >
          <Ionicons name="add" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.lg },
  value: { fontFamily: font.bold },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  track: {
    flex: 1,
    height: 72,
    overflow: 'hidden',
  },
  tickCol: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    width: 1,
    gap: spacing.sm,
  },
  tick: { width: 1.5, borderRadius: 1 },
  tickMinor: { height: 24, backgroundColor: colors.borderStrong, marginTop: 10 },
  tickMajor: { height: 34, backgroundColor: colors.textSecondary, marginTop: 0 },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 44,
    borderRadius: 2,
    backgroundColor: colors.brand,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
