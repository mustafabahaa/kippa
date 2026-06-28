import { 
  collection, 
  doc, 
  getDoc as firestoreGetDoc, 
  getDocs as firestoreGetDocs, 
  setDoc as firestoreSetDoc, 
  writeBatch as firestoreWriteBatch,
  query, 
  where,
  Firestore
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const FIREBASE_REQUIRED_MSG =
  'Firebase is not configured. Copy .env.example to .env and set VITE_FIREBASE_* credentials.';

function requireFirestore(): Firestore {
  if (!isFirebaseConfigured || !db) {
    throw new Error(FIREBASE_REQUIRED_MSG);
  }
  return db;
}

export const dbService = {
  async getDoc(householdId: string, collectionName: string, docId: string): Promise<any | null> {
    const firestore = requireFirestore();
    const path = householdId === 'system' 
      ? `${collectionName}/${docId}` 
      : `households/${householdId}/${collectionName}/${docId}`;
    const docRef = doc(firestore, path);
    const snapshot = await firestoreGetDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async getDocs(
    householdId: string, 
    collectionName: string, 
    filters?: { field: string; op: '==' | 'in'; value: any }[]
  ): Promise<any[]> {
    const firestore = requireFirestore();
    const path = householdId === 'system'
      ? collectionName
      : `households/${householdId}/${collectionName}`;
    const colRef = collection(firestore, path);
    if (filters && filters.length > 0) {
      let q = query(colRef);
      for (const filter of filters) {
        q = query(q, where(filter.field, filter.op, filter.value));
      }
      const snapshot = await firestoreGetDocs(q);
      return snapshot.docs.map(d => d.data());
    }
    const snapshot = await firestoreGetDocs(colRef);
    return snapshot.docs.map(d => d.data());
  },

  async setDoc(householdId: string, collectionName: string, docId: string, data: any): Promise<void> {
    const firestore = requireFirestore();
    const path = householdId === 'system'
      ? `${collectionName}/${docId}`
      : `households/${householdId}/${collectionName}/${docId}`;
    const docRef = doc(firestore, path);
    await firestoreSetDoc(docRef, data);
  },

  async executeBatch(
    householdId: string,
    operations: { type: 'set' | 'delete'; collectionName: string; docId: string; data?: any }[]
  ): Promise<void> {
    const firestore = requireFirestore();
    const batch = firestoreWriteBatch(firestore);
    for (const op of operations) {
      const path = householdId === 'system'
        ? `${op.collectionName}/${op.docId}`
        : `households/${householdId}/${op.collectionName}/${op.docId}`;
      const docRef = doc(firestore, path);
      if (op.type === 'set') {
        batch.set(docRef, op.data);
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    }
    await batch.commit();
  }
};
