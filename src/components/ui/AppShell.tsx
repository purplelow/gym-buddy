import { createContext, useContext, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';

import { colors } from '@/constants/theme';

/** 앱 콘텐츠 최대 폭 — 이보다 넓은 화면에선 가운데 정렬된 컬럼으로 보인다 */
export const MAX_CONTENT_WIDTH = 480;

const ContentWidthContext = createContext<number>(MAX_CONTENT_WIDTH);

/**
 * 컨테이너(셸)의 실제 폭.
 *
 * ⚠️ useWindowDimensions() 대신 이걸 쓸 것.
 *    PC에서 window 너비는 1440인데 실제 콘텐츠 폭은 480이라,
 *    창 너비를 기준으로 계산하면 요소가 컨테이너를 뚫고 나간다.
 *    (인트로 캐러셀 슬라이드 폭, 시간대 그리드 셀 크기 등)
 */
export function useContentWidth(): number {
  return useContext(ContentWidthContext);
}

/**
 * 모바일 우선 레이아웃을 데스크톱에서 자연스럽게 보이도록 하는 셸.
 * 넓은 화면에서는 앱을 가운데 컬럼으로 고정하고 양옆을 배경으로 채운다.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState(
    Math.min(windowWidth, MAX_CONTENT_WIDTH),
  );

  const isWide = windowWidth > MAX_CONTENT_WIDTH;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - measured) > 0.5) setMeasured(w);
  };

  return (
    <View style={styles.backdrop}>
      <View
        onLayout={onLayout}
        style={[styles.shell, isWide && styles.shellFramed]}
      >
        <ContentWidthContext.Provider value={measured}>
          {children}
        </ContentWidthContext.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  // 넓은 화면에서만 앱 프레임처럼 경계를 준다
  shellFramed: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        // 컬럼이 배경 위에 떠 있는 느낌
        boxShadow: '0 0 60px rgba(0,0,0,0.6)',
      },
      default: {},
    }),
  },
});
