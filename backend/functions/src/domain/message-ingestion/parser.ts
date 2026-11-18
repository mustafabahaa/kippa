import type { MessageIngestionBank } from '@kippa/domain';
import { buildHsbcMessagePreview, parseHsbcMessage } from './hsbc.js';
import { buildNbeMessagePreview, parseNbeMessage } from './nbe.js';

export type ParsedFinancialMessage = {
  kind: 'expense' | 'income' | 'transfer';
  provider: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  counterparty?: string;
  accountHintLast4?: string;
  destinationHintLast4?: string;
  accountKind: 'bank' | 'credit-card';
  destinationKind?: 'cash' | 'credit-card';
  /** Marks one leg of a multi-message cross-currency transfer so the ingestion layer can merge them. */
  transferLeg?: 'debit' | 'credit';
  /** Shared key used to correlate matching transfer legs. */
  mergeKey?: string;
};

export type ParseResult =
  | { outcome: 'matched'; parsed: ParsedFinancialMessage }
  | { outcome: 'notification'; title: string; message: string; deepLink: string }
  | { outcome: 'ignored'; reason: string }
  | { outcome: 'unsupported'; reason: string };

type BankParser = {
  parse: (raw: string, source: string) => ParseResult;
  preview: (raw: string) => string;
};

const bankParsers = {
  hsbc: { parse: parseHsbcMessage, preview: buildHsbcMessagePreview },
  nbe: { parse: parseNbeMessage, preview: buildNbeMessagePreview },
} satisfies Record<MessageIngestionBank, BankParser>;

export const DEFAULT_MESSAGE_BANK: MessageIngestionBank = 'hsbc';

export function isMessageBank(value: unknown): value is MessageIngestionBank {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(bankParsers, value);
}

export function parseFinancialMessage(raw: string, source = 'sms', bank: MessageIngestionBank = DEFAULT_MESSAGE_BANK): ParseResult {
  return bankParsers[bank].parse(raw, source);
}

export function buildMessagePreview(raw: string, bank: MessageIngestionBank = DEFAULT_MESSAGE_BANK): string {
  return bankParsers[bank].preview(raw);
}
