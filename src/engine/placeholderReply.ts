import type { ChatTurn, RouteMode } from '../router/types';
import { ROUTE_MODE_LABELS } from '../router/types';

interface PlaceholderInput {
  messages: ChatTurn[];
  mode: RouteMode;
  engineLabel: string;
}

/**
 * Builds the Phase 1 test answer. It is deliberately explicit about what is
 * and is not happening, so a tester never mistakes it for model output.
 */
export function buildPlaceholderReply({ messages, mode, engineLabel }: PlaceholderInput): string {
  const lastUserTurn = [...messages].reverse().find((turn) => turn.role === 'user');
  const userText = lastUserTurn?.content.trim() ?? '';
  const preview = userText.length > 80 ? `${userText.slice(0, 80)}…` : userText;

  const lines = [
    preview ? `"${preview}" — 입력 확인했어요.` : '입력을 확인했어요.',
    '',
    '지금은 1단계라 AI 엔진이 아직 연결되지 않았습니다. 이 답변은 화면·저장·라우팅 흐름을 확인하기 위한 테스트 응답입니다.',
    '',
    `· 선택 경로: ${ROUTE_MODE_LABELS[mode]} (${engineLabel})`,
    '· 대화 내용: 이 기기의 SQLite에 저장됨',
    '· 앱을 완전히 종료했다 다시 열어도 위 대화는 그대로 남습니다',
    '',
    '다음 단계에서 로컬 엔진이나 무료 API를 연결하면 실제 답변이 이 자리에 표시됩니다.',
  ];

  return lines.join('\n');
}
