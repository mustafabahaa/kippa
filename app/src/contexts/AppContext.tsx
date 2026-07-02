import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authLib } from '@/libs/auth';
import { ledgerLib } from '@/libs/ledger';
import { detectBaseCurrency } from '@/libs/currencyMeta';
import { UserProfile, Household } from '@/domain/financeTypes';
import { AppContext } from '@/contexts/appContextInstance';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = authLib.onAuthStateChanged((profile) => {
      setUserProfile(profile);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Ensure active household exists in Firestore
  useEffect(() => {
    if (userProfile?.householdId && userProfile?.uid) {
      ledgerLib.ensureHouseholdExists(userProfile.householdId, userProfile.uid, 'My Household');
    }
  }, [userProfile?.householdId, userProfile?.uid]);

  const householdId = userProfile?.householdId || '';

  // Query user households
  const { data: userHouseholds = [], isLoading: isLoadingHouseholds } = useQuery({
    queryKey: ['userHouseholds', userProfile?.householdIds],
    queryFn: async () => {
      if (!userProfile?.householdIds) return [];
      return Promise.all(
        userProfile.householdIds.map(async (id) => {
          const info = await ledgerLib.getHouseholdInfo(id);
          return info || {
            id,
            name: `Household (${id})`,
            baseCurrency: detectBaseCurrency(),
            createdAt: '',
            createdBy: ''
          };
        })
      );
    },
    enabled: !!userProfile?.householdIds,
  });

  const loginWithGoogle = async () => {
    const profile = await authLib.signInWithGoogle();
    setUserProfile(profile);
  };

  const logout = async () => {
    await authLib.logout();
    setUserProfile(null);
    queryClient.clear();
  };

  const switchHousehold = async (id: string) => {
    if (!userProfile) return;
    const updatedProfile = await authLib.switchHousehold(userProfile.uid, id);
    setUserProfile(updatedProfile);
  };

  const createHousehold = async (name: string): Promise<Household> => {
    if (!userProfile) throw new Error('Not authenticated');
    const household = await authLib.createHousehold(userProfile.uid, name);
    // Refresh user profile after creating household
    const updatedProfile = await authLib.getUserProfile(userProfile.uid);
    if (updatedProfile) {
      setUserProfile(updatedProfile);
    }
    return household;
  };

  const joinHousehold = async (id: string) => {
    if (!userProfile) return;
    await authLib.joinHousehold(userProfile.uid, id);
    const updatedProfile = await authLib.getUserProfile(userProfile.uid);
    if (updatedProfile) {
      setUserProfile(updatedProfile);
    }
  };

  const leaveHousehold = async (id: string) => {
    if (!userProfile) return;
    const updatedProfile = await authLib.leaveHousehold(userProfile.uid, id);
    setUserProfile(updatedProfile);
  };

  const updateUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  return (
    <AppContext.Provider
      value={{
        userProfile,
        householdId,
        isAuthLoading,
        userHouseholds,
        isLoadingHouseholds,
        loginWithGoogle,
        logout,
        switchHousehold,
        createHousehold,
        joinHousehold,
        leaveHousehold,
        updateUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
