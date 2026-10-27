export type AiProviderId = 'gemini' | 'codex';

export type AiProviderDescriptor = {
  id: AiProviderId;
  /** Chat is gated behind a connected user account (device login) for this provider. */
  usesAccountConnection: boolean;
  /** Header subtitle shown once the chat is usable. */
  subtitle: string;
};

const configured: AiProviderId = import.meta.env.VITE_AI_PROVIDER === 'codex' ? 'codex' : 'gemini';

const descriptors: Record<AiProviderId, AiProviderDescriptor> = {
  gemini: { id: 'gemini', usesAccountConnection: false, subtitle: 'Your financial companion' },
  codex: { id: 'codex', usesAccountConnection: true, subtitle: 'Using your ChatGPT plan' },
};

/** The single source of truth for which AI backend this build talks to. */
export const aiProvider: AiProviderDescriptor = descriptors[configured];

export const requiresAiConnection = aiProvider.usesAccountConnection;
