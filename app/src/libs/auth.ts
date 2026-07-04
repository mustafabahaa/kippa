import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  Auth
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions, isFirebaseConfigured, isFirebaseReady } from '@/config/firebase';
import { dbLib } from '@/libs/db';
import { detectBaseCurrency } from '@/libs/currencyMeta';
import { UserProfile, Household, JoinStatus } from '@/domain/financeTypes';

const FIREBASE_REQUIRED_MSG =
  'Firebase is not configured. Copy .env.example to .env and set VITE_FIREBASE_* credentials.';

function requireAuth(): Auth {
  if (!isFirebaseReady || !auth) {
    throw new Error(FIREBASE_REQUIRED_MSG);
  }
  return auth;
}

export const authLib = {
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    if (!isFirebaseReady || !auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const profile = await dbLib.getDoc('system', 'users', fbUser.uid) as UserProfile | null;
        if (profile) {
          // Sync photoURL only (non-membership field). Membership fields
          // (householdId/householdIds/role) are server-only now, so we re-pin
          // them to their existing values to keep the rules happy.
          if (fbUser.photoURL && profile.photoURL !== fbUser.photoURL) {
            const updatedProfile = { ...profile, photoURL: fbUser.photoURL };
            await dbLib.setDoc('system', 'users', fbUser.uid, {
              ...updatedProfile,
              householdId: profile.householdId,
              householdIds: profile.householdIds,
              role: profile.role,
            });
            callback(updatedProfile);
          } else {
            callback(profile);
          }
        } else {
          const tempProfile: UserProfile = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            householdId: null,
            householdIds: [],
            role: 'owner',
            createdAt: new Date().toISOString(),
            photoURL: fbUser.photoURL || undefined,
          };
          callback(tempProfile);
        }
      } else {
        callback(null);
      }
    });
  },

  async signInWithGoogle(): Promise<UserProfile> {
    const firebaseAuth = requireAuth();
    const provider = new GoogleAuthProvider();
    const credentials = await signInWithPopup(firebaseAuth, provider);
    const fbUser = credentials.user;

    const profile = await dbLib.getDoc('system', 'users', fbUser.uid) as UserProfile | null;
    if (profile) {
      // Sync photoURL only (non-membership field).
      if (fbUser.photoURL && profile.photoURL !== fbUser.photoURL) {
        const updatedProfile = { ...profile, photoURL: fbUser.photoURL };
        await dbLib.setDoc('system', 'users', fbUser.uid, {
          ...updatedProfile,
          householdId: profile.householdId,
          householdIds: profile.householdIds,
          role: profile.role,
        });
        return updatedProfile;
      }
      return profile;
    }

    const newProfile: UserProfile = {
      uid: fbUser.uid,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
      email: fbUser.email || '',
      householdId: null,
      householdIds: [],
      role: 'owner',
      createdAt: new Date().toISOString(),
      photoURL: fbUser.photoURL || undefined,
    };
    await dbLib.setDoc('system', 'users', fbUser.uid, newProfile);
    return newProfile;
  },

  async logout(): Promise<void> {
    if (isFirebaseReady && auth) {
      await firebaseSignOut(auth);
    }
  },

  async createHousehold(userId: string, name: string): Promise<Household> {
    requireAuth();
    const baseCurrency = detectBaseCurrency();
    const createHouseholdFn = httpsCallable<
      { name: string; baseCurrency: string },
      { householdId: string }
    >(functions!, 'createHousehold');
    const res = await createHouseholdFn({ name, baseCurrency });
    const householdId = res.data.householdId;
    return {
      id: householdId,
      name,
      baseCurrency,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };
  },

  /**
   * Request to join a household. Creates a pending joinRequest the owner must
   * approve — does NOT grant membership.
   */
  async requestToJoinHousehold(userId: string, householdId: string): Promise<JoinStatus> {
    requireAuth();
    const requestFn = httpsCallable<
      { householdId: string },
      { status: JoinStatus }
    >(functions!, 'requestToJoinHousehold');
    const res = await requestFn({ householdId });
    return res.data.status;
  },

  /**
   * Owner approves or rejects a pending join request.
   */
  async decideJoinRequest(
    userId: string,
    householdId: string,
    requesterUid: string,
    decision: 'approve' | 'reject',
  ): Promise<JoinStatus> {
    requireAuth();
    const decideFn = httpsCallable<
      { householdId: string; requesterUid: string; decision: 'approve' | 'reject' },
      { status: JoinStatus }
    >(functions!, 'decideJoinRequest');
    const res = await decideFn({ householdId, requesterUid, decision });
    return res.data.status;
  },

  /**
   * Switches the active household. Stays client-side — only writes the active
   * householdId to a value already in householdIds (no escalation). householdIds
   * and role are re-pinned to existing values to satisfy the rules.
   */
  async switchHousehold(userId: string, householdId: string): Promise<UserProfile> {
    requireAuth();
    const profile = await dbLib.getDoc('system', 'users', userId) as UserProfile | null;
    if (!profile) throw new Error('User profile not found');

    const householdIds = profile.householdIds || [];
    if (!householdIds.includes(householdId)) {
      throw new Error('You are not a member of this household');
    }

    const hh = await dbLib.getDoc(householdId, 'householdInfo', 'info');
    if (!hh) throw new Error('Household not found');

    const role = hh.createdBy === userId ? 'owner' : 'member';
    const updatedProfile: UserProfile = {
      ...profile,
      householdId,
      role,
    };
    await dbLib.setDoc('system', 'users', userId, {
      ...updatedProfile,
      // re-pin immutable fields to their existing server values so the rules pass:
      householdIds: profile.householdIds,
      role: profile.role,
    });
    // Note: we intentionally return the locally-computed role for snappy UI;
    // the server value of `role` is unchanged.
    return updatedProfile;
  },

  async leaveHousehold(userId: string, householdId: string): Promise<UserProfile> {
    requireAuth();
    const leaveFn = httpsCallable<{ householdId: string }, { householdId: string | null }>(
      functions!,
      'leaveHousehold',
    );
    await leaveFn({ householdId });
    // Re-read the profile — the Function is the source of truth now.
    const updated = await dbLib.getDoc('system', 'users', userId) as UserProfile | null;
    if (!updated) throw new Error('User profile not found after leave');
    return updated;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const data = await dbLib.getDoc('system', 'users', userId);
    return data as UserProfile | null;
  },

  async updateLastSeenActivity(userId: string, householdId: string, timestamp: string): Promise<UserProfile> {
    requireAuth();
    const profile = await dbLib.getDoc('system', 'users', userId) as UserProfile | null;
    if (!profile) throw new Error('User profile not found');

    const lastSeenActivities = profile.lastSeenActivities || {};
    if (!lastSeenActivities[householdId] || timestamp > lastSeenActivities[householdId]) {
      lastSeenActivities[householdId] = timestamp;
      const updatedProfile: UserProfile = {
        ...profile,
        lastSeenActivities,
      };
      // lastSeenActivities is a non-membership field; safe to write. Re-pin the
      // immutable fields so the rules pass.
      await dbLib.setDoc('system', 'users', userId, {
        ...updatedProfile,
        householdId: profile.householdId,
        householdIds: profile.householdIds,
        role: profile.role,
      });
      return updatedProfile;
    }
    return profile;
  }
};

export { isFirebaseConfigured, isFirebaseReady };
