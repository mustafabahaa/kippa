import type { CurrencyCode } from '@/domain/financeTypes';

export type CurrencyInfo = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalDigits: number;
};

/**
 * Curated list of common world currencies for the picker dropdown.
 * Append-only — adding a currency is a data change, not a code change.
 */
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar',           symbol: '$',   decimalDigits: 2 },
  { code: 'EUR', name: 'Euro',                 symbol: '€',   decimalDigits: 2 },
  { code: 'GBP', name: 'British Pound',       symbol: '£',   decimalDigits: 2 },
  { code: 'EGP', name: 'Egyptian Pound',       symbol: 'E£',  decimalDigits: 2 },
  { code: 'SAR', name: 'Saudi Riyal',          symbol: '﷼',   decimalDigits: 2 },
  { code: 'AED', name: 'UAE Dirham',           symbol: 'د.إ', decimalDigits: 2 },
  { code: 'KWD', name: 'Kuwaiti Dinar',        symbol: 'د.ك', decimalDigits: 3 },
  { code: 'QAR', name: 'Qatari Riyal',         symbol: '﷼',   decimalDigits: 2 },
  { code: 'BHD', name: 'Bahraini Dinar',       symbol: '.د.ب', decimalDigits: 3 },
  { code: 'OMR', name: 'Omani Rial',           symbol: '﷼',   decimalDigits: 3 },
  { code: 'JOD', name: 'Jordanian Dinar',      symbol: 'د.ا', decimalDigits: 3 },
  { code: 'LBP', name: 'Lebanese Pound',       symbol: 'ل.ل', decimalDigits: 2 },
  { code: 'TRY', name: 'Turkish Lira',         symbol: '₺',   decimalDigits: 2 },
  { code: 'INR', name: 'Indian Rupee',         symbol: '₹',   decimalDigits: 2 },
  { code: 'PKR', name: 'Pakistani Rupee',      symbol: '₨',   decimalDigits: 2 },
  { code: 'CNY', name: 'Chinese Yuan',         symbol: '¥',   decimalDigits: 2 },
  { code: 'JPY', name: 'Japanese Yen',         symbol: '¥',   decimalDigits: 0 },
  { code: 'NGN', name: 'Nigerian Naira',       symbol: '₦',   decimalDigits: 2 },
  { code: 'ZAR', name: 'South African Rand',   symbol: 'R',   decimalDigits: 2 },
  { code: 'CAD', name: 'Canadian Dollar',      symbol: 'C$',  decimalDigits: 2 },
  { code: 'AUD', name: 'Australian Dollar',    symbol: 'A$',  decimalDigits: 2 },
  { code: 'CHF', name: 'Swiss Franc',          symbol: 'Fr',  decimalDigits: 2 },
  { code: 'SEK', name: 'Swedish Krona',        symbol: 'kr',  decimalDigits: 2 },
];

const BY_CODE: Record<string, CurrencyInfo> = Object.fromEntries(
  CURRENCIES.map(c => [c.code, c])
);

export const getCurrencyInfo = (code: CurrencyCode): CurrencyInfo =>
  BY_CODE[code] ?? { code, name: code, symbol: code, decimalDigits: 2 };

export const currencySymbol = (code: CurrencyCode): string => getCurrencyInfo(code).symbol;

export const currencyName = (code: CurrencyCode): string => getCurrencyInfo(code).name;

/**
 * ISO 3166-1 alpha-2 region → ISO 4217 currency mapping for the regions
 * represented in `CURRENCIES` (plus the broader Eurozone). Lets us resolve a
 * base currency from the country part of a BCP-47 locale (e.g. ar-EG → EG → EGP).
 */
const REGION_TO_CURRENCY: Record<string, string> = {
  // US Dollar (also used by Ecuador, El Salvador, Panama, etc.)
  US: 'USD', EC: 'USD', SV: 'USD', PA: 'USD', TL: 'USD',
  // Eurozone (non-exhaustive)
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
  PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR', SK: 'EUR',
  SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', CY: 'EUR', MT: 'EUR', HR: 'EUR',
  // Pound / Gulf / others
  GB: 'GBP', GG: 'GBP', JE: 'GBP', IM: 'GBP',
  EG: 'EGP', SA: 'SAR', AE: 'AED', KW: 'KWD', QA: 'QAR', BH: 'BHD', OM: 'OMR',
  JO: 'JOD', LB: 'LBP', TR: 'TRY', IN: 'INR', PK: 'PKR', CN: 'CNY', JP: 'JPY',
  NG: 'NGN', ZA: 'ZAR', CA: 'CAD', AU: 'AUD', CH: 'CHF', LI: 'CHF', SE: 'SEK',
};

/**
 * Resolve the user's likely base currency from the browser/device locale.
 * ar-EG → EGP, ar-SA → SAR, en-US → USD, de-DE → EUR, etc.
 * Falls back to USD if the region can't be mapped to a known currency.
 */
export const detectBaseCurrency = (): CurrencyCode => {
  try {
    const locale =
      (typeof navigator !== 'undefined' &&
        (navigator.languages?.[0] || navigator.language)) ||
      'en-US';
    // Country subtag is normally the part after the final '-'.
    const region = locale.split('-').pop()?.toUpperCase() ?? '';
    return REGION_TO_CURRENCY[region] ?? 'USD';
  } catch {
    return 'USD';
  }
};
