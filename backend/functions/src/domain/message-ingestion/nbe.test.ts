import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildMessagePreview, isMessageBank, parseFinancialMessage } from './parser.js';

const purchase =
  'تم خصم EGP 123.4 من بطاقة الخصم المباشر رقم 0000 عند EXAMPLE*MARKET يوم 15/01/30 الساعه 14:02 المتاح 9876.54EGP للمزيد إتصل ب 00000';

const incoming =
  'تم إضافة تحويل لحظي لحسابكم رقم 0000 بمبلغ 12.34 جم من EXAMPLE SENDER رقم مرجعي 000001 يوم 01-15 الساعة 01:20 للمزيد اتصل بـ 00000';
const outgoing =
  'تم تنفيذ تحويل لحظي من حسابكم رقم 0000 بمبلغ 56.78 جم إلى EXAMPLE RECIPIENT رقم مرجعي 000002 يوم 01-13 الساعة 09:42 للمزيد اتصل بـ 00000';

describe('National Bank of Egypt message parsing', () => {
  afterEach(() => vi.useRealTimers());

  it('turns a debit-card SMS into a bank expense and redacts the stored preview', () => {
    expect(parseFinancialMessage(purchase, 'message-automation', 'nbe')).toEqual({
      outcome: 'matched',
      parsed: {
        provider: 'nbe',
        kind: 'expense',
        accountKind: 'bank',
        accountHintLast4: '0000',
        amount: 123.4,
        currency: 'EGP',
        date: '2030-01-15',
        description: 'EXAMPLE*MARKET',
        counterparty: 'EXAMPLE*MARKET',
      },
    });
    expect(buildMessagePreview(purchase, 'nbe')).toBe('National Bank of Egypt bank message');
  });

  it('handles Arabic numerals, directional marks and a multiline merchant name', () => {
    const message =
      'تم خصم \u200eEGP ١٬٢٣٤٫٥٠ من بطاقة الخصم المباشر رقم ٠٠٠١ عند EXAMPLE\nSHOP يوم ١٥/٠١/٣٠ الساعة ١٤:٠٢';
    expect(parseFinancialMessage(message, 'sms', 'nbe')).toMatchObject({
      outcome: 'matched',
      parsed: { amount: 1234.5, accountHintLast4: '0001', description: 'EXAMPLE SHOP', date: '2030-01-15' },
    });
  });

  it('accepts the amount before the ISO currency with irregular spacing', () => {
    const message = purchase.replace('EGP 123.4', '123.4 EGP  ').replace('EXAMPLE*MARKET', 'EXAMPLE*SHOP      TEST');
    expect(parseFinancialMessage(message, 'sms', 'nbe')).toMatchObject({
      outcome: 'matched',
      parsed: { kind: 'expense', amount: 123.4, currency: 'EGP', description: 'EXAMPLE*SHOP TEST' },
    });
  });

  it.each([
    {
      raw: incoming,
      kind: 'income',
      hsbc: '********0000 was credited with IPN inward transfer for EGP 12.34 on 15-01-2030 from EXAMPLE SENDER with reference TEST.',
    },
    {
      raw: outgoing,
      kind: 'expense',
      hsbc: 'Your HSBC Account ********0000 was debited with IPN outward transfer for EGP 56.78 on 13-01-2030 to EXAMPLE RECIPIENT with reference TEST.',
    },
  ])('maps an NBE instant transfer like the HSBC equivalent ($kind)', ({ raw, hsbc, kind }) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-18T12:00:00Z'));
    const reference = parseFinancialMessage(hsbc, 'sms', 'hsbc');
    expect(reference.outcome).toBe('matched');
    if (reference.outcome !== 'matched') throw new Error('Invalid HSBC test fixture.');
    expect(reference.parsed.kind).toBe(kind);
    expect(parseFinancialMessage(raw, 'sms', 'nbe')).toEqual({
      outcome: 'matched',
      parsed: { ...reference.parsed, provider: 'nbe' },
    });
    expect(buildMessagePreview(raw, 'nbe')).toBe('National Bank of Egypt bank message');
  });

  it.each(['250EGP', '250 EGP', '٢٥٠EGP'])('maps the verified ATM template to an HSBC-style cash transfer (%s)', (amount) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-18T12:00:00Z'));
    const message = `تم خصم ${amount} من البطاقة رقم 0000 عند EXAMPLE ATM يوم 01-15 الساعة 20:18 المتاح 999.1 جم للمزيد اتصل ب 00000`;
    expect(parseFinancialMessage(message, 'sms', 'nbe')).toEqual({
      outcome: 'matched',
      parsed: {
        provider: 'nbe', kind: 'transfer', accountKind: 'bank', destinationKind: 'cash',
        accountHintLast4: '0000', amount: 250, currency: 'EGP', date: '2030-01-15',
        description: 'ATM cash withdrawal', counterparty: 'Cash',
      },
    });
    expect(parseFinancialMessage(
      'From HSBC: 15JAN30 ATM Cash Withdrawal from 0000 EGP 250-',
    )).toMatchObject({ outcome: 'matched', parsed: {
      kind: 'transfer', destinationKind: 'cash', amount: 250, description: 'ATM cash withdrawal',
    } });
  });

  it('rejects malformed amounts and dates in the withdrawal template', () => {
    for (const message of [
      'تم خصم 0EGP من البطاقة رقم 0000 عند EXAMPLE ATM يوم 01-15 الساعة 20:18',
      'تم خصم 250EGP من البطاقة رقم 0000 عند EXAMPLE ATM يوم 02-30 الساعة 20:18',
      'تم خصم 250EGP من البطاقة رقم 0000 عند EXAMPLE ATM يوم 01-15 الساعة 29:18',
    ]) expect(parseFinancialMessage(message, 'sms', 'nbe').outcome).toBe('unsupported');
  });

  it('uses Cairo day boundaries and assigns a prior December transfer to the previous year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-12-31T22:30:00Z')); // January 1 in Cairo.
    for (const [monthDay, date] of [['12-31', '2030-12-31'], ['01-01', '2031-01-01']]) {
      expect(parseFinancialMessage(incoming.replace('01-15', monthDay), 'sms', 'nbe')).toMatchObject({
        outcome: 'matched',
        parsed: { date },
      });
    }
  });

  it.each([
    purchase.replace('15/01/30', '31/02/30'),
    purchase.replace('123.4', '0'),
    purchase.replace('123.4', '12,34'),
    purchase.replace('14:02', '25:02'),
    incoming.replace('01-15', '02-30'),
    outgoing.replace('إلى', 'من'),
    'تم إضافة تحويل لحظي لبطاقتكم',
    'تم خصم EGP 100 من خلال سحب نقدي',
  ])('rejects invalid or unsupported templates', (text) => {
    expect(parseFinancialMessage(text, 'sms', 'nbe').outcome).toBe('unsupported');
  });

  it('keeps legacy routing on HSBC and restricts connections to registered bank IDs', () => {
    const hsbc = 'Your Credit Card ending with *** 0000 has been used for EGP 12.34 on 15/01/2030 at EXAMPLE SHOP';
    expect(parseFinancialMessage(hsbc, 'sms')).toEqual(parseFinancialMessage(hsbc, 'sms', 'hsbc'));
    expect(parseFinancialMessage(hsbc, 'sms')).toMatchObject({ outcome: 'matched', parsed: { kind: 'expense' } });
    expect(parseFinancialMessage(hsbc, 'sms', 'nbe').outcome).toBe('unsupported');
    expect(parseFinancialMessage(purchase, 'nbe').outcome).toBe('unsupported');
    expect(isMessageBank('nbe')).toBe(true);
    expect(isMessageBank('constructor')).toBe(false);
  });
});
