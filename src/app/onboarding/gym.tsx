import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Input, OnboardingHeader, Screen, Text } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { GYMS } from '@/lib/mock';
import { useAppStore } from '@/store/useAppStore';

const TOTAL_STEPS = 5;

export default function OnboardingGym() {
  const router = useRouter();
  const draft = useAppStore((s) => s.draft);
  const updateDraft = useAppStore((s) => s.updateDraft);

  const [query, setQuery] = useState('');
  const [gymId, setGymId] = useState<string | undefined>(draft.gymId);

  const filteredGyms = useMemo(() => {
    const q = query.trim();
    if (!q) return GYMS;
    return GYMS.filter((g) => g.name.includes(q) || g.address.includes(q));
  }, [query]);

  const isValid = !!gymId;

  const handleNext = () => {
    if (!isValid) return;
    updateDraft({ gymId });
    router.push('/onboarding/schedule');
  };

  // 새로고침 등으로 draft가 비면 1단계부터 다시
  if (!draft.lifts) return <Redirect href="/onboarding" />;

  return (
    <Screen bottomInset>
      <OnboardingHeader step={3} total={TOTAL_STEPS} />

      <View style={styles.header}>
        <Text variant="h1">어느 헬스장에 다니세요?</Text>
        <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
          내 헬스장을 검색해서 선택해주세요
        </Text>
      </View>

      <Input
        placeholder="헬스장 이름 또는 주소 검색"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        suffix={<Ionicons name="search" size={18} color={colors.textTertiary} />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {filteredGyms.length === 0 ? (
          <Text variant="body" color={colors.textTertiary} style={styles.emptyText}>
            검색 결과가 없어요
          </Text>
        ) : (
          filteredGyms.map((gym) => {
            const selected = gym.id === gymId;
            return (
              <Card
                key={gym.id}
                onPress={() => setGymId(gym.id)}
                style={[styles.gymCard, selected && styles.gymCardSelected]}
              >
                <Text variant="bodyMd">{gym.name}</Text>
                <Text variant="caption" color={colors.textTertiary} style={styles.gymAddress}>
                  {gym.address}
                </Text>
                <Text variant="captionMd" color={colors.brand} style={styles.gymMemberCount}>
                  등록 멤버 {gym.memberCount}명
                </Text>
              </Card>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text variant="caption" color={colors.textTertiary} style={styles.footerCaption}>
          같은 헬스장 멤버끼리만 매칭돼요
        </Text>
        <Button label="다음" onPress={handleNext} disabled={!isValid} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepText: { width: 32, textAlign: 'right' },
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.sm },
  listContent: { gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.lg },
  emptyText: { textAlign: 'center', paddingVertical: spacing.xl },
  gymCard: { borderWidth: 1.5 },
  gymCardSelected: { borderColor: colors.brand },
  gymAddress: { marginTop: spacing.xs },
  gymMemberCount: { marginTop: spacing.sm },
  footer: { paddingTop: spacing.md, gap: spacing.sm },
  footerCaption: { textAlign: 'center' },
});
