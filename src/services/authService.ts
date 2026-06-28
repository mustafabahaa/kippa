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
        const profile = await dbService.getDoc('system', 'users', fbUser.uid);
        if (profile) {
          callback(profile as UserProfile);
        } else {
          const tempProfile: UserProfile = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            householdId: null,
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

    const profile = await dbService.getDoc('system', 'users', fbUser.uid);
    if (profile) return profile as UserProfile;

    const newProfile: UserProfile = {
      uid: fbUser.uid,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
      email: fbUser.email || '',
      householdId: null,
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
      await dbService.setDoc('system', 'users', userId, { ...profile, householdId });
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
      await dbService.setDoc('system', 'users', userId, {
        ...profile,
        householdId,
        role: 'member' as const,
      });
    }
  }
};

export { isFirebaseConfigured, isFirebaseReady };
