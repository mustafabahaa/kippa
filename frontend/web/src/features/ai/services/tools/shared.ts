import { z } from 'zod';
import type { Account, Category } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { calculateCardActivity } from '@/libs/cardActivity';
import type { AiToolContext } from '../toolRegistry';

export const emptyInput = z.object({}).strict();
export const id = z.string().trim().min(1).max(128);
export const name = z.string().trim().min(1).max(80);
export const currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/);
export const money = z.number().positive().max(1_000_000_000);
export const signedMoney = z
  .number()
  .min(-1_000_000_000)
  .max(1_000_000_000)
  .refine((value) => value !== 0);
export const isoDate = z.iso.date();
export const cardNetwork = z.enum(['visa', 'mastercard', 'meeza', 'other']);
export const cardDetails = {
  name,
  last4: z.string().trim().max(4).optional(),
  network: cardNetwork.optional(),
  bankId: z.string().trim().min(1).max(80),
  tierId: z.string().trim().max(80).optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2020).max(2200).optional(),
  currency,
};
export const allocationInput = z
  .object({
    budgetCycleId: id,
    categoryId: id,
    plannedAmount: z.number().min(0).max(1_000_000_000),
    currency,
    carryLeftover: z.boolean().default(false),
    notes: z.string().trim().max(240).nullable().optional(),
  })
  .strict();
export const chartSchema = z
  .object({
    type: z.enum(['bar', 'line', 'pie']),
    title: z.string().trim().min(1).max(100),
    labels: z.array(z.string().trim().min(1).max(40)).min(1).max(50),
    series: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(40),
            data: z.array(z.number().min(-1_000_000_000).max(1_000_000_000)).min(1).max(50),
          })
          .strict(),
      )
      .min(1)
      .max(4),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.type === 'pie' && value.series.length !== 1)
      ctx.addIssue({ code: 'custom', message: 'Pie charts require exactly one series.' });
    value.series.forEach((series, index) => {
      if (series.data.length !== value.labels.length)
        ctx.addIssue({
          code: 'custom',
          path: ['series', index, 'data'],
          message: 'Every series must have one value per label.',
        });
    });
  });

export const auditUser = (context: AiToolContext) => ({
  uid: context.userId,
  displayName: context.userDisplayName || 'Kippa user',
  photoURL: context.userPhotoURL,
});

export async function requireAccount(householdId: string, accountId: string): Promise<Account> {
  const account = (await ledgerLib.getAccounts(householdId)).find((item) => item.id === accountId);
  if (!account) throw new Error('Account not found in this household.');
  return account;
}

export async function requireCategory(householdId: string, categoryId: string): Promise<Category> {
  const category = (await ledgerLib.getCategories(householdId)).find((item) => item.id === categoryId);
  if (!category) throw new Error('Category not found in this household.');
  return category;
}

/** Keep unpaid charges plus a recent window; the model can opt into the full history explicitly. */
export function trimCardActivity(activity: ReturnType<typeof calculateCardActivity>) {
  const unpaid = activity.charges.filter((charge) => !charge.paid);
  const recent = [...activity.charges].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const kept = new Map([...unpaid, ...recent].map((charge) => [charge.lineId, charge]));
  const keptIds = new Set(kept.keys());
  const cycleGroups = activity.cycleGroups
    .map((group) => ({ ...group, charges: group.charges.filter((charge) => keptIds.has(charge.lineId)) }))
    .filter((group) => group.charges.length > 0);
  return {
    accountBalance: activity.accountBalance,
    totalDebt: activity.totalDebt,
    // Payments/credits that reduced the balance but applied to no charge;
    // accountBalance === unallocatedCredit - totalDebt, so
    // Math.max(0, -accountBalance) is the reconciled debt the user owes.
    unallocatedCredit: activity.unallocatedCredit,
    unallocatedCredits: activity.unallocatedCredits,
    charges: [...kept.values()].sort((a, b) => b.date.localeCompare(a.date)),
    cycleGroups,
    totalChargeCount: activity.charges.length,
    truncated: kept.size < activity.charges.length,
  };
}
