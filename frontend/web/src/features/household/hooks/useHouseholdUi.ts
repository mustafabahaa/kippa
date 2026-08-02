import { useReducer, type SetStateAction } from 'react';
import type { Household } from '@kippa/domain';
type State = { actionLoading: boolean; baseCurrencyLoading: boolean; copied: boolean; householdIdToJoin: string; householdToLeave: Household | null; newHouseholdName: string; tabValue: number };
type Action = { [Key in keyof State]-?: { key: Key; value: SetStateAction<State[Key]> } }[keyof State];
export function useHouseholdUi() {
  const [state, dispatch] = useReducer((current: State, action: Action) => ({ ...current, [action.key]: typeof action.value === 'function' ? (action.value as (previous: State[typeof action.key]) => State[typeof action.key])(current[action.key]) : action.value }), { actionLoading: false, baseCurrencyLoading: false, copied: false, householdIdToJoin: '', householdToLeave: null, newHouseholdName: '', tabValue: 0 });
  const setter = <Key extends keyof State>(key: Key) => (value: SetStateAction<State[Key]>) => dispatch({ key, value } as Action);
  return { ...state, setActionLoading: setter('actionLoading'), setBaseCurrencyLoading: setter('baseCurrencyLoading'), setCopied: setter('copied'), setHouseholdIdToJoin: setter('householdIdToJoin'), setHouseholdToLeave: setter('householdToLeave'), setNewHouseholdName: setter('newHouseholdName'), setTabValue: setter('tabValue') };
}
