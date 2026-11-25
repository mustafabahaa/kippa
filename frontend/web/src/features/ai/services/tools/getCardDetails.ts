import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { cyclesLib } from '@/libs/cycles';
import { cardsLib } from '@/libs/cards';
import { calculateAccountBalance } from '@/libs/financeCalculations';
import { calculateCardActivity } from '@/libs/cardActivity';
import { computeCardSummary, currentCyclePurchases } from '@/libs/cardSelectors';
import { defineAiTool } from '../toolRegistry';
import { id, trimCardActivity } from './shared';

export const getCardDetailsTool = defineAiTool({
  description:
    'Get the same debt, available-credit, utilization, statement, due-date, current-purchases, and charge-payment details shown by the card UI. totalDebt sums unpaid charges; unallocatedCredit lists payments/credits that reduced the ledger balance but applied to no charge (accountBalance = unallocatedCredit - totalDebt), so the reconciled debt owed is Math.max(0, -accountBalance). Charge history is trimmed to unpaid plus the 20 most recent charges unless includeFullHistory is true.',
  inputSchema: z.object({ cardId: id, includeFullHistory: z.boolean().optional() }).strict(),
  risk: 'read',
  async execute({ cardId, includeFullHistory }, context) {
    const [cards, statements, accounts, cycles] = await Promise.all([
      cardsLib.getCards(context.householdId),
      cardsLib.getStatements(context.householdId, cardId),
      ledgerLib.getAccounts(context.householdId),
      cyclesLib.getCycles(context.householdId),
    ]);
    const card = cards.find((item) => item.id === cardId);
    if (!card) throw new Error('Card not found.');
    const { transactions, lines: ledgerLines } = await ledgerLib.getAccountHistory(
      context.householdId,
      accounts.filter((account) => account.id === card.parentAccountId),
    );
    const balance = calculateAccountBalance(card.parentAccountId, transactions, ledgerLines);
    const lastStatement = statements[0] ?? null;
    const summary = computeCardSummary(card, balance, lastStatement);
    summary.currentCyclePurchases = currentCyclePurchases(
      ledgerLines,
      transactions,
      card.parentAccountId,
      lastStatement,
    );
    const fullActivity = calculateCardActivity(card.parentAccountId, transactions, ledgerLines, cycles);
    return { card, summary, activity: includeFullHistory ? fullActivity : trimCardActivity(fullActivity) };
  },
});
