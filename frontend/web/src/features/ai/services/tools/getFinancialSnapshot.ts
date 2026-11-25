import { ledgerLib } from '@/libs/ledger';
import { getLedgerSnapshot } from '@/libs/ledgerSummaries';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const getFinancialSnapshotTool = defineAiTool({
  description:
    'Get current active account balances and household base currency. Use for balance and available-money questions.',
  inputSchema: emptyInput,
  risk: 'read',
  async execute(...[, context]) {
    const [accounts, snapshot, household] = await Promise.all([
      ledgerLib.getAccounts(context.householdId),
      getLedgerSnapshot(context.householdId),
      ledgerLib.getHouseholdInfo(context.householdId),
    ]);
    const { balances } = snapshot;
    return {
      asOf: new Date().toISOString(),
      baseCurrency: household?.baseCurrency ?? null,
      accounts: accounts
        .filter((account) => account.isActive)
        .map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          balance: Number((balances[account.id] ?? 0).toFixed(2)),
        })),
    };
  },
});
