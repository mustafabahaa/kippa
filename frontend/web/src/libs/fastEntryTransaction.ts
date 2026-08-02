import type { Account, BudgetCycle, Category } from '@kippa/domain';

export type EntryMode = 'expense' | 'income' | 'transfer';
type Input = { activeCycle: BudgetCycle | null; amountText: string; category: Category | null; createdBy: string; date: string; description: string; destinationAccount: Account | null; destinationAmountText: string; mode: EntryMode; sourceAccount: Account | null };

export function buildFastEntryTransaction(input: Input) {
  const amount = Number(input.amountText);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Please enter a valid amount');
  if (!input.sourceAccount) throw new Error('Please select a From Account');
  if (input.mode !== 'transfer' && !input.category) throw new Error('Please select a category before continuing');
  const common = { date: input.date, budgetCycleId: input.activeCycle?.id ?? null, createdBy: input.createdBy };
  if (input.mode === 'expense' || input.mode === 'income') {
    const income = input.mode === 'income';
    return { transaction: { ...common, type: input.mode, description: input.description || (income ? 'Income' : null), categoryId: input.category!.id }, lines: [{ accountId: input.sourceAccount.id, signedAmount: income ? amount : -amount, currency: input.sourceAccount.currency }] };
  }
  const destination = input.destinationAccount;
  if (!destination) throw new Error('Please select a Destination Account');
  if (destination.id === input.sourceAccount.id) throw new Error('Source and Destination accounts must be different');
  const crossCurrency = destination.currency !== input.sourceAccount.currency;
  const destinationAmount = crossCurrency ? Number(input.destinationAmountText) : amount;
  if (!Number.isFinite(destinationAmount) || destinationAmount <= 0) throw new Error('Please enter a valid destination amount');
  return {
    transaction: { ...common, type: 'transfer' as const, description: input.description || (crossCurrency ? `${input.sourceAccount.currency} to ${destination.currency} Transfer` : 'Transfer') },
    lines: [{ accountId: input.sourceAccount.id, signedAmount: -amount, currency: input.sourceAccount.currency }, { accountId: destination.id, signedAmount: destinationAmount, currency: destination.currency }],
    ...(crossCurrency ? { conversionDetails: { fromCurrency: input.sourceAccount.currency, toCurrency: destination.currency, fromAmount: amount, toAmount: destinationAmount, effectiveRate: destinationAmount / amount, rateSource: 'manual' as const } } : {}),
  };
}
