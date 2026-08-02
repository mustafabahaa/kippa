import { useReducer } from 'react';

interface DialogState {
  mode: 'closed' | 'rename' | 'add';
  categoryId: string | null;
  value: string;
}

type Action =
  | { type: 'openRename'; categoryId: string; value: string }
  | { type: 'openAdd' }
  | { type: 'change'; value: string }
  | { type: 'close' };

const INITIAL_STATE: DialogState = { mode: 'closed', categoryId: null, value: '' };

function reducer(state: DialogState, action: Action): DialogState {
  switch (action.type) {
    case 'openRename': return { mode: 'rename', categoryId: action.categoryId, value: action.value };
    case 'openAdd': return { mode: 'add', categoryId: null, value: '' };
    case 'change': return { ...state, value: action.value };
    case 'close': return INITIAL_STATE;
  }
}

export function useAllocationCategoryDialogs() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  return {
    ...state,
    openRename: (categoryId: string, value: string) => dispatch({ type: 'openRename', categoryId, value }),
    openAdd: () => dispatch({ type: 'openAdd' }),
    setValue: (value: string) => dispatch({ type: 'change', value }),
    close: () => dispatch({ type: 'close' }),
  };
}
