import type { RiskLevel } from '../memory/types';

/**
 * Approval policy (Phase 1).
 *
 * Anything that would touch the outside world or the user's data on their
 * behalf has to pass a human decision first. Phase 1 ships the policy and the
 * decision helpers; no tool executes yet.
 */

export type ApprovalDecision = 'approved' | 'rejected';

export interface ApprovalPolicy {
  /** Risk levels that always need an explicit user decision. */
  requireFor: RiskLevel[];
  /** Risk levels that may run without asking (local, reversible reads). */
  autoApprove: RiskLevel[];
  /** Actions that are never allowed, whatever the user says. */
  forbiddenCategories: string[];
}

export const DEFAULT_POLICY: ApprovalPolicy = {
  requireFor: ['medium', 'high'],
  autoApprove: ['low'],
  forbiddenCategories: ['payment_without_confirmation', 'credential_export'],
};

export function requiresApproval(risk: RiskLevel, policy: ApprovalPolicy = DEFAULT_POLICY): boolean {
  return policy.requireFor.includes(risk);
}

export function canAutoApprove(risk: RiskLevel, policy: ApprovalPolicy = DEFAULT_POLICY): boolean {
  return policy.autoApprove.includes(risk);
}

export const RISK_DESCRIPTIONS: Record<RiskLevel, string> = {
  low: '기기 안에서 읽기만 하고 되돌릴 수 있는 작업입니다.',
  medium: '앱 밖으로 나가거나 데이터를 바꾸는 작업이라 확인이 필요합니다.',
  high: '돈·계정·다른 사람에게 영향을 주는 작업이라 반드시 확인해야 합니다.',
};

export interface ApprovalRequestSummary {
  title: string;
  risk: RiskLevel;
  toolId?: string | null;
}

export function summarizeApproval(request: ApprovalRequestSummary): string {
  const lines = [request.title, RISK_DESCRIPTIONS[request.risk]];
  if (request.toolId) lines.push(`도구: ${request.toolId}`);
  return lines.join('\n');
}
