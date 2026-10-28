import type { BudgetCycle, FinanceTransaction, LedgerLine, TransactionType } from '@kippa/domain';
import { getPostedLedgerLines } from './financeCalculations';

export type CardCharge = {
  lineId: string;
  txId: string;
  date: string;
  description: string | null;
  amount: number;
  baseAmount?: number;
  feeRate?: number;
  paid: boolean;
  txType: TransactionType;
  categoryId: string | null;
  budgetCycleId: string | null;
};
export type CardChargeGroup = {
  groupId: string;
  cycleName: string;
  cycleDateRange: string;
  startDate: string;
  charges: CardCharge[];
};
/**
 * A payment or credit on the credit account that reduced the ledger balance
 * but was not applied to any charge: the remainder of an over-paying
 * settlement (e.g. a fee-inclusive payment against a charge recorded without
 * its fee) or pool money no charge fully consumed.
 */
export type UnallocatedCredit = {
  txId: string;
  date: string;
  description: string | null;
  amount: number;
};

function formatDateRange(startDate: string, endDate?: string | null) {
  const format = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${format(startDate)} – ${endDate ? format(endDate) : 'Present'}`;
}

export function calculateCardActivity(
  accountId: string,
  transactions: FinanceTransaction[],
  lines: LedgerLine[],
  cycles: BudgetCycle[],
) {
  const transactionById = new Map(transactions.map((transaction) => [transaction.id, transaction]));
  const accountLines = getPostedLedgerLines(transactions, lines)
    .filter((line) => line.accountId === accountId)
    .sort((a, b) =>
      (transactionById.get(b.transactionId)?.date ?? '').localeCompare(
        transactionById.get(a.transactionId)?.date ?? '',
      ),
    );
  const chargeAmountByTxId = new Map<string, number>();
  accountLines
    .filter((line) => line.signedAmount < 0)
    .forEach((line) => chargeAmountByTxId.set(line.transactionId, Math.abs(line.signedAmount)));
  const chargeIds = new Set(chargeAmountByTxId.keys());
  const explicitlySettled = new Set<string>();
  // Credit each charge has already absorbed from explicit settlements; a second
  // payment naming the same charge must not absorb its amount twice.
  const claimedByCharge = new Map<string, number>();
  const unallocatedCredits: UnallocatedCredit[] = [];
  type PoolSlot = { entry: UnallocatedCredit; remaining: number };
  const poolByCycle = new Map<string, PoolSlot[]>();

  accountLines
    .filter((line) => line.signedAmount > 0)
    .forEach((line) => {
      const transaction = transactionById.get(line.transactionId);
      const entry: UnallocatedCredit = {
        txId: line.transactionId,
        date: transaction?.date ?? '',
        description: transaction?.description ?? null,
        amount: 0,
      };
      if (transaction?.settlesChargeIds?.length) {
        transaction.settlesChargeIds.filter((id) => chargeIds.has(id)).forEach((id) => explicitlySettled.add(id));
        // Apply the payment to the charges it names, first-come-first-served;
        // whatever exceeds their recorded amounts is unapplied credit.
        let unapplied = line.signedAmount;
        transaction.settlesChargeIds.forEach((id) => {
          const chargeAmount = chargeAmountByTxId.get(id);
          if (chargeAmount == null || unapplied <= 0) return;
          const outstanding = chargeAmount - (claimedByCharge.get(id) ?? 0);
          if (outstanding <= 0) return;
          const applied = Math.min(outstanding, unapplied);
          claimedByCharge.set(id, (claimedByCharge.get(id) ?? 0) + applied);
          unapplied -= applied;
        });
        if (unapplied > 0) unallocatedCredits.push({ ...entry, amount: unapplied });
      } else {
        const cycleId = transaction?.budgetCycleId ?? 'uncategorized';
        const bucket = poolByCycle.get(cycleId) ?? [];
        bucket.push({ entry, remaining: line.signedAmount });
        poolByCycle.set(cycleId, bucket);
      }
    });

  const consumePool = (cycleId: string, amount: number) => {
    const bucket = poolByCycle.get(cycleId);
    if (!bucket) return;
    let toConsume = amount;
    bucket.forEach((slot) => {
      if (toConsume <= 0) return;
      const take = Math.min(slot.remaining, toConsume);
      slot.remaining -= take;
      toConsume -= take;
    });
    poolByCycle.set(
      cycleId,
      bucket.filter((slot) => slot.remaining > 0),
    );
  };
  const poolRemaining = (cycleId: string) =>
    (poolByCycle.get(cycleId) ?? []).reduce((total, slot) => total + slot.remaining, 0);

  const charges = accountLines.flatMap<CardCharge>((line) => {
    const transaction = transactionById.get(line.transactionId);
    if (!transaction || line.signedAmount >= 0) return [];
    const cycleId = transaction.budgetCycleId ?? 'uncategorized';
    const amount = Math.abs(line.signedAmount);
    let paid = explicitlySettled.has(transaction.id);
    if (!paid && poolRemaining(cycleId) >= amount) {
      paid = true;
      consumePool(cycleId, amount);
    }
    return [
      {
        lineId: line.id,
        txId: transaction.id,
        date: transaction.date,
        description: transaction.description ?? null,
        amount,
        baseAmount: line.cardFee?.baseAmount ?? amount,
        feeRate: line.cardFee?.rate ?? 0,
        paid,
        txType: transaction.type,
        categoryId: transaction.categoryId ?? null,
        budgetCycleId: transaction.budgetCycleId ?? null,
      },
    ];
  });

  const groups = new Map<string, CardChargeGroup>();
  charges.forEach((charge) => {
    const cycle = cycles.find((candidate) => candidate.id === charge.budgetCycleId);
    const groupId = cycle?.id ?? 'uncategorized';
    if (!groups.has(groupId))
      groups.set(groupId, {
        groupId,
        cycleName: cycle?.name ?? 'Uncategorized',
        cycleDateRange: cycle ? formatDateRange(cycle.startDate, cycle.endDate) : '',
        startDate: cycle?.startDate ?? '0000-00-00',
        charges: [],
      });
    groups.get(groupId)!.charges.push(charge);
  });
  const cycleGroups = [...groups.values()].sort((a, b) =>
    a.groupId === 'uncategorized' ? 1 : b.groupId === 'uncategorized' ? -1 : b.startDate.localeCompare(a.startDate),
  );
  const unpaidCharges = charges.filter((charge) => !charge.paid);
  const totalDebt = unpaidCharges.reduce((total, charge) => total + charge.amount, 0);
  // Everything the ledger credits vs. what paid charges actually absorbed.
  // Signed on purpose: negative means charges were marked settled by less
  // money than their recorded amounts (underpaid settlements). Reconciles the
  // two debt views: accountBalance === unallocatedCredit - totalDebt.
  const totalPositive = accountLines.reduce((total, line) => total + (line.signedAmount > 0 ? line.signedAmount : 0), 0);
  const paidChargeTotal = charges
    .filter((charge) => charge.paid)
    .reduce((total, charge) => total + charge.amount, 0);
  const unallocatedCredit = totalPositive - paidChargeTotal;
  // Pool money no charge consumed is unapplied credit too.
  [...poolByCycle.values()].flat().forEach((slot) => {
    if (slot.remaining > 0) unallocatedCredits.push({ ...slot.entry, amount: slot.remaining });
  });
  unallocatedCredits.sort((a, b) => b.date.localeCompare(a.date));
  return {
    accountBalance: accountLines.reduce((total, line) => total + line.signedAmount, 0),
    charges,
    cycleGroups,
    totalDebt,
    unallocatedCredit,
    unallocatedCredits,
  };
}
