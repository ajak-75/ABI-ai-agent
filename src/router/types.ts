/**
 * Router contract (Phase 1).
 *
 * Phase 1 ships the interface and the selection logic only: no local model
 * runtime and no HTTP client are bundled. Every engine reports
 * `connected: false`, so the router answers with an explicit placeholder.
 */

export type RouteMode = 'local' | 'cloud_free' | 'auto';

export type EngineKind = 'local' | 'cloud_free';

export interface ChatTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RouterRequest {
  sessionId: string;
  mode: RouteMode;
  messages: ChatTurn[];
}

export interface RouterResponse {
  content: string;
  /** Engine that produced the answer (placeholder engines included). */
  engineId: string;
  /** Mode actually used after `auto` resolution. */
  usedMode: EngineKind;
  /** True when no real model was involved (Phase 1 behaviour). */
  isPlaceholder: boolean;
  latencyMs: number;
}

/** Why a mode was chosen — surfaced in the UI so routing stays explainable. */
export interface RouteDecision {
  requestedMode: RouteMode;
  resolvedMode: EngineKind;
  reason: string;
}

export const ROUTE_MODE_LABELS: Record<RouteMode, string> = {
  local: '로컬',
  cloud_free: '무료 클라우드',
  auto: '자동',
};

export const ROUTE_MODE_DESCRIPTIONS: Record<RouteMode, string> = {
  local: '기기 안에서만 처리합니다. 네트워크를 쓰지 않습니다.',
  cloud_free: '무료 API를 사용합니다. 1단계에서는 키만 보관하고 호출하지 않습니다.',
  auto: '로컬을 먼저 시도하고, 연결돼 있지 않으면 무료 클라우드로 넘깁니다.',
};
