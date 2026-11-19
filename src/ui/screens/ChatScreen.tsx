import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { sendUserMessage } from '../../engine/chatPipeline';
import {
  createSession,
  getOrCreateActiveSession,
  getSession,
  getSetting,
  listMessages,
  SETTING_KEYS,
} from '../../memory';
import type { Message, Session } from '../../memory/types';
import { ROUTE_MODE_LABELS } from '../../router/types';
import type { RouteMode } from '../../router/types';
import { colors, radius, spacing } from '../../theme';
import { Chip } from '../components/Chip';
import { MessageBubble } from '../components/MessageBubble';
import { Screen } from '../components/Screen';
import { useSessionState } from '../SessionContext';

const SUGGESTIONS = ['안녕하세요', '이 앱은 뭐야?', '대화가 저장되나요?'];

export function ChatScreen() {
  const { activeSessionId, selectSession, dataVersion } = useSessionState();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<RouteMode>('auto');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(
    async (sessionId: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const storedMode = (await getSetting(SETTING_KEYS.routeMode)) as RouteMode | null;
        setMode(storedMode ?? 'auto');

        const target =
          (sessionId ? await getSession(sessionId) : null) ?? (await getOrCreateActiveSession());
        const stored = await listMessages(target.id);

        setSession(target);
        setMessages(stored);
        if (target.id !== sessionId) selectSession(target.id);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : '대화를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [selectSession]
  );

  useFocusEffect(
    useCallback(() => {
      void load(activeSessionId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSessionId, dataVersion])
  );

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(timer);
  }, [messages.length, sending]);

  const handleSend = async (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text || sending || !session) return;

    setInput('');
    setSending(true);
    setError(null);

    try {
      await sendUserMessage(session.id, text, mode);
      setMessages(await listMessages(session.id));
      const refreshed = await getSession(session.id);
      if (refreshed) setSession(refreshed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '메시지를 저장하지 못했습니다.');
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const created = await createSession();
      selectSession(created.id);
      setSession(created);
      setMessages([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '새 대화를 만들지 못했습니다.');
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyBlock}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>첫 메시지를 보내 보세요</Text>
      <Text style={styles.emptyDescription}>
        지금은 1단계라 실제 AI 대신 안내용 테스트 응답이 옵니다.{'\n'}
        보낸 메시지는 이 기기의 SQLite에 저장되고, 앱을 다시 열어도 남습니다.
      </Text>
      <View style={styles.suggestionRow}>
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            onPress={() => {
              setInput(suggestion);
            }}
            style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Screen
      title="대화"
      subtitle={session?.title ?? 'SQLite에 저장되는 로컬 대화'}
      headerRight={
        <Pressable
          accessibilityLabel="새 대화"
          onPress={handleNewChat}
          style={({ pressed }) => [styles.newChatButton, pressed && styles.pressed]}
        >
          <Ionicons name="create-outline" size={18} color={colors.accent} />
          <Text style={styles.newChatLabel}>새 대화</Text>
        </Pressable>
      }
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.metaRow}>
          <Chip label={`경로 · ${ROUTE_MODE_LABELS[mode]}`} tone="accent" />
          <Chip label={`${messages.length}개 메시지 저장됨`} tone="neutral" />
          {sending ? <Chip label="응답 준비 중" tone="warning" /> : null}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={loading ? undefined : renderEmpty()}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <Pressable
            accessibilityLabel="메시지 보내기"
            onPress={() => {
              void handleSend();
            }}
            disabled={!input.trim() || sending || !session}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.pressed,
              (!input.trim() || sending) && styles.sendDisabled,
            ]}
          >
            <Ionicons name="arrow-up" size={20} color={colors.onAccent} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  emptyBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  suggestion: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  suggestionPressed: {
    backgroundColor: colors.accentSoft,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md - 2,
    paddingBottom: spacing.md - 2,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.8,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  newChatLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  errorBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
});
