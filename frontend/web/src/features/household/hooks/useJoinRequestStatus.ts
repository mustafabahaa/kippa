import { useEffect, useState } from 'react';
import type { JoinStatus } from '@kippa/domain';
import { subscribeHouseholdJoinRequestStatus } from '@/libs/householdSubscriptions';

export function useJoinRequestStatus(householdId: string, userId?: string) {
  const [snapshot, setSnapshot] = useState<{ key: string; status: JoinStatus | null }>({ key: '', status: null });
  const key = householdId.trim() && userId ? `${householdId.trim()}:${userId}` : '';
  useEffect(() => {
    const id = householdId.trim();
    if (!id || !userId) return;
    return subscribeHouseholdJoinRequestStatus(id, userId, (status) => {
      setSnapshot({
        key: `${id}:${userId}`,
        status,
      });
    });
  }, [householdId, userId]);
  return snapshot.key === key ? snapshot.status : null;
}
