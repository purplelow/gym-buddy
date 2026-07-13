import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Badge, Button, Card, Chip, Input, Screen, Text } from '@/components/ui';
import { colors, radius, spacing, type } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { userById, gymById } from '@/lib/mock';
import { relativeStrength, formatRelative } from '@/lib/strength';
import type { SpotRequest } from '@/types';

export default function SpotScreen() {
  const router = useRouter();
  const { gate, isLoggedIn } = useRequireAuth();
  const me = useAppStore((s) => s.me);
  const spotRequests = useAppStore((s) => s.spotRequests);
  const addSpotRequest = useAppStore((s) => s.addSpotRequest);

  const [showModal, setShowModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<SpotRequest['exercise'] | null>(null);
  const [targetWeight, setTargetWeight] = useState('');
  const [message, setMessage] = useState('');
  const [expiresInMin, setExpiresInMin] = useState(15);
  const [helpedRequests, setHelpedRequests] = useState<Set<string>>(new Set());

  const myGymId = me?.gymId ?? 'g1';

  // 내 헬스장의 요청만 필터 + 최신순 정렬
  const filteredRequests = useMemo(() => {
    return spotRequests
      .filter((r) => r.gymId === myGymId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [spotRequests, myGymId]);

  // 남은 시간 계산
  const getTimeRemaining = (createdAt: string, expiresInMin: number): number => {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 60000;
    return Math.max(0, expiresInMin - elapsed);
  };

  const handleCreateRequest = useCallback(() => {
    if (!selectedExercise || !targetWeight || !me) return;

    const newRequest: SpotRequest = {
      id: `s_${Date.now()}`,
      userId: me.id,
      gymId: myGymId,
      exercise: selectedExercise,
      targetWeight: parseInt(targetWeight, 10),
      message: message || undefined,
      expiresInMin,
      createdAt: new Date().toISOString(),
    };

    addSpotRequest(newRequest);

    // Reset form
    setSelectedExercise(null);
    setTargetWeight('');
    setMessage('');
    setExpiresInMin(15);
    setShowModal(false);
  }, [selectedExercise, targetWeight, me, myGymId, expiresInMin, message, addSpotRequest]);

  const handleHelp = useCallback((requestId: string) => {
    gate(() => {
      setHelpedRequests((prev) => new Set(prev).add(requestId));
    });
  }, [gate]);

  const renderRequestCard = ({ item: request }: { item: SpotRequest }) => {
    const requester =
      userById(request.userId) ?? (me && request.userId === me.id ? me : undefined);
    if (!requester) return null;

    const timeRemaining = getTimeRemaining(request.createdAt, request.expiresInMin);
    const isExpired = timeRemaining <= 0;
    const isConnected = helpedRequests.has(request.id);
    const timeMinutes = Math.ceil(timeRemaining);

    return (
      <Card style={styles.spotCard}>
        <View style={styles.cardHeader}>
          <Text variant="h3">{request.exercise}</Text>
          <Text variant="stat" color={colors.brand}>
            {request.targetWeight}kg
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View>
            <Text variant="bodyMd" color={colors.textPrimary}>
              {requester.nickname}
            </Text>
            <Text variant="caption" color={colors.textTertiary}>
              {formatRelative(relativeStrength(requester.lifts, requester.bodyWeight))}
            </Text>
          </View>

          {request.message && (
            <Text
              variant="body"
              color={colors.textSecondary}
              numberOfLines={1}
              style={styles.message}
            >
              {request.message}
            </Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Badge
            label={isExpired ? '마감' : `${timeMinutes}분 남음`}
            variant={isExpired ? 'neutral' : 'default'}
          />
          <Button
            label={isConnected ? '요청자에게 알렸어요 ✓' : '도와줄게요'}
            onPress={() => handleHelp(request.id)}
            disabled={isExpired || isConnected}
            size="md"
            variant={isConnected ? 'secondary' : 'primary'}
          />
        </View>
      </Card>
    );
  };

  return (
    <Screen padded={false} bottomInset={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="h1">스팟</Text>
          <Text variant="caption" color={colors.textTertiary}>
            지금 헬스장에서 보조가 필요한 사람들
          </Text>
        </View>
      </View>

      {/* List */}
      {filteredRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="flash" size={48} color={colors.textTertiary} />
          <Text variant="h3" style={styles.emptyTitle}>
            지금은 요청이 없어요.
          </Text>
          <Text variant="body" color={colors.textTertiary} style={styles.emptyDesc}>
            첫 요청을 올려보세요!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestCard}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Button */}
      <View style={styles.footer}>
        <Button
          label="스팟 요청하기"
          onPress={() => gate(() => setShowModal(true))}
          style={styles.fab}
        />
      </View>

      {/* Request Creation Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
              <Text variant="h2">스팟 요청 만들기</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Exercise Selection */}
              <View style={styles.section}>
                <Text variant="bodyMd" color={colors.textSecondary} style={styles.sectionLabel}>
                  운동 선택
                </Text>
                <View style={styles.chipGroup}>
                  {['벤치프레스', '스쿼트', '데드리프트', '오버헤드프레스'].map((ex) => (
                    <Chip
                      key={ex}
                      label={ex}
                      selected={selectedExercise === ex}
                      onPress={() => setSelectedExercise(ex as SpotRequest['exercise'])}
                    />
                  ))}
                </View>
              </View>

              {/* Weight Input */}
              <View style={styles.section}>
                <Input
                  label="목표 중량"
                  placeholder="무게 (kg)"
                  keyboardType="number-pad"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  suffix={
                    targetWeight ? (
                      <Text variant="body" color={colors.textTertiary}>
                        kg
                      </Text>
                    ) : null
                  }
                />
              </View>

              {/* Message Input */}
              <View style={styles.section}>
                <Input
                  label="메시지 (선택)"
                  placeholder="예: 5x3 마지막 세트만 부탁드려요"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                />
              </View>

              {/* Duration Selection */}
              <View style={styles.section}>
                <Text variant="bodyMd" color={colors.textSecondary} style={styles.sectionLabel}>
                  유지 시간
                </Text>
                <View style={styles.chipGroup}>
                  {[15, 30, 60].map((min) => (
                    <Chip
                      key={min}
                      label={`${min}분`}
                      selected={expiresInMin === min}
                      onPress={() => setExpiresInMin(min)}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            <Button
              label="요청 올리기"
              onPress={handleCreateRequest}
              disabled={!selectedExercise || !targetWeight}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    gap: spacing.xs,
  },
  list: { flex: 1 },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  spotCard: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cardBody: {
    gap: spacing.sm,
  },
  message: {
    marginTop: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyDesc: {
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fab: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    display: 'flex',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  submitButton: {
    margin: spacing.lg,
    marginTop: spacing.md,
  },
});
