import { dbLib } from './db';
import { 
  collection, 
  query, 
  orderBy, 
  limit as firestoreLimit, 
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { AuditLogEntry, AuditAction } from '../domain/financeTypes';

export const auditLogLib = {
  /**
   * Build a standardized audit log entry from user profile and action context.
   */
  buildEntry(
    householdId: string,
    userProfile: { uid: string; displayName: string; photoURL?: string },
    action: AuditAction,
    summary: string,
    details?: Record<string, any>
  ): AuditLogEntry {
    return {
      id: crypto.randomUUID(),
      householdId,
      userId: userProfile.uid,
      userDisplayName: userProfile.displayName,
      userPhotoURL: userProfile.photoURL,
      action,
      summary,
      details,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Write an audit log entry to Firestore (fire-and-forget).
   */
  async log(householdId: string, entry: AuditLogEntry): Promise<void> {
    try {
      await dbLib.setDoc(householdId, 'auditLog', entry.id, entry);
    } catch (err) {
      // Fire-and-forget: don't let audit failures break the main flow
      console.warn('[AuditLog] Failed to write audit entry:', err);
    }
  },

  /**
   * Convenience: build + log in one call.
   */
  async logAction(
    householdId: string,
    userProfile: { uid: string; displayName: string; photoURL?: string },
    action: AuditAction,
    summary: string,
    details?: Record<string, any>
  ): Promise<void> {
    const entry = this.buildEntry(householdId, userProfile, action, summary, details);
    await this.log(householdId, entry);
  },

  /**
   * Fetch the most recent audit log entries.
   */
  async getRecentLogs(householdId: string, count: number = 50): Promise<AuditLogEntry[]> {
    const list = await dbLib.getDocs(householdId, 'auditLog');
    return (list as AuditLogEntry[])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, count);
  },

  /**
   * Subscribe to real-time audit log updates via Firestore onSnapshot.
   * Returns an unsubscribe function.
   */
  subscribeToLogs(
    householdId: string,
    count: number,
    callback: (entries: AuditLogEntry[]) => void
  ): Unsubscribe {
    if (!isFirebaseConfigured || !db) {
      callback([]);
      return () => {};
    }

    const colRef = collection(db, `households/${householdId}/auditLog`);
    const q = query(colRef, orderBy('createdAt', 'desc'), firestoreLimit(count));

    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => doc.data() as AuditLogEntry);
      callback(entries);
    }, (err) => {
      console.warn('[AuditLog] Snapshot listener error:', err);
      callback([]);
    });
  }
};
