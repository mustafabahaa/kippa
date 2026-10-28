import { z } from 'zod';
import { currencyLib } from '@/libs/currency';
import { defineAiTool } from '../toolRegistry';
import { currency, money } from './shared';

export const convertCurrencyTool = defineAiTool({
  description:
    'Convert an amount between currencies using the live exchange rate. Required before adding or comparing amounts held in different currencies.',
  inputSchema: z.object({ amount: money, from: currency, to: currency }).strict(),
  risk: 'read',
  async execute({ amount, from, to }) {
    const rate = await currencyLib.getRate(from, to);
    return { amount, from, to, rate, convertedAmount: Number((amount * rate).toFixed(2)) };
  },
});
