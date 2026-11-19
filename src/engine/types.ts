/**
 * Engine contract (Phase 1).
 *
 * An engine is a model runtime. Phase 1 defines the shape and ships
 * "placeholder" engines only: they report `connected: false` and return a
 * clearly labelled test answer. No inference library, no HTTP client.
 */

import type { EngineKind } from '../router/types';

export interface GenerationRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResult {
  text: string;
  engineId: string;
  /** True when the text is a Phase 1 test answer rather than model output. */
  isPlaceholder: boolean;
}

export interface EngineStatus {
  kind: EngineKind;
  label: string;
  /** Whether a real runtime is wired up. Always false in Phase 1. */
  connected: boolean;
  /** Model identifier, once an engine is connected. */
  modelId: string | null;
  /** Human readable note shown in the settings screen. */
  note: string;
}

export interface AiEngine {
  readonly id: string;
  readonly kind: EngineKind;
  readonly label: string;
  status(): Promise<EngineStatus>;
  isConnected(): Promise<boolean>;
  generate(request: GenerationRequest): Promise<GenerationResult>;
}
