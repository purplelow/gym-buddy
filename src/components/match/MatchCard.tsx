import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Card, Chip, Text, VerificationBadge } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { formatRelative, relativeStrength, totalLifts } from '@/lib/strength';
import {
  STYLE_TAG_LABEL,
  TIME_BAND_LABEL,
  WEEKDAY_LABEL,
  type TimeSlot,
  type UserProfile,
} from '@/types';

interface MatchCardProps {
  user: UserProfile;
  /** 내 상대강도 — 있으면 상대와의 차이를 함께 표시 */
  myRelative?: number;
  overlap: TimeSlot[];
  onPress: () => void;
}

/** 최대 2개 + 나머지는 "+N" */
function formatOverlapPreview(overlap: TimeSlot[]): string | null {
  if (overlap.length === 0) return null;
  const preview = overlap
    .slice(0, 2)
    .map((s) => `${WEEKDAY_LABEL[s.day]} ${TIME_BAND_LABEL[s.band]}`)
    .join(' · ');
  const rest = overlap.length - 2;
  return rest > 0 ? `${preview} +${rest}` : preview;
}

export function MatchCard({ user, myRelative, overlap, onPress }: MatchCardProps) {
  const relative = relativeStrength(user.lifts, user.bodyWeight);
  const diff = myRelative !== undefined ? relative - myRelative : undefined;
  const overlapPreview = formatOverlapPreview(overlap);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text variant="h3" color={colors.brand}>
            {user.nickname.charAt(0)}
          </Text>
        </View>
        <Text variant="bodyMd" style={styles.nickname} numberOfLines={1}>
          {user.nickname}
        </Text>
        <VerificationBadge level={user.verification} />
      </View>

      <View style={styles.statRow}>
        <Text variant="stat" color={colors.brand}>
          {formatRelative(relative)}
        </Text>
        <View style={styles.statCaptions}>
          <Text variant="caption" color={colors.textSecondary}>
            3대 {totalLifts(user.lifts)}kg
          </Text>
          {diff !== undefined ? (
            <Text variant="caption" color={colors.textTertiary}>
              나와 차이 {diff >= 0 ? '+' : ''}
              {diff.toFixed(2)}
            </Text>
          ) : null}
        </View>
      </View>

      {overlapPreview ? (
        <View style={styles.overlapRow}>
          <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
          <Text variant="caption" color={colors.textSecondary}>
            {overlapPreview}
          </Text>
        </View>
      ) : null}

      {user.styleTags.length > 0 ? (
        <View style={styles.tagRow}>
          {user.styleTags.map((tag) => (
            <Chip key={tag} label={STYLE_TAG_LABEL[tag]} size="sm" />
          ))}
        </View>
      ) : null}

      {user.intro ? (
        <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
          {user.intro}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nickname: { flex: 1 },
  statRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  statCaptions: { gap: 2, paddingBottom: 2 },
  overlapRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
});
