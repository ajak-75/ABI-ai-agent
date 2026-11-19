import { StyleSheet, Text, View } from 'react-native';

import type { Message } from '../../memory/types';
import { formatTimestamp } from '../../memory/utils';
import { ROUTE_MODE_LABELS } from '../../router/types';
import { colors, radius, spacing } from '../../theme';
import { Chip } from './Chip';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isPlaceholder = !isUser && Boolean(message.engineId?.includes('placeholder'));
  const routeLabel = message.routeMode ? ROUTE_MODE_LABELS[message.routeMode] : null;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && isPlaceholder ? (
          <View style={styles.badgeRow}>
            <Chip label="PHASE 1 · 테스트 응답" tone="accent" />
            {routeLabel ? <Chip label={routeLabel} tone="neutral" /> : null}
          </View>
        ) : null}

        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>

        <Text style={[styles.time, isUser ? styles.userTime : styles.assistantTime]}>
          {formatTimestamp(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 4,
    gap: spacing.xs,
  },
  userBubble: {
    backgroundColor: colors.bubbleUser,
    borderBottomRightRadius: radius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.bubbleAi,
    borderBottomLeftRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.bubbleUserText,
  },
  assistantText: {
    color: colors.bubbleAiText,
  },
  time: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: '#DCDCFB',
  },
  assistantTime: {
    color: colors.textFaint,
  },
});
