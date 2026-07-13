/**
 * 짝짐 디자인 토큰 — Fitty(Behance) 레퍼런스 기반.
 * 다크 온리 · 네온 라임 포인트 · Outfit 타이포.
 */
export const colors = {
  // Brand (Fitty main color scale)
  brand: '#BAFA20',
  brand400: '#AEDD46',
  brand600: '#87AD35',
  brand800: '#617B24',
  brandDim: 'rgba(186, 250, 32, 0.14)',

  // Surfaces
  bg: '#0A0B08',
  surface: '#151711',
  surfaceRaised: '#1D1F18',
  glass: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#DADADA',
  textTertiary: '#808080',
  textInvert: '#0A0B08',
  textBrand: '#BAFA20',

  // Status
  danger: '#FF5A45',
  info: '#0CD4FF',
  warning: '#FFC24B',

  // Social
  kakao: '#FEE500',
  kakaoText: '#191919',
  google: '#FFFFFF',
  googleText: '#1F1F1F',
} as const;

export const font = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;

/** Fitty 스펙: Heading 20–32, Body 16–18 */
export const type = {
  display: { fontFamily: font.bold, fontSize: 32, lineHeight: 40 },
  h1: { fontFamily: font.semiBold, fontSize: 28, lineHeight: 36 },
  h2: { fontFamily: font.semiBold, fontSize: 24, lineHeight: 32 },
  h3: { fontFamily: font.semiBold, fontSize: 20, lineHeight: 28 },
  bodyLg: { fontFamily: font.regular, fontSize: 18, lineHeight: 27 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: font.medium, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  captionMd: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  stat: { fontFamily: font.bold, fontSize: 24, lineHeight: 30 },
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
