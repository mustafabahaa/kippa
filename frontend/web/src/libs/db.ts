import {
  collection,
  doc,
  getDoc as firestoreGetDoc,
  getDocs as firestoreGetDocs,
  setDoc as firestoreSetDoc,
  writeBatch as firestoreWriteBatch,
  query,
  startAfter,
  limit,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  where,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions, isFirebaseConfigured } from '@/config/firebase';

const FIREBASE_REQUIRED_MSG =
  'Firebase is not configured. Copy .env.example to .env and set VITE_FIREBASE_* credentials.';

function requireFirestore(): Firestore {
  if (!isFirebaseConfigured || !db) {
    throw new Error(FIREBASE_REQUIRED_MSG);
  }
  return db;
}

const ledgerCollections = new Set(['transactions', 'ledgerLines', 'accounts', 'conversionDetails']);

type WriteOperation = { type: 'set' | 'delete'; collectionName: string; docId: string; data?: any };

async function queueLedgerWrite(householdId: string, operations: WriteOperation[]) {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error('Sign in to save changes.');
  const ref = doc(requireFirestore(), `households/${householdId}/ledgerWriteRequests/${crypto.randomUUID()}`);
  await firestoreSetDoc(ref, { createdBy: uid, status: 'pending', operations });
  await new Promise<void>((resolve, reject) => {
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const result = snapshot.data();
      if (result?.status === 'committed') {
        unsubscribe();
        resolve();
      }
      if (result?.status === 'rejected') {
        unsubscribe();
        reject(new Error(result.error));
      }
    }, (error) => {
      unsubscribe();
      reject(error);
    });
  });
}

async function commitLedger(householdId: string, operations: WriteOperation[]) {
  if (!functions) throw new Error(FIREBASE_REQUIRED_MSG);
  if (typeof navigator !== 'undefined' && !navigator.onLine) return queueLedgerWrite(householdId, operations);
  await httpsCallable(functions, 'commitLedgerOperations')({ householdId, operations });
}

export const dbLib = {
  async initializeLedgerSummary(householdId: string) {
    if (!functions) throw new Error(FIREBASE_REQUIRED_MSG);
    await httpsCallable(functions, 'initializeLedgerSummary', { timeout: 300_000 })({ householdId });
  },

  async getDoc(householdId: string, collectionName: string, docId: string): Promise<any | null> {
    const firestore = requireFirestore();
    const path =
      householdId === 'system' ? `${collectionName}/${docId}` : `households/${householdId}/${collectionName}/${docId}`;
    const docRef = doc(firestore, path);
    const snapshot = await firestoreGetDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async getDocs(
    householdId: string,
    collectionName: string,
    filters?: { field: string; op: '==' | 'in' | 'array-contains' | '>=' | '<='; value: any }[],
  ): Promise<any[]> {
    const firestore = requireFirestore();
    const path = householdId === 'system' ? collectionName : `households/${householdId}/${collectionName}`;
    const colRef = collection(firestore, path);
    if (filters && filters.length > 0) {
      let q = query(colRef);
      for (const filter of filters) {
        q = query(q, where(filter.field, filter.op, filter.value));
      }
      const snapshot = await firestoreGetDocs(q);
      return snapshot.docs.map((d) => d.data());
    }
    const snapshot = await firestoreGetDocs(colRef);
    return snapshot.docs.map((d) => d.data());
  },

  async getDocsPage(
    householdId: string,
    collectionName: string,
    pageSize: number,
    cursor?: QueryDocumentSnapshot,
    constraints: QueryConstraint[] = [],
  ): Promise<{ items: any[]; nextCursor: QueryDocumentSnapshot | null }> {
    const firestore = requireFirestore();
    const path = householdId === 'system' ? collectionName : `households/${householdId}/${collectionName}`;
    const colRef = collection(firestore, path);
    let pageQuery = query(colRef, ...constraints);
    if (cursor) pageQuery = query(pageQuery, startAfter(cursor));
    pageQuery = query(pageQuery, limit(pageSize));

    const snapshot = await firestoreGetDocs(pageQuery);
    const lastDocument = snapshot.docs.at(-1);
    return {
      items: snapshot.docs.map((item) => ({ ...item.data(), id: item.id })),
      nextCursor: lastDocument ?? null,
    };
  },

  /**
   * Realtime subscription over a household collection. Returns an unsubscribe
   * function. Snapshots arrive immediately on attach and on every server-side
   * change, so callers stay live without polling.
   */
  subscribeDocs(
    householdId: string,
    collectionName: string,
    onUpdate: (docs: any[]) => void,
    onError?: (error: Error) => void,
  ): () => void {
    const firestore = requireFirestore();
    const path = householdId === 'system' ? collectionName : `households/${householdId}/${collectionName}`;
    const colRef = collection(firestore, path);
    return onSnapshot(
      colRef,
      (snapshot) => onUpdate(snapshot.docs.map((d) => d.data())),
      (error) => onError?.(error),
    );
  },

  async setDoc(householdId: string, collectionName: string, docId: string, data: any): Promise<void> {
    if (ledgerCollections.has(collectionName)) return commitLedger(householdId, [{ type: 'set', collectionName, docId, data }]);
    const firestore = requireFirestore();
    const path =
      householdId === 'system' ? `${collectionName}/${docId}` : `households/${householdId}/${collectionName}/${docId}`;
    const docRef = doc(firestore, path);
    await firestoreSetDoc(docRef, data);
  },

  async executeBatch(
    householdId: string,
    operations: WriteOperation[],
  ): Promise<void> {
    if (operations.some((operation) => ledgerCollections.has(operation.collectionName)))
      return commitLedger(householdId, operations);
    const firestore = requireFirestore();
    const batch = firestoreWriteBatch(firestore);
    for (const op of operations) {
      const path =
        householdId === 'system'
          ? `${op.collectionName}/${op.docId}`
          : `households/${householdId}/${op.collectionName}/${op.docId}`;
      const docRef = doc(firestore, path);
      if (op.type === 'set') {
        batch.set(docRef, op.data as DocumentData);
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    }
    await batch.commit();
  },
};
