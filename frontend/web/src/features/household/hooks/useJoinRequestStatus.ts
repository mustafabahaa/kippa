import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { JoinRequest, JoinStatus } from '@kippa/domain';
import { db } from '@/config/firebase';

export function useJoinRequestStatus(householdId: string, userId?: string) {
  const [snapshot, setSnapshot] = useState<{ key: string; status: JoinStatus | null }>({ key: '', status: null });
  const key = householdId.trim() && userId ? `${householdId.trim()}:${userId}` : '';
  useEffect(() => {
    const id = householdId.trim();
    if (!id || !userId || !db) return;
    return onSnapshot(doc(db, `households/${id}/joinRequests/${userId}`), (snapshot) => {
      setSnapshot({ key: `${id}:${userId}`, status: snapshot.exists() ? (snapshot.data() as JoinRequest).status : null });
    });
  }, [householdId, userId]);
  return snapshot.key === key ? snapshot.status : null;
}
