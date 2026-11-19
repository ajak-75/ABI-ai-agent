/**
 * Security surface of the app, in one import.
 */

export {
  isSecureStoreAvailable,
  saveApiKey,
  readApiKey,
  hasApiKey,
  getApiKeyHint,
  deleteApiKey,
} from './secrets';
export type { SecretProvider } from './secrets';

export {
  DEFAULT_POLICY,
  requiresApproval,
  canAutoApprove,
  summarizeApproval,
  RISK_DESCRIPTIONS,
} from './approvals';
export type { ApprovalDecision, ApprovalPolicy, ApprovalRequestSummary } from './approvals';

export { recordAudit, listAudit, clearAudit } from '../memory/auditLog';
