import {
  appendMessage,
  countMessages,
  listMessages,
  recordAudit,
  renameSession,
  touchSession,
} from '../memory';
import type { Message } from '../memory';
import { hybridRouter } from '../router/hybridRouter';
import type { ChatTurn, RouteMode } from '../router/types';

const CONTEXT_WINDOW = 20;

export interface SendResult {
  userMessage: Message;
  assistantMessage: Message;
}

/**
 * One chat turn: persist the user message, ask the router, persist the answer.
 * Every step is local; the router currently returns a labelled test answer.
 */
export async function sendUserMessage(
  sessionId: string,
  text: string,
  mode: RouteMode
): Promise<SendResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('빈 메시지는 보낼 수 없습니다.');
  }

  const userMessage = await appendMessage({
    sessionId,
    role: 'user',
    content: trimmed,
    routeMode: mode,
    status: 'complete',
  });
  await touchSession(sessionId);

  await recordAudit('chat.message.sent', `${trimmed.length}자 · 경로 ${mode}`);

  const stored = await listMessages(sessionId);
  if (stored.length === 1) {
    // First message names the conversation, so the session list stays readable.
    await renameSession(sessionId, trimmed.slice(0, 24));
  }

  const messages: ChatTurn[] = stored
    .slice(-CONTEXT_WINDOW)
    .map((message) => ({ role: message.role, content: message.content }));

  const response = await hybridRouter.route({ sessionId, mode, messages });

  const assistantMessage = await appendMessage({
    sessionId,
    role: 'assistant',
    content: response.content,
    routeMode: response.usedMode,
    engineId: response.engineId,
    status: 'complete',
  });
  await touchSession(sessionId);

  await recordAudit(
    'router.reply',
    `${response.engineId} · ${response.latencyMs}ms · 테스트응답=${response.isPlaceholder}`
  );

  return { userMessage, assistantMessage };
}

/** Message count for the current session — used by the chat header. */
export async function getTurnCount(sessionId: string): Promise<number> {
  const total = await countMessages(sessionId);
  return Math.floor(total / 2);
}
