export type AiMessageRole = 'user' | 'assistant';

export type AiConversation = {
  id: string;
  householdId: string;
  createdBy: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pendingActions?: PendingAiAction[];
};

export type PendingAiAction = { id: string; toolName: string; input: unknown; summary: string; risk: 'write' | 'sensitive' };

export type AiMessage = {
  id: string;
  householdId: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  charts?: AiChartSpec[];
  createdAt: string;
};

export type AiChartSpec = {
  type: 'bar' | 'line' | 'pie';
  title: string;
  labels: string[];
  series: Array<{ label: string; data: number[] }>;
};

export type AiMemory = {
  id: string;
  householdId: string;
  scope: 'user' | 'household';
  userId?: string;
  kind: 'fact' | 'preference' | 'goal' | 'decision' | 'correction' | 'pattern' | 'outcome';
  content: string;
  confidence: number;
  sourceMessageIds: string[];
  createdAt: string;
  updatedAt: string;
  lastConfirmedAt?: string;
  supersededBy?: string;
};

export type AiFailureKind = 'rate-limit' | 'quota' | 'authentication' | 'network' | 'validation' | 'provider';

export class AiError extends Error {
  constructor(
    public readonly kind: AiFailureKind,
    message: string,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'AiError';
  }
}
