import { createContext } from 'react';
import { UserProfile, Household, JoinStatus, JoinRequest, HouseholdMember } from '@/domain/financeTypes';

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
  requestToJoinHousehold: (id: string) => Promise<JoinStatus>;
  decideJoinRequest: (householdId: string, requesterUid: string, decision: 'approve' | 'reject') => Promise<void>;
  leaveHousehold: (id: string) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => void;
  pendingRequests: JoinRequest[];
  householdMembers: HouseholdMember[];
  isMembersLoading: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
