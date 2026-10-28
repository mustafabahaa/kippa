import { getFirestore, type DocumentData, type Query } from 'firebase-admin/firestore';
import { mcpRequestContext } from '../requestContext';

/**
 * Admin-backed implementation of the client dbLib surface. Path semantics are
 * identical to frontend/web/src/libs/db.ts, so every Kippa lib runs unchanged
 * and reads/writes the exact same documents the app does — under the MCP
 * token's identity, with Admin SDK permissions (security rules are enforced
 * by the token→credential lookup instead).
 */
function segment(value: string) {
  if (!value || value.includes('/') || value === '.' || value === '..') throw new Error('Invalid database path.');
  return value;
}

function collectionPath(householdId: string, collectionName: string) {
  const context = mcpRequestContext.getStore();
  if (!context || householdId !== context.householdId)
    throw new Error('Access outside the linked household is forbidden.');
  return `households/${segment(householdId)}/${segment(collectionName)}`;
}

function docPath(householdId: string, collectionName: string, docId: string, writing = false) {
  const context = mcpRequestContext.getStore();
  if (householdId === 'system') {
    if (!context || writing || collectionName !== 'users' || docId !== context.uid)
      throw new Error('System access is forbidden.');
    return `users/${segment(docId)}`;
  }
  return `${collectionPath(householdId, collectionName)}/${segment(docId)}`;
}

export const dbLib = {
  async getDoc(householdId: string, collectionName: string, docId: string): Promise<DocumentData | null> {
    const snapshot = await getFirestore()
      .doc(docPath(householdId, collectionName, docId))
      .get();
    return snapshot.exists ? snapshot.data() : null;
  },

  async getDocs(
    householdId: string,
    collectionName: string,
    filters?: { field: string; op: '==' | 'in' | 'array-contains'; value: unknown }[],
  ): Promise<DocumentData[]> {
    let query: Query = getFirestore().collection(collectionPath(householdId, collectionName));
    for (const filter of filters ?? []) {
      query = query.where(filter.field, filter.op, filter.value);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((document) => document.data());
  },

  subscribeDocs(): () => void {
    throw new Error('Realtime subscriptions are not available through the MCP server.');
  },

  async setDoc(householdId: string, collectionName: string, docId: string, data: DocumentData): Promise<void> {
    await getFirestore()
      .doc(docPath(householdId, collectionName, docId, true))
      .set(data);
  },

  async executeBatch(
    householdId: string,
    operations: { type: 'set' | 'delete'; collectionName: string; docId: string; data?: DocumentData }[],
  ): Promise<void> {
    const batch = getFirestore().batch();
    for (const operation of operations) {
      const ref = getFirestore().doc(docPath(householdId, operation.collectionName, operation.docId, true));
      if (operation.type === 'set') {
        if (!operation.data) throw new Error('Batch set requires document data.');
        batch.set(ref, operation.data);
      }
      else batch.delete(ref);
    }
    await batch.commit();
  },
};
