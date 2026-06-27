import { 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { dbService } from './dbService';
import { UserProfile, Household } from '../domain/financeTypes';

const LOCAL_USER_KEY = 'ledger_local_user';
const LOCAL_HOUSEHOLD_KEY = 'ledger_local_household';

export const authService = {
  // Callback when auth state change
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    if (!isFirebaseConfigured || !auth) {
      // Local storage mock auth listener
      const checkLocalUser = () => {
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        if (stored) {
          callback(JSON.parse(stored));
        } else {
          callback(null);
        }
      };
      // Run once immediately
      checkLocalUser();
      // Simple window event listener to trigger updates across pages
      window.addEventListener('storage', checkLocalUser);
      return () => {
        window.removeEventListener('storage', checkLocalUser);
      };
    }

    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        // Fetch user profile from firestore users collection
        const profile = await dbService.getDoc('system', 'users', fbUser.uid);
        if (profile) {
          callback(profile as UserProfile);
        } else {
          // Fallback if auth exists but firestore doc doesn't yet
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
    if (!isFirebaseConfigured || !auth) {
      // Mock login with google
      const mockProfile: UserProfile = {
        uid: 'mock-uid-123',
        displayName: 'Google Test User',
        email: 'testuser@gmail.com',
        householdId: localStorage.getItem(LOCAL_HOUSEHOLD_KEY) || null,
        role: 'owner',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockProfile));
      // Trigger local storage event manually for same window
      window.dispatchEvent(new Event('storage'));
      return mockProfile;
    }

    const provider = new GoogleAuthProvider();
    const credentials = await signInWithPopup(auth, provider);
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
    if (!isFirebaseConfigured || !auth) {
      localStorage.removeItem(LOCAL_USER_KEY);
      window.dispatchEvent(new Event('storage'));
      return;
    }
    await firebaseSignOut(auth);
  },

  async createHousehold(userId: string, name: string): Promise<Household> {
    const householdId = crypto.randomUUID();
    const now = new Date().toISOString();
    const household: Household = {
      id: householdId,
      name,
      baseCurrency: 'EGP',
      createdAt: now,
      createdBy: userId,
    };

    // Store household record
    await dbService.setDoc(householdId, 'householdInfo', 'info', household);

    // Update user profile with household ID
    if (!isFirebaseConfigured || !auth) {
      const userStr = localStorage.getItem(LOCAL_USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr) as UserProfile;
        user.householdId = householdId;
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
        localStorage.setItem(LOCAL_HOUSEHOLD_KEY, householdId);
        window.dispatchEvent(new Event('storage'));
      }
    } else {
      const profile = await dbService.getDoc('system', 'users', userId) as UserProfile | null;
      if (profile) {
        const updated = { ...profile, householdId };
        await dbService.setDoc('system', 'users', userId, updated);
      }
    }

    return household;
  },

  async joinHousehold(userId: string, householdId: string): Promise<void> {
    // Check if household exists
    const household = await dbService.getDoc(householdId, 'householdInfo', 'info');
    if (!household) {
      throw new Error('Household ID not found.');
    }

    // Update user profile with household ID
    if (!isFirebaseConfigured || !auth) {
      const userStr = localStorage.getItem(LOCAL_USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr) as UserProfile;
        user.householdId = householdId;
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
        localStorage.setItem(LOCAL_HOUSEHOLD_KEY, householdId);
        window.dispatchEvent(new Event('storage'));
      }
    } else {
      const profile = await dbService.getDoc('system', 'users', userId) as UserProfile | null;
      if (profile) {
        const updated = { ...profile, householdId, role: 'member' as const };
        await dbService.setDoc('system', 'users', userId, updated);
      }
    }
  }
};
