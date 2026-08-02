import { useReducer, type SetStateAction } from 'react';
import type { CardKind, CardNetwork, CurrencyCode } from '@kippa/domain';

type State = { bankId: string; creditLimit: number | ''; currency: CurrencyCode; error: string; expiryMonth: number | ''; expiryYear: number | ''; kind: CardKind; last4: string; name: string; network: CardNetwork; parentAccountId: string; paymentAccountId: string; step: 'bank' | 'details'; tierId: string };
type Action = { [Key in keyof State]: { key: Key; value: SetStateAction<State[Key]> } }[keyof State];

export function useAddCardForm(currency: CurrencyCode, accountId: string) {
  const [state, dispatch] = useReducer((current: State, action: Action) => ({ ...current, [action.key]: typeof action.value === 'function' ? (action.value as (previous: State[typeof action.key]) => State[typeof action.key])(current[action.key]) : action.value }), { bankId: '', creditLimit: '', currency, error: '', expiryMonth: '', expiryYear: '', kind: 'debit', last4: '', name: '', network: 'visa', parentAccountId: accountId, paymentAccountId: accountId, step: 'bank', tierId: '' });
  const setter = <Key extends keyof State>(key: Key) => (value: SetStateAction<State[Key]>) => dispatch({ key, value } as Action);
  return { ...state, setBankId: setter('bankId'), setCreditLimit: setter('creditLimit'), setCurrency: setter('currency'), setError: setter('error'), setExpiryMonth: setter('expiryMonth'), setExpiryYear: setter('expiryYear'), setKind: setter('kind'), setLast4: setter('last4'), setName: setter('name'), setNetwork: setter('network'), setParentAccountId: setter('parentAccountId'), setPaymentAccountId: setter('paymentAccountId'), setStep: setter('step'), setTierId: setter('tierId') };
}
