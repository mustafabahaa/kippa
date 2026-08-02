import { collection, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { dbLib } from '@/libs/db';
import type { AiChartSpec, AiConversation, AiMessage, AiMessageRole, PendingAiAction } from '../types';

export const aiConversations = {
  async list(householdId: string, userId: string): Promise<AiConversation[]> {
    const rows = await dbLib.getDocs(householdId, 'aiConversations', [{ field: 'createdBy', op: '==', value: userId }]);
    return (rows as AiConversation[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async create(householdId: string, userId: string, firstMessage: string): Promise<AiConversation> {
    const now = new Date().toISOString();
    const conversation: AiConversation = {
      id: crypto.randomUUID(), householdId, createdBy: userId,
      title: firstMessage.trim().slice(0, 60) || 'New conversation', createdAt: now, updatedAt: now,
    };
    await dbLib.setDoc(householdId, 'aiConversations', conversation.id, conversation);
    return conversation;
  },
  async messagesPage(householdId: string, conversationId: string, before?: string, pageSize = 40): Promise<{ messages: AiMessage[]; nextCursor: string | null }> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.');
    const safePageSize = Math.min(Math.max(Math.trunc(pageSize), 1), 100);
    const messagesRef = collection(db, `households/${householdId}/aiConversations/${conversationId}/messages`);
    const pageQuery = before
      ? query(messagesRef, orderBy('createdAt', 'desc'), startAfter(before), limit(safePageSize + 1))
      : query(messagesRef, orderBy('createdAt', 'desc'), limit(safePageSize + 1));
    const snapshot = await getDocs(pageQuery);
    const rows = snapshot.docs.map(document => document.data() as AiMessage);
    const hasMore = rows.length > safePageSize;
    const page = rows.slice(0, safePageSize).reverse();
    return { messages: page, nextCursor: hasMore ? page[0]?.createdAt ?? null : null };
  },
  async addMessage(householdId: string, conversationId: string, role: AiMessageRole, content: string, charts?: AiChartSpec[]): Promise<AiMessage> {
    const message: AiMessage = {
      id: crypto.randomUUID(), householdId, conversationId, role, content: content.trim(), ...(charts?.length ? { charts } : {}), createdAt: new Date().toISOString(),
    };
    if (!message.content) throw new Error('Cannot save an empty AI message.');
    await dbLib.setDoc(householdId, `aiConversations/${conversationId}/messages`, message.id, message);
    const existing = await dbLib.getDoc(householdId, 'aiConversations', conversationId) as AiConversation | null;
    if (existing) await dbLib.setDoc(householdId, 'aiConversations', conversationId, { ...existing, updatedAt: message.createdAt });
    return message;
  },
  async savePendingActions(householdId: string, conversationId: string, pendingActions: PendingAiAction[]): Promise<void> {
    const existing = await dbLib.getDoc(householdId, 'aiConversations', conversationId) as AiConversation | null;
    if (!existing) throw new Error('AI conversation not found.');
    await dbLib.setDoc(householdId, 'aiConversations', conversationId, { ...existing, pendingActions, updatedAt: new Date().toISOString() });
  },
};
