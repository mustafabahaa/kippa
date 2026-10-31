import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import type { JoinRequest, JoinStatus } from '@kippa/domain';
import { db, isFirebaseConfigured } from '@/config/firebase';

export function subscribePendingHouseholdJoinRequests(
  householdId: string,
  onChange: (requests: JoinRequest[]) => void,
): () => void {
  if (!isFirebaseConfigured || !db) return () => {};

  const requestsQuery = query(
    collection(db, `households/${householdId}/joinRequests`),
    where('status', '==', 'pending'),
  );
  return onSnapshot(requestsQuery, (snapshot) => {
    const requests = snapshot.docs.map((document) => document.data() as JoinRequest);
    requests.sort((first, second) => second.requestedAt - first.requestedAt);
    onChange(requests);
  });
}

export function subscribeHouseholdJoinRequestStatus(
  householdId: string,
  userId: string,
  onChange: (status: JoinStatus | null) => void,
): () => void {
  if (!isFirebaseConfigured || !db) return () => {};

  const requestDocument = doc(db, `households/${householdId}/joinRequests/${userId}`);
  return onSnapshot(requestDocument, (snapshot) => {
    onChange(snapshot.exists() ? (snapshot.data() as JoinRequest).status : null);
  });
}
