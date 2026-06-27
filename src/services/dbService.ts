import { 
  collection, 
  doc, 
  getDoc as firestoreGetDoc, 
  getDocs as firestoreGetDocs, 
  setDoc as firestoreSetDoc, 
  writeBatch as firestoreWriteBatch,
  query, 
  where 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

// Generic Mock Storage for Local Mode
class MockDb {
  private getStorageKey(householdId: string, collectionName: string): string {
    return `ledger_${householdId}_${collectionName}`;
  }

  private getAllItems(householdId: string, collectionName: string): any[] {
    const key = this.getStorageKey(householdId, collectionName);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveAllItems(householdId: string, collectionName: string, items: any[]): void {
    const key = this.getStorageKey(householdId, collectionName);
    localStorage.setItem(key, JSON.stringify(items));
  }

  async getDoc(householdId: string, collectionName: string, docId: string): Promise<any | null> {
    const items = this.getAllItems(householdId, collectionName);
    return items.find(item => item.id === docId) || null;
  }

  async getDocs(
    householdId: string, 
    collectionName: string, 
    filters?: { field: string; op: '==' | 'in'; value: any }[]
  ): Promise<any[]> {
    let items = this.getAllItems(householdId, collectionName);
    if (filters) {
      for (const filter of filters) {
        const { field, op, value } = filter;
        if (op === '==') {
          items = items.filter(item => item[field] === value);
        } else if (op === 'in') {
          const valArray = Array.isArray(value) ? value : [value];
          items = items.filter(item => valArray.includes(item[field]));
        }
      }
    }
    return items;
  }

  async setDoc(householdId: string, collectionName: string, docId: string, data: any): Promise<void> {
    const items = this.getAllItems(householdId, collectionName);
    const idx = items.findIndex(item => item.id === docId);
    const itemWithId = { ...data, id: docId };
    if (idx >= 0) {
      items[idx] = itemWithId;
    } else {
      items.push(itemWithId);
    }
    this.saveAllItems(householdId, collectionName, items);
  }

  async deleteDoc(householdId: string, collectionName: string, docId: string): Promise<void> {
    let items = this.getAllItems(householdId, collectionName);
    items = items.filter(item => item.id !== docId);
    this.saveAllItems(householdId, collectionName, items);
  }

  async executeBatch(
    householdId: string,
    operations: { type: 'set' | 'delete'; collectionName: string; docId: string; data?: any }[]
  ): Promise<void> {
    // Process collections in batch memory
    const collectionsToSave: Record<string, any[]> = {};
    
    for (const op of operations) {
      const { collectionName } = op;
      if (!collectionsToSave[collectionName]) {
        collectionsToSave[collectionName] = this.getAllItems(householdId, collectionName);
      }
      
      const items = collectionsToSave[collectionName];
      const idx = items.findIndex(item => item.id === op.docId);
      
      if (op.type === 'set') {
        const itemWithId = { ...op.data, id: op.docId };
        if (idx >= 0) {
          items[idx] = itemWithId;
        } else {
          items.push(itemWithId);
        }
      } else if (op.type === 'delete') {
        collectionsToSave[collectionName] = items.filter(item => item.id !== op.docId);
      }
    }

    // Persist all updated collections
    for (const [collectionName, items] of Object.entries(collectionsToSave)) {
      this.saveAllItems(householdId, collectionName, items);
    }
  }
}

const mockDb = new MockDb();

export const dbService = {
  // Check if real Firebase is running or we are on Local Mock
  isLocalMode(): boolean {
    return !isFirebaseConfigured || !db;
  },

  async getDoc(householdId: string, collectionName: string, docId: string): Promise<any | null> {
    if (this.isLocalMode()) {
      return mockDb.getDoc(householdId, collectionName, docId);
    }
    const path = householdId === 'system' 
      ? `${collectionName}/${docId}` 
      : `households/${householdId}/${collectionName}/${docId}`;
    const docRef = doc(db!, path);
    const snapshot = await firestoreGetDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async getDocs(
    householdId: string, 
    collectionName: string, 
    filters?: { field: string; op: '==' | 'in'; value: any }[]
  ): Promise<any[]> {
    if (this.isLocalMode()) {
      return mockDb.getDocs(householdId, collectionName, filters);
    }
    
    const path = householdId === 'system'
      ? collectionName
      : `households/${householdId}/${collectionName}`;
    const colRef = collection(db!, path);
    if (filters && filters.length > 0) {
      let q = query(colRef);
      for (const filter of filters) {
        q = query(q, where(filter.field, filter.op, filter.value));
      }
      const snapshot = await firestoreGetDocs(q);
      return snapshot.docs.map(d => d.data());
    } else {
      const snapshot = await firestoreGetDocs(colRef);
      return snapshot.docs.map(d => d.data());
    }
  },

  async setDoc(householdId: string, collectionName: string, docId: string, data: any): Promise<void> {
    if (this.isLocalMode()) {
      return mockDb.setDoc(householdId, collectionName, docId, data);
    }
    const path = householdId === 'system'
      ? `${collectionName}/${docId}`
      : `households/${householdId}/${collectionName}/${docId}`;
    const docRef = doc(db!, path);
    await firestoreSetDoc(docRef, data);
  },

  async executeBatch(
    householdId: string,
    operations: { type: 'set' | 'delete'; collectionName: string; docId: string; data?: any }[]
  ): Promise<void> {
    if (this.isLocalMode()) {
      return mockDb.executeBatch(householdId, operations);
    }

    const batch = firestoreWriteBatch(db!);
    for (const op of operations) {
      const path = householdId === 'system'
        ? `${op.collectionName}/${op.docId}`
        : `households/${householdId}/${op.collectionName}/${op.docId}`;
      const docRef = doc(db!, path);
      if (op.type === 'set') {
        batch.set(docRef, op.data);
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    }
    await batch.commit();
  }
};
