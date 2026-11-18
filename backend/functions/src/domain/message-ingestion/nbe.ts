import type { ParsedFinancialMessage, ParseResult } from './parser.js';

const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const easternArabicDigits = '۰۱۲۳۴۵۶۷۸۹';
const cairoCalendar = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const amountPattern = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?`;
const timePattern = String.raw`الساع[هة] (?:[01]\d|2[0-3]):[0-5]\d(?:\s|$)`;

const purchaseAmount = String.raw`(?:(?<leadingCurrency>[A-Z]{3}) (?<leadingAmount>${amountPattern})|(?<trailingAmount>${amountPattern}) (?<trailingCurrency>[A-Z]{3}))`;
const debitPurchase = new RegExp(
  String.raw`^تم خصم ${purchaseAmount} من بطاقة الخصم المباشر رقم \**(?<account>\d{4}) عند (?<party>.+?) يوم (?<day>\d{2})\/(?<month>\d{2})\/(?<year>\d{2}|\d{4}) ${timePattern}`,
  'i',
);

// This verified withdrawal template uses a generic card label and a month-day date.
const atmWithdrawal = new RegExp(
  String.raw`^تم خصم (?<amount>${amountPattern})\s*(?<currency>[A-Z]{3}) من البطاقة رقم \**(?<account>\d{4}) عند (?<party>.+?) يوم (?<month>\d{2})-(?<day>\d{2}) ${timePattern}`,
  'i',
);

const transferDetails = String.raw`رقم \**(?<account>\d{4}) بمبلغ (?<amount>${amountPattern}) جم`;
const transferDate = String.raw`رقم مرجعي \d+ يوم (?<month>\d{2})-(?<day>\d{2}) ${timePattern}`;
const instantTransfers = [
  {
    pattern: new RegExp(String.raw`^تم [إا]ضافة تحويل لحظي لحسابكم ${transferDetails} من (?<party>.+?) ${transferDate}`),
    kind: 'income',
    description: 'Transfer from',
  },
  {
    pattern: new RegExp(String.raw`^تم تنفيذ تحويل لحظي من حسابكم ${transferDetails} [إا]لى (?<party>.+?) ${transferDate}`),
    kind: 'expense',
    description: 'Transfer to',
  },
] as const;

function normalizeMessage(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicDigits.indexOf(digit)))
    .replace(/[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/٫/g, '.')
    .replace(/٬/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferYear(month: string, day: string) {
  const today = Object.fromEntries(cairoCalendar.formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return String(Number(today.year) - Number(`${month}-${day}` > `${today.month}-${today.day}`));
}

function bankTransaction(
  kind: ParsedFinancialMessage['kind'],
  groups: Record<string, string>,
  currency: string,
  amountText: string,
  year: string,
  description: string,
): ParseResult {
  const amount = Number(amountText.replace(/,/g, ''));
  const date = `${year}-${groups.month}-${groups.day}`;
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date) {
    return { outcome: 'unsupported', reason: 'NBE transaction amount or date is invalid.' };
  }

  return {
    outcome: 'matched',
    parsed: {
      kind,
      provider: 'nbe',
      accountKind: 'bank',
      accountHintLast4: groups.account,
      amount,
      currency,
      date,
      description,
      counterparty: groups.party,
    },
  };
}

export function parseNbeMessage(raw: string): ParseResult {
  const text = normalizeMessage(raw);
  const purchase = text.match(debitPurchase)?.groups;
  if (purchase) {
    const currency = purchase.leadingCurrency ?? purchase.trailingCurrency;
    const amount = purchase.leadingAmount ?? purchase.trailingAmount;
    const year = purchase.year.length === 2 ? `20${purchase.year}` : purchase.year;
    return bankTransaction('expense', purchase, currency.toUpperCase(), amount, year, purchase.party);
  }

  const withdrawal = text.match(atmWithdrawal)?.groups;
  if (withdrawal) {
    const result = bankTransaction(
      'transfer', withdrawal, withdrawal.currency.toUpperCase(), withdrawal.amount,
      inferYear(withdrawal.month, withdrawal.day), 'ATM cash withdrawal',
    );
    if (result.outcome !== 'matched') return result;
    return { outcome: 'matched', parsed: { ...result.parsed, destinationKind: 'cash', counterparty: 'Cash' } };
  }

  for (const { pattern, kind, description } of instantTransfers) {
    const transfer = text.match(pattern)?.groups;
    if (!transfer) continue;
    const year = inferYear(transfer.month, transfer.day);
    return bankTransaction(kind, transfer, 'EGP', transfer.amount, year, `${description} ${transfer.party}`);
  }

  return { outcome: 'unsupported', reason: 'No supported NBE transaction was found.' };
}

// The raw templates can include available balances, references, and contact details.
export function buildNbeMessagePreview(): string {
  return 'National Bank of Egypt bank message';
}
