import { createContext } from 'react';
import { UserProfile, Household } from '@/domain/financeTypes';

export interface AppContextType {
  userProfile: UserProfile | null;
  householdId: string;
  isAuthLoading: boolean;
  userHouseholds: Household[];
  isLoadingHouseholds: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchHousehold: (id: string) => Promise<void>;
  createHousehold: (name: string) => Promise<Household>;
  joinHousehold: (id: string) => Promise<void>;
  leaveHousehold: (id: string) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
