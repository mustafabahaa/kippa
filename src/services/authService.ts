import { 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  Auth
} from 'firebase/auth';
import { auth, isFirebaseConfigured, isFirebaseReady } from '../config/firebase';
import { dbService } from './dbService';
import { UserProfile, Household } from '../domain/financeTypes';

const FIREBASE_REQUIRED_MSG =
  'Firebase is not configured. Copy .env.example to .env and set VITE_FIREBASE_* credentials.';

function requireAuth(): Auth {
  if (!isFirebaseReady || !auth) {
    throw new Error(FIREBASE_REQUIRED_MSG);
  }
  return auth;
}

export const authService = {
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    if (!isFirebaseReady || !auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const profile = await dbService.getDoc('system', 'users', fbUser.uid) as UserProfile | null;
        if (profile) {
          // Migrate old profiles to support multiple households
          let householdIds = profile.householdIds || [];
          if (profile.householdId && !householdIds.includes(profile.householdId)) {
            householdIds = [...householdIds, profile.householdId];
            const updatedProfile = { ...profile, householdIds };
            await dbService.setDoc('system', 'users', fbUser.uid, updatedProfile);
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

    const profile = await dbService.getDoc('system', 'users', fbUser.uid) as UserProfile | null;
    if (profile) {
      // Migrate here too just in case
      let householdIds = profile.householdIds || [];
      if (profile.householdId && !householdIds.includes(profile.householdId)) {
        householdIds = [...householdIds, profile.householdId];
        const updatedProfile = { ...profile, householdIds };
        await dbService.setDoc('system', 'users', fbUser.uid, updatedProfile);
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
    };
    await dbService.setDoc('system', 'users', fbUser.uid, newProfile);
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
      baseCurrency: 'EGP',
      createdAt: now,
      createdBy: userId,
    };

    await dbService.setDoc(householdId, 'householdInfo', 'info', household);

    const profile = await dbService.getDoc('system', 'users', userId) as UserProfile | null;
    if (profile) {
      const householdIds = profile.householdIds || [];
      if (!householdIds.includes(householdId)) {
        householdIds.push(householdId);
      }
      await dbService.setDoc('system', 'users', userId, {
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
    const household = await dbService.getDoc(householdId, 'householdInfo', 'info');
    if (!household) {
      throw new Error('Household ID not found.');
    }

    const profile = await dbService.getDoc('system', 'users', userId) as UserProfile | null;
    if (profile) {
      let householdIds = profile.householdIds || [];
      if (profile.householdId && !householdIds.includes(profile.householdId)) {
        householdIds = [...householdIds, profile.householdId];
      }
      if (!householdIds.includes(householdId)) {
        householdIds = [...householdIds, householdId];
      }
      await dbService.setDoc('system', 'users', userId, {
        ...profile,
        householdId,
        householdIds,
        role: 'member' as const,
      });
    }
  },

  async switchHousehold(userId: string, householdId: string): Promise<UserProfile> {
    requireAuth();
    const profile = await dbService.getDoc('system', 'users', userId) as UserProfile | null;
    if (!profile) throw new Error('User profile not found');

    const householdIds = profile.householdIds || [];
    if (!householdIds.includes(householdId)) {
      throw new Error('You are not a member of this household');
    }

    const hh = await dbService.getDoc(householdId, 'householdInfo', 'info');
    if (!hh) throw new Error('Household not found');

    const role = hh.createdBy === userId ? 'owner' : 'member';

    const updatedProfile: UserProfile = {
      ...profile,
      householdId,
      role,
    };
    await dbService.setDoc('system', 'users', userId, updatedProfile);
    return updatedProfile;
  },

  async leaveHousehold(userId: string, householdId: string): Promise<UserProfile> {
    requireAuth();
    const profile = await dbService.getDoc('system', 'users', userId) as UserProfile | null;
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
      const hh = await dbService.getDoc(nextActiveId, 'householdInfo', 'info');
      if (hh) {
        updatedProfile.role = hh.createdBy === userId ? 'owner' : 'member';
      }
    } else {
      updatedProfile.role = 'owner';
    }

    await dbService.setDoc('system', 'users', userId, updatedProfile);
    return updatedProfile;
  }
};

export { isFirebaseConfigured, isFirebaseReady };
