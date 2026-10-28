import type { AiMessage } from './types';

export function mergeConversationMessages(history: AiMessage[], current: AiMessage[]): AiMessage[] {
  const messages = new Map(history.map((message) => [message.id, message]));
  for (const message of current) messages.set(message.id, message);
  return [...messages.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
