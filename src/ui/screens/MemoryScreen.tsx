import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  countMemories,
  createMemory,
  deleteMemory,
  deleteSession,
  formatRelativeTime,
  listMemories,
  listSessionSummaries,
  MEMORY_KIND_LABELS,
  recordAudit,
} from '../../memory';
import type { MemoryKind, SessionSummary, UserMemory } from '../../memory/types';
import { colors, radius, spacing } from '../../theme';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import type { TabNavigation } from '../navigation';
import { useSessionState } from '../SessionContext';

const KINDS: MemoryKind[] = ['preference', 'fact', 'instruction'];

export function MemoryScreen() {
  const navigation = useNavigation<TabNavigation>();
  const { selectSession, dataVersion, bumpDataVersion } = useSessionState();
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [kind, setKind] = useState<MemoryKind>('preference');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  const load = useCallback(async () => {
    const [storedMemories, storedSessions, total] = await Promise.all([
      listMemories(),
      listSessionSummaries(20),
      countMemories(),
    ]);
    setMemories(storedMemories);
    setSessions(storedSessions);
    setMemoryCount(total);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, dataVersion])
  );

  const handleAdd = async () => {
    const value = draft.trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      await createMemory({ kind, value, source: 'user' });
      await recordAudit('memory.created', `${MEMORY_KIND_LABELS[kind]}: ${value.slice(0, 40)}`);
      setDraft('');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = (memory: UserMemory) => {
    Alert.alert('기억을 삭제할까요?', memory.value, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteMemory(memory.id);
          await recordAudit('memory.deleted', memory.value.slice(0, 40));
          await load();
        },
      },
    ]);
  };

  const handleDeleteSession = (session: SessionSummary) => {
    Alert.alert('대화를 삭제할까요?', `"${session.title}" 메시지 ${session.messageCount}개가 함께 삭제됩니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(session.id);
          await recordAudit('session.deleted', session.title);
          bumpDataVersion();
          await load();
        },
      },
    ]);
  };

  return (
    <Screen title="기억" subtitle="기기에 저장된 사용자 정보와 대화 목록">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="사용자 기억"
          caption={`${memoryCount}개 저장됨 · SQLite 로컬 전용`}
        />

        <Card style={styles.formCard}>
          <View style={styles.kindRow}>
            {KINDS.map((item) => {
              const active = item === kind;
              return (
                <Pressable
                  key={item}
                  onPress={() => setKind(item)}
                  style={[styles.kindButton, active && styles.kindButtonActive]}
                >
                  <Text style={[styles.kindLabel, active && styles.kindLabelActive]}>
                    {MEMORY_KIND_LABELS[item]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.formInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="예: 나는 짧고 숫자 중심의 답을 좋아한다"
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={300}
          />

          <PrimaryButton
            label="기억에 추가"
            onPress={() => {
              void handleAdd();
            }}
            disabled={!draft.trim()}
            loading={saving}
          />
        </Card>

        <View style={styles.list}>
          {memories.length === 0 ? (
            <Card>
              <EmptyState
                icon="sparkles-outline"
                title="저장된 기억이 없습니다"
                description="선호·사실·지시를 적어 두면 다음 단계에서 AI가 참고합니다."
              />
            </Card>
          ) : (
            memories.map((memory) => (
              <Card key={memory.id}>
                <View style={styles.memoryHeader}>
                  <Chip label={MEMORY_KIND_LABELS[memory.kind]} tone="accent" />
                  <Text style={styles.metaText}>{formatRelativeTime(memory.updatedAt)}</Text>
                </View>
                <Text style={styles.memoryValue}>{memory.value}</Text>
                {memory.label ? <Text style={styles.metaText}>{memory.label}</Text> : null}
                <Pressable
                  onPress={() => handleDeleteMemory(memory)}
                  style={styles.deleteLink}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.textFaint} />
                  <Text style={styles.deleteLabel}>삭제</Text>
                </Pressable>
              </Card>
            ))
          )}
        </View>

        <View style={styles.sectionGap} />

        <SectionHeader title="대화 세션" caption={`${sessions.length}개 · 탭하면 대화로 이동`} />

        <View style={styles.list}>
          {sessions.length === 0 ? (
            <Card>
              <EmptyState icon="chatbubbles-outline" title="대화가 없습니다" description="대화 탭에서 첫 메시지를 보내 보세요." />
            </Card>
          ) : (
            sessions.map((session) => (
              <Card
                key={session.id}
                onPress={() => {
                  selectSession(session.id);
                  navigation.navigate('Chat');
                }}
              >
                <View style={styles.sessionRow}>
                  <View style={styles.sessionText}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text style={styles.sessionPreview} numberOfLines={1}>
                      {session.lastMessage ?? '메시지 없음'}
                    </Text>
                    <Text style={styles.metaText}>
                      {formatRelativeTime(session.updatedAt)} · 메시지 {session.messageCount}개
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDeleteSession(session)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  kindRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kindButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  kindButtonActive: {
    backgroundColor: colors.accent,
  },
  kindLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  kindLabelActive: {
    color: colors.onAccent,
  },
  formInput: {
    minHeight: 68,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  list: {
    gap: spacing.sm,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  memoryValue: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  metaText: {
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 4,
  },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  deleteLabel: {
    fontSize: 11,
    color: colors.textFaint,
  },
  sectionGap: {
    height: spacing.xl,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sessionText: {
    flex: 1,
    gap: 2,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sessionPreview: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
