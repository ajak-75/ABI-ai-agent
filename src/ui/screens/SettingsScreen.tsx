import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { hybridRouter } from '../../router/hybridRouter';
import {
  ROUTE_MODE_DESCRIPTIONS,
  ROUTE_MODE_LABELS,
} from '../../router/types';
import type { RouteMode } from '../../router/types';
import {
  clearConversations,
  countMemories,
  countMessages,
  countSessions,
  getSetting,
  recordAudit,
  resetDatabase,
  SETTING_KEYS,
  setSetting,
} from '../../memory';
import type { EngineStatus } from '../../engine/types';
import {
  deleteApiKey,
  getApiKeyHint,
  hasApiKey,
  isSecureStoreAvailable,
  saveApiKey,
} from '../../security/secrets';
import { colors, radius, spacing } from '../../theme';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { useSessionState } from '../SessionContext';

const MODES: RouteMode[] = ['local', 'cloud_free', 'auto'];

interface Counts {
  sessions: number;
  messages: number;
  memories: number;
}

export function SettingsScreen() {
  const { bumpDataVersion } = useSessionState();
  const [mode, setMode] = useState<RouteMode>('auto');
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [keyDraft, setKeyDraft] = useState('');
  const [keyHint, setKeyHint] = useState<string | null>(null);
  const [keyStored, setKeyStored] = useState(false);
  const [secureAvailable, setSecureAvailable] = useState(true);
  const [counts, setCounts] = useState<Counts>({ sessions: 0, messages: 0, memories: 0 });
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [storedMode, statuses, hint, stored, available, sessions, messages, memories] =
      await Promise.all([
        getSetting(SETTING_KEYS.routeMode),
        hybridRouter.statuses(),
        getApiKeyHint('cloud_free'),
        hasApiKey('cloud_free'),
        isSecureStoreAvailable(),
        countSessions(),
        countMessages(),
        countMemories(),
      ]);

    setMode((storedMode as RouteMode | null) ?? 'auto');
    setEngines(statuses);
    setKeyHint(hint);
    setKeyStored(stored);
    setSecureAvailable(available);
    setCounts({ sessions, messages, memories });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const handleModeChange = async (next: RouteMode) => {
    setMode(next);
    await setSetting(SETTING_KEYS.routeMode, next);
    await recordAudit('settings.route_mode', next);
  };

  const handleSaveKey = async () => {
    const value = keyDraft.trim();
    if (!value) return;
    const saved = await saveApiKey('cloud_free', value);
    setKeyDraft('');
    setNotice(
      saved
        ? 'API 키를 기기 보안 저장소(Keystore)에 저장했습니다. 1단계에서는 호출하지 않습니다.'
        : '이 기기에서 보안 저장소를 사용할 수 없습니다.'
    );
    await recordAudit('settings.api_key_saved', 'cloud_free · 값은 저장/표시하지 않음');
    await refresh();
  };

  const handleDeleteKey = () => {
    Alert.alert('API 키를 삭제할까요?', '보안 저장소에서만 지워지며, 다른 데이터는 그대로입니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteApiKey('cloud_free');
          await recordAudit('settings.api_key_deleted', 'cloud_free');
          setNotice('API 키를 삭제했습니다.');
          await refresh();
        },
      },
    ]);
  };

  const handleClearConversations = () => {
    Alert.alert('대화 기록을 모두 지울까요?', '세션·메시지가 삭제됩니다. 기억과 작업 기록은 남습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '지우기',
        style: 'destructive',
        onPress: async () => {
          await clearConversations();
          await recordAudit('data.conversations_cleared', '세션·메시지 전체 삭제');
          bumpDataVersion();
          setNotice('대화 기록을 모두 지웠습니다. 기억과 작업 기록은 남아 있습니다.');
          await refresh();
        },
      },
    ]);
  };

  const handleResetDatabase = () => {
    Alert.alert(
      '데이터베이스를 초기화할까요?',
      'DB 파일을 삭제하고 새로 만듭니다. 저장된 모든 대화·기억·기록이 사라집니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            await resetDatabase();
            bumpDataVersion();
            setNotice('데이터베이스를 새로 만들었습니다.');
            await refresh();
          },
        },
      ]
    );
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const phase = (Constants.expoConfig?.extra?.phase as number | undefined) ?? 1;

  return (
    <Screen title="설정" subtitle="AI 경로 · 보안 · 데이터 관리">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {notice ? (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          <SectionHeader title="AI 경로" caption="요청을 어디서 처리할지 고릅니다" />
          <Card style={styles.modeCard}>
            <View style={styles.modeRow}>
              {MODES.map((item) => {
                const active = item === mode;
                return (
                  <Pressable
                    key={item}
                    onPress={() => void handleModeChange(item)}
                    style={[styles.modeButton, active && styles.modeButtonActive]}
                  >
                    <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                      {ROUTE_MODE_LABELS[item]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.description}>{ROUTE_MODE_DESCRIPTIONS[mode]}</Text>

            <View style={styles.engineList}>
              {engines.map((engine) => (
                <View key={engine.kind} style={styles.engineRow}>
                  <View style={styles.engineTitleRow}>
                    <Text style={styles.engineLabel}>{engine.label}</Text>
                    <Chip
                      label={engine.connected ? '연결됨' : '미연결'}
                      tone={engine.connected ? 'success' : 'neutral'}
                    />
                  </View>
                  <Text style={styles.engineNote}>{engine.note}</Text>
                </View>
              ))}
            </View>
          </Card>

          <View style={styles.sectionGap} />

          <SectionHeader title="무료 API 키" caption="expo-secure-store(Android Keystore)에만 저장" />
          <Card style={styles.keyCard}>
            <View style={styles.keyStatusRow}>
              <Text style={styles.keyStatusLabel}>
                {keyStored ? '저장됨' : '저장된 키 없음'}
              </Text>
              {keyHint ? <Text style={styles.keyHint}>{keyHint}</Text> : null}
            </View>

            <TextInput
              style={styles.keyInput}
              value={keyDraft}
              onChangeText={setKeyDraft}
              placeholder="API 키 입력 (화면에 저장값이 다시 표시되지 않습니다)"
              placeholderTextColor={colors.textFaint}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.keyActionRow}>
              <PrimaryButton
                label="키 저장"
                small
                style={styles.keyAction}
                onPress={() => void handleSaveKey()}
                disabled={!keyDraft.trim() || !secureAvailable}
              />
              <PrimaryButton
                label="키 삭제"
                variant="secondary"
                small
                style={styles.keyAction}
                onPress={handleDeleteKey}
                disabled={!keyStored}
              />
            </View>

            <Text style={styles.description}>
              1단계에서는 키를 보관만 합니다. 외부 API 호출 코드는 이 빌드에 포함되어 있지 않습니다.
            </Text>
          </Card>

          <View style={styles.sectionGap} />

          <SectionHeader title="로컬 데이터" caption="기기 안 SQLite에만 저장됩니다" />
          <Card style={styles.dataCard}>
            <View style={styles.countRow}>
              <View style={styles.countItem}>
                <Text style={styles.countValue}>{counts.sessions}</Text>
                <Text style={styles.countLabel}>세션</Text>
              </View>
              <View style={styles.countItem}>
                <Text style={styles.countValue}>{counts.messages}</Text>
                <Text style={styles.countLabel}>메시지</Text>
              </View>
              <View style={styles.countItem}>
                <Text style={styles.countValue}>{counts.memories}</Text>
                <Text style={styles.countLabel}>기억</Text>
              </View>
            </View>

            <PrimaryButton
              label="대화 기록 전체 삭제"
              variant="secondary"
              onPress={handleClearConversations}
              style={styles.fullButton}
            />
            <PrimaryButton
              label="데이터베이스 초기화"
              variant="danger"
              onPress={handleResetDatabase}
              style={styles.fullButton}
            />
          </Card>

          <View style={styles.sectionGap} />

          <SectionHeader title="앱 정보" />
          <Card style={styles.infoCard}>
            <InfoRow label="앱 이름" value={Constants.expoConfig?.name ?? 'ABI'} />
            <InfoRow label="버전" value={`${version} · PHASE ${phase}`} />
            <InfoRow label="빌드" value="Development Build (expo-dev-client)" />
            <InfoRow label="데이터 저장" value="SQLite · 기기 로컬" />
            <InfoRow label="비밀 저장" value={secureAvailable ? 'Keystore 사용 가능' : 'Keystore 사용 불가'} />
            <InfoRow label="네트워크" value="1단계: AI 호출 없음" />
          </Card>

          <Text style={styles.footer}>
            이 앱은 공개 오픈소스 기술(Expo · React Native · TypeScript · expo-sqlite ·
            expo-secure-store)만 사용합니다.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.accent,
  },
  modeCard: {
    gap: spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.accent,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modeLabelActive: {
    color: colors.onAccent,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  engineList: {
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  engineRow: {
    gap: 2,
  },
  engineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  engineLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  engineNote: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
  },
  keyCard: {
    gap: spacing.sm,
  },
  keyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyStatusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  keyHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  keyInput: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.text,
  },
  keyActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  keyAction: {
    flex: 1,
  },
  dataCard: {
    gap: spacing.sm,
  },
  countRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  countItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: 2,
  },
  countValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  countLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  fullButton: {
    marginTop: spacing.xs,
  },
  infoCard: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  sectionGap: {
    height: spacing.xl,
  },
  footer: {
    marginTop: spacing.xl,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
