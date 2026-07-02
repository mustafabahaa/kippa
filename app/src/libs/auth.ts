import { 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  Auth
} from 'firebase/auth';
import { auth, isFirebaseConfigured, isFirebaseReady } from '@/config/firebase';
import { dbLib } from '@/libs/db';
import { detectBaseCurrency } from '@/libs/currencyMeta';
import { UserProfile, Household } from '@/domain/financeTypes';

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
          // Migrate old profiles to support multiple households
          let householdIds = profile.householdIds || [];
          let needsUpdate = false;
          if (profile.householdId && !householdIds.includes(profile.householdId)) {
            householdIds = [...householdIds, profile.householdId];
            needsUpdate = true;
          }
          if (fbUser.photoURL && profile.photoURL !== fbUser.photoURL) {
            needsUpdate = true;
          }
          if (needsUpdate) {
            const updatedProfile = { 
              ...profile, 
              householdIds, 
              photoURL: fbUser.photoURL || profile.photoURL 
            };
            await dbLib.setDoc('system', 'users', fbUser.uid, updatedProfile);
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
      // Migrate here too just in case
      let householdIds = profile.householdIds || [];
      let needsUpdate = false;
      if (profile.householdId && !householdIds.includes(profile.householdId)) {
        householdIds = [...householdIds, profile.householdId];
        needsUpdate = true;
      }
      if (fbUser.photoURL && profile.photoURL !== fbUser.photoURL) {
        needsUpdate = true;
      }
      if (needsUpdate) {
        const updatedProfile = { 
          ...profile, 
          householdIds, 
          photoURL: fbUser.photoURL || profile.photoURL 
        };
        await dbLib.setDoc('system', 'users', fbUser.uid, updatedProfile);
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
    const householdId = crypto.randomUUID();
    const now = new Date().toISOString();
    const household: Household = {
      id: householdId,
      name,
      baseCurrency: detectBaseCurrency(),
      createdAt: now,
      createdBy: userId,
    };

    await dbLib.setDoc(householdId, 'householdInfo', 'info', household);

    const profile = await dbLib.getDoc('system', 'users', userId) as UserProfile | null;
    if (profile) {
      const householdIds = profile.householdIds || [];
      if (!householdIds.includes(householdId)) {
        householdIds.push(householdId);
      }
      await dbLib.setDoc('system', 'users', userId, {
        ...profile,
        householdId,
        householdIds,
        role: 'owner' as const,
      });
    }

    return household;
  },

  async joinHousehold(userId: string, householdId: string): Promise<void> {
    requireAuth();
    const household = await dbLib.getDoc(householdId, 'householdInfo', 'info');
    if (!household) {
      throw new Error('Household ID not found.');
    }

    const profile = await dbLib.getDoc('system', 'users', userId) as UserProfile | null;
    if (profile) {
      let householdIds = profile.householdIds || [];
      if (profile.householdId && !householdIds.includes(profile.householdId)) {
        householdIds = [...householdIds, profile.householdId];
      }
      if (!householdIds.includes(householdId)) {
        householdIds = [...householdIds, householdId];
      }
      await dbLib.setDoc('system', 'users', userId, {
        ...profile,
        householdId,
        householdIds,
        role: 'member' as const,
      });
    }
  },

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
    await dbLib.setDoc('system', 'users', userId, updatedProfile);
    return updatedProfile;
  },

  async leaveHousehold(userId: string, householdId: string): Promise<UserProfile> {
    requireAuth();
    const profile = await dbLib.getDoc('system', 'users', userId) as UserProfile | null;
    if (!profile) throw new Error('User profile not found');

    const householdIds = (profile.householdIds || []).filter(id => id !== householdId);
    let nextActiveId = profile.householdId;
    if (profile.householdId === householdId) {
      nextActiveId = householdIds.length > 0 ? householdIds[0] : null;
    }

    const updatedProfile: UserProfile = {
      ...profile,
      householdId: nextActiveId,
      householdIds,
    };

    if (nextActiveId) {
      const hh = await dbLib.getDoc(nextActiveId, 'householdInfo', 'info');
      if (hh) {
        updatedProfile.role = hh.createdBy === userId ? 'owner' : 'member';
      }
    } else {
      updatedProfile.role = 'owner';
    }

    await dbLib.setDoc('system', 'users', userId, updatedProfile);
    return updatedProfile;
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
      await dbLib.setDoc('system', 'users', userId, updatedProfile);
      return updatedProfile;
    }
    return profile;
  }
};

export { isFirebaseConfigured, isFirebaseReady };
