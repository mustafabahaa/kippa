import { useReducer, type SetStateAction } from 'react';
import type { FinanceTransaction } from '@kippa/domain';
type State = {
  editingTx: FinanceTransaction | null;
  searchTerm: string;
  selectedAccountIds: string[] | null;
  selectedCategoryIds: string[] | null;
  selectedCycleId: string;
  visibleCount: number;
};
type Action = { [Key in keyof State]-?: { key: Key; value: SetStateAction<State[Key]> } }[keyof State];
const PAGE_SIZE = 25;
export function useTransactionHistoryUi() {
  const [state, dispatch] = useReducer(
    (current: State, action: Action) => ({
      ...current,
      [action.key]:
        typeof action.value === 'function'
          ? (action.value as (previous: State[typeof action.key]) => State[typeof action.key])(current[action.key])
          : action.value,
    }),
    {
      editingTx: null,
      searchTerm: '',
      selectedAccountIds: null,
      selectedCategoryIds: null,
      selectedCycleId: 'active',
      visibleCount: PAGE_SIZE,
    },
  );
  const setter =
    <Key extends keyof State>(key: Key) =>
    (value: SetStateAction<State[Key]>) =>
      dispatch({ key, value } as Action);
  return {
    ...state,
    loadMore: () => dispatch({ key: 'visibleCount', value: (previous: number) => previous + PAGE_SIZE }),
    resetPage: () => dispatch({ key: 'visibleCount', value: PAGE_SIZE }),
    setEditingTx: setter('editingTx'),
    setSearchTerm: setter('searchTerm'),
    setSelectedAccountIds: setter('selectedAccountIds'),
    setSelectedCategoryIds: setter('selectedCategoryIds'),
    setSelectedCycleId: setter('selectedCycleId'),
  };
}
