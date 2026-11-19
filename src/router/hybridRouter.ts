import { buildPlaceholderReply } from '../engine/placeholderReply';
import { cloudFreeEngine, localEngine } from '../engine/placeholderEngines';
import type { AiEngine, EngineStatus } from '../engine/types';
import { recordAudit } from '../memory/auditLog';
import type { EngineKind, RouteDecision, RouteMode, RouterRequest, RouterResponse } from './types';

/**
 * Hybrid router — decides which engine answers a turn.
 *
 * Phase 1: both engines report `connected: false`, so every path ends in the
 * labelled test answer. The decision logic itself is final, so Phase 2 only
 * has to replace the engine implementations.
 */
class HybridRouter {
  private readonly engines: Record<EngineKind, AiEngine> = {
    local: localEngine,
    cloud_free: cloudFreeEngine,
  };

  async decide(mode: RouteMode): Promise<RouteDecision> {
    if (mode === 'auto') {
      if (await this.engines.local.isConnected()) {
        return {
          requestedMode: 'auto',
          resolvedMode: 'local',
          reason: '로컬 엔진이 연결되어 있어 기기 안에서 처리합니다.',
        };
      }
      if (await this.engines.cloud_free.isConnected()) {
        return {
          requestedMode: 'auto',
          resolvedMode: 'cloud_free',
          reason: '로컬 엔진이 미연결이라 무료 클라우드로 넘깁니다.',
        };
      }
      return {
        requestedMode: 'auto',
        resolvedMode: 'local',
        reason: '연결된 엔진이 없어 로컬 경로의 테스트 응답을 사용합니다.',
      };
    }

    const connected = await this.engines[mode].isConnected();
    return {
      requestedMode: mode,
      resolvedMode: mode,
      reason: connected ? '선택한 엔진으로 처리합니다.' : '선택한 엔진이 미연결이라 테스트 응답을 사용합니다.',
    };
  }

  async route(request: RouterRequest): Promise<RouterResponse> {
    const startedAt = Date.now();
    const decision = await this.decide(request.mode);
    const engine = this.engines[decision.resolvedMode];

    const result = await engine.generate({ messages: request.messages });

    await recordAudit(
      'router.decision',
      `${decision.requestedMode} → ${decision.resolvedMode} (${decision.reason})`
    );

    return {
      content:
        result.text ||
        buildPlaceholderReply({
          messages: request.messages,
          mode: decision.resolvedMode,
          engineLabel: engine.label,
        }),
      engineId: result.engineId,
      usedMode: decision.resolvedMode,
      isPlaceholder: result.isPlaceholder,
      latencyMs: Date.now() - startedAt,
    };
  }

  /** Status of both engines, for the settings screen. */
  async statuses(): Promise<EngineStatus[]> {
    return Promise.all([this.engines.local.status(), this.engines.cloud_free.status()]);
  }
}

export const hybridRouter = new HybridRouter();
