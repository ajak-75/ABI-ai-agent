import { requiresApproval } from '../security/approvals';
import type { RiskLevel } from '../memory/types';
import type { ToolCategory, ToolDefinition } from './types';

/**
 * Tool registry (Phase 1: intentionally empty).
 *
 * Keeping registration behind this registry means Phase 2 can add tools
 * without touching the UI: a tool only has to declare its risk level and the
 * approval policy decides whether the user is asked first.
 */
const registry = new Map<string, ToolDefinition<never, unknown>>();

export function registerTool<Input, Output>(tool: ToolDefinition<Input, Output>): void {
  if (registry.has(tool.id)) {
    throw new Error(`Tool already registered: ${tool.id}`);
  }
  registry.set(tool.id, tool as unknown as ToolDefinition<never, unknown>);
}

export function getTool(id: string): ToolDefinition<never, unknown> | undefined {
  return registry.get(id);
}

export function listTools(): ToolDefinition<never, unknown>[] {
  return [...registry.values()];
}

export function listToolsByCategory(category: ToolCategory): ToolDefinition<never, unknown>[] {
  return listTools().filter((tool) => tool.category === category);
}

export function needsApproval(risk: RiskLevel): boolean {
  return requiresApproval(risk);
}

export function toolCount(): number {
  return registry.size;
}
