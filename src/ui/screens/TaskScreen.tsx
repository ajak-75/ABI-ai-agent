import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  createTask,
  formatRelativeTime,
  listAudit,
  listTasks,
  recordAudit,
  resolveTask,
  RISK_LABELS,
  TASK_STATUS_LABELS,
} from '../../memory';
import type { AgentTask, AuditEntry, TaskStatus } from '../../memory/types';
import { RISK_DESCRIPTIONS } from '../../security/approvals';
import { colors, radius, spacing } from '../../theme';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { useSessionState } from '../SessionContext';

type TabKey = 'pending' | 'log';

const STATUS_TONES: Record<TaskStatus, 'neutral' | 'accent' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'accent',
  rejected: 'danger',
  completed: 'success',
  failed: 'danger',
};

export function TaskScreen() {
  const { dataVersion, bumpDataVersion } = useSessionState();
  const [tab, setTab] = useState<TabKey>('pending');
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  const load = useCallback(async () => {
    const [storedTasks, storedLogs] = await Promise.all([listTasks(40), listAudit(60)]);
    setTasks(storedTasks);
    setLogs(storedLogs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, dataVersion])
  );

  const handleDecision = async (task: AgentTask, status: 'approved' | 'rejected') => {
    await resolveTask(task.id, status, status === 'approved' ? '사용자 승인' : '사용자 거절');
    await recordAudit(
      status === 'approved' ? 'approval.approved' : 'approval.rejected',
      task.title,
      task.id
    );
    await load();
    bumpDataVersion();
  };

  const handleCreateTest = async () => {
    const task = await createTask({
      title: '테스트 작업: 알림 예약 (실행되지 않음)',
      risk: 'medium',
      toolId: 'demo.notification',
      payload: JSON.stringify({ when: '내일 09:00', what: '테스트 알림' }),
    });
    await recordAudit('task.created', '승인 흐름 확인용 테스트 작업', task.id);
    await load();
  };

  const pending = tasks.filter((task) => task.status === 'pending');
  const visible = tab === 'pending' ? pending : tasks;

  return (
    <Screen title="작업" subtitle="승인 요청과 실행 기록">
      <View style={styles.tabRow}>
        {(
          [
            { key: 'pending' as TabKey, label: `승인 대기 ${pending.length}` },
            { key: 'log' as TabKey, label: `기록 ${logs.length}` },
          ]
        ).map((item) => {
          const active = item.key === tab;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[styles.tabButton, active && styles.tabButtonActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'pending' ? (
          <>
            <SectionHeader
              title="승인 정책"
              caption="보통·높음 위험 작업은 반드시 사용자 확인을 거칩니다"
            />
            <Card style={styles.policyCard}>
              <Text style={styles.policyLine}>· {RISK_DESCRIPTIONS.medium}</Text>
              <Text style={styles.policyLine}>· {RISK_DESCRIPTIONS.high}</Text>
              <Text style={styles.policyNote}>
                1단계에서는 실제 도구가 등록되어 있지 않아 어떤 작업도 실행되지 않습니다.
              </Text>
            </Card>

            <View style={styles.sectionGap} />
            <SectionHeader
              title="승인 대기"
              caption="요청을 눌러 승인·거절을 기록할 수 있습니다"
              action={
                <Pressable onPress={() => void handleCreateTest()} hitSlop={8}>
                  <Text style={styles.textButton}>테스트 요청</Text>
                </Pressable>
              }
            />

            {visible.length === 0 ? (
              <Card>
                <EmptyState
                  icon="shield-checkmark-outline"
                  title="대기 중인 승인 요청이 없습니다"
                  description="'테스트 요청'을 눌러 승인 흐름이 동작하는지 확인할 수 있습니다."
                />
              </Card>
            ) : (
              visible.map((task) => (
                <Card key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Chip label={`위험 ${RISK_LABELS[task.risk]}`} tone={task.risk === 'high' ? 'danger' : 'warning'} />
                  </View>
                  {task.toolId ? <Text style={styles.metaText}>도구: {task.toolId}</Text> : null}
                  {task.payload ? <Text style={styles.payload}>{task.payload}</Text> : null}
                  <Text style={styles.metaText}>{formatRelativeTime(task.createdAt)}</Text>

                  <View style={styles.actionRow}>
                    <PrimaryButton
                      label="거절"
                      variant="secondary"
                      small
                      style={styles.actionButton}
                      onPress={() => void handleDecision(task, 'rejected')}
                    />
                    <PrimaryButton
                      label="승인"
                      small
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert(
                          '승인하시겠어요?',
                          '1단계에서는 승인 기록만 남고 실제 작업은 실행되지 않습니다.',
                          [
                            { text: '취소', style: 'cancel' },
                            { text: '승인', onPress: () => void handleDecision(task, 'approved') },
                          ]
                        );
                      }}
                    />
                  </View>
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            <SectionHeader title="실행·변경 기록" caption="앱이 실제로 한 일을 시간순으로 남깁니다" />
            {logs.length === 0 ? (
              <Card>
                <EmptyState icon="document-text-outline" title="기록이 없습니다" description="대화를 보내거나 기억을 추가하면 기록이 쌓입니다." />
              </Card>
            ) : (
              logs.map((entry) => (
                <Card key={entry.id} style={styles.logCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.logAction}>{entry.action}</Text>
                    <Text style={styles.metaText}>{formatRelativeTime(entry.createdAt)}</Text>
                  </View>
                  {entry.detail ? <Text style={styles.logDetail}>{entry.detail}</Text> : null}
                </Card>
              ))
            )}

            <View style={styles.sectionGap} />
            <SectionHeader title="모든 작업" caption="상태별 작업 목록" />
            {tasks.length === 0 ? (
              <Card>
                <EmptyState icon="checkmark-done-outline" title="작업 이력이 없습니다" description="1단계에서는 도구 실행이 없어 작업이 만들어지지 않습니다." />
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} style={styles.logCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle} numberOfLines={2}>
                      {task.title}
                    </Text>
                    <Chip label={TASK_STATUS_LABELS[task.status]} tone={STATUS_TONES[task.status]} />
                  </View>
                  {task.result ? <Text style={styles.logDetail}>{task.result}</Text> : null}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.onAccent,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  policyCard: {
    gap: 4,
  },
  policyLine: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  policyNote: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textFaint,
    marginTop: spacing.xs,
  },
  sectionGap: {
    height: spacing.xl,
  },
  taskCard: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  metaText: {
    fontSize: 11,
    color: colors.textFaint,
  },
  payload: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  logCard: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  logAction: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  logDetail: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  textButton: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
});
