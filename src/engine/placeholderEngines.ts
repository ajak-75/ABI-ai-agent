import type { RouteMode } from '../router/types';
import { buildPlaceholderReply } from './placeholderReply';
import type { AiEngine, EngineStatus, GenerationRequest, GenerationResult } from './types';

/**
 * Phase 1 engines. They implement the full AiEngine contract so that wiring a
 * real runtime later is a drop-in replacement, but they never touch a model or
 * the network: `isConnected()` is always false and `generate()` returns a
 * labelled test answer.
 */

abstract class PlaceholderEngine implements AiEngine {
  abstract readonly id: string;
  abstract readonly kind: 'local' | 'cloud_free';
  abstract readonly label: string;
  abstract readonly mode: RouteMode;

  async status(): Promise<EngineStatus> {
    return {
      kind: this.kind,
      label: this.label,
      connected: false,
      modelId: null,
      note: await this.note(),
    };
  }

  async isConnected(): Promise<boolean> {
    return false;
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    return {
      text: buildPlaceholderReply({
        messages: request.messages,
        mode: this.mode,
        engineLabel: this.label,
      }),
      engineId: this.id,
      isPlaceholder: true,
    };
  }

  protected abstract note(): Promise<string>;
}

class LocalPlaceholderEngine extends PlaceholderEngine {
  readonly id = 'local.placeholder';
  readonly kind = 'local' as const;
  readonly label = '로컬 엔진 (미연결)';
  readonly mode: RouteMode = 'local';

  protected async note(): Promise<string> {
    return '기기 내 추론 엔진은 2단계에서 연결됩니다. 지금은 네트워크를 전혀 사용하지 않습니다.';
  }
}

class CloudFreePlaceholderEngine extends PlaceholderEngine {
  readonly id = 'cloud_free.placeholder';
  readonly kind = 'cloud_free' as const;
  readonly label = '무료 클라우드 (미연결)';
  readonly mode: RouteMode = 'cloud_free';

  protected async note(): Promise<string> {
    return '무료 API 호출은 2단계에서 연결됩니다. 1단계에서는 API 키만 안전하게 보관합니다.';
  }
}

export const localEngine: AiEngine = new LocalPlaceholderEngine();
export const cloudFreeEngine: AiEngine = new CloudFreePlaceholderEngine();
