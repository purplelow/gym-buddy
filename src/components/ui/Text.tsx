import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, type } from '@/constants/theme';

export type TextVariant = keyof typeof type;

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
}

export function Text({
  variant = 'body',
  color = colors.textPrimary,
  style,
  ...rest
}: TextProps) {
  return <RNText style={[type[variant], { color }, style]} {...rest} />;
}
