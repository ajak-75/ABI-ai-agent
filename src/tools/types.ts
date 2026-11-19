import type { RiskLevel } from '../memory/types';

/**
 * Tool contract (Phase 1).
 *
 * A tool is a single capability the agent may call (read today's calendar,
 * draft a message, …). Phase 1 defines the contract and ships an empty
 * registry: no tool is registered and nothing executes.
 */

export type ToolCategory = 'device_read' | 'local_data' | 'network' | 'outbound_action';

export interface ToolContext {
  sessionId: string;
  /** Approval id when the call already passed the approval flow. */
  approvalId?: string;
}

export interface ToolResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ToolDefinition<Input = unknown, Output = unknown> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ToolCategory;
  readonly risk: RiskLevel;
  /** True when the tool can change state outside the app. */
  readonly mutatesState: boolean;
  run(input: Input, context: ToolContext): Promise<ToolResult<Output>>;
}

export interface ToolCall {
  id: string;
  toolId: string;
  input: unknown;
}
