/** Bank and card-product metadata used by the card setup flow. */
import type { CardKind, CardNetwork } from '@kippa/domain';
export type CardTier = {
  id: string;
  label: string;
  networks: CardNetwork[];
  kinds: CardKind[];
};

export type BankDef = {
  id: string;
  name: string;
  tiers: CardTier[];
  accentColor: string;
};

// Supported products per bank
const HSBC_TIERS: CardTier[] = [
  { id: 'premier', label: 'Premier', networks: ['mastercard'], kinds: ['debit', 'credit'] },
  { id: 'advance', label: 'Advance', networks: ['mastercard'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa'], kinds: ['debit', 'credit'] },
  { id: 'cashback', label: 'Cashback', networks: ['visa', 'mastercard'], kinds: ['credit'] },
];

// CIB tier definitions
const CIB_TIERS: CardTier[] = [
  { id: 'classic', label: 'Classic', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'gold', label: 'Gold', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'titanium', label: 'Titanium', networks: ['mastercard'], kinds: ['credit'] },
  { id: 'world', label: 'World', networks: ['mastercard'], kinds: ['credit'] },
];

// NBE tier definitions
const NBE_TIERS: CardTier[] = [
  { id: 'classic', label: 'Classic', networks: ['visa', 'mastercard', 'meeza'], kinds: ['debit', 'credit'] },
  { id: 'gold', label: 'Gold', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'titanium', label: 'Titanium', networks: ['mastercard'], kinds: ['debit', 'credit'] },
  { id: 'signature', label: 'Signature', networks: ['visa'], kinds: ['credit'] },
  { id: 'infinite', label: 'Infinite', networks: ['visa'], kinds: ['credit'] },
];

// Banque Misr tier definitions
const BANQUE_MISR_TIERS: CardTier[] = [
  { id: 'classic', label: 'Classic', networks: ['visa', 'mastercard', 'meeza'], kinds: ['debit', 'credit'] },
  { id: 'gold', label: 'Gold', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'titanium', label: 'Titanium', networks: ['mastercard'], kinds: ['debit', 'credit'] },
];

// QNB tier definitions
const QNB_TIERS: CardTier[] = [
  { id: 'classic', label: 'Classic', networks: ['visa'], kinds: ['debit', 'credit'] },
  { id: 'gold', label: 'Gold', networks: ['visa'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa'], kinds: ['debit', 'credit'] },
];

// Arab Bank tier definitions
const ARAB_BANK_TIERS: CardTier[] = [
  { id: 'classic', label: 'Classic', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'gold', label: 'Gold', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'black', label: 'Black', networks: ['visa'], kinds: ['credit'] },
];

// ADCB tier definitions
const ADCB_TIERS: CardTier[] = [
  { id: 'classic', label: 'Classic', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'gold', label: 'Gold', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
];

// AAIB tier definitions
const AAIB_TIERS: CardTier[] = [
  { id: 'classic', label: 'Classic', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'gold', label: 'Gold', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
];

// FABMISR tier definitions
const FABMISR_TIERS: CardTier[] = [
  { id: 'classic', label: 'Classic', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'gold', label: 'Gold', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
];

// EGBank tier definitions
const EGBANK_TIERS: CardTier[] = [
  { id: 'classic', label: 'Classic', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'gold', label: 'Gold', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
  { id: 'platinum', label: 'Platinum', networks: ['visa', 'mastercard'], kinds: ['debit', 'credit'] },
];

export const BANKS: Record<string, BankDef> = {
  hsbc: { id: 'hsbc', name: 'HSBC', tiers: HSBC_TIERS, accentColor: '#db0011' },
  cib: { id: 'cib', name: 'CIB', tiers: CIB_TIERS, accentColor: '#1F4F7A' },
  nbe: { id: 'nbe', name: 'NBE', tiers: NBE_TIERS, accentColor: '#2E7D32' },
  'banque-misr': { id: 'banque-misr', name: 'Banque Misr', tiers: BANQUE_MISR_TIERS, accentColor: '#C62828' },
  qnb: { id: 'qnb', name: 'QNB', tiers: QNB_TIERS, accentColor: '#5B2C83' },
  'arab-bank': { id: 'arab-bank', name: 'Arab Bank', tiers: ARAB_BANK_TIERS, accentColor: '#1976D2' },
  adcb: { id: 'adcb', name: 'ADCB', tiers: ADCB_TIERS, accentColor: '#D32F2F' },
  aaib: { id: 'aaib', name: 'AAIB', tiers: AAIB_TIERS, accentColor: '#1565C0' },
  fabmisr: { id: 'fabmisr', name: 'FABMISR', tiers: FABMISR_TIERS, accentColor: '#6A1B9A' },
  egbank: { id: 'egbank', name: 'EGBank', tiers: EGBANK_TIERS, accentColor: '#00695C' },
  other: { id: 'other', name: 'Other bank', tiers: [], accentColor: '#495167' },
};

export const BANK_LIST: BankDef[] = Object.values(BANKS);

export function getBank(bankId?: string): BankDef | undefined {
  return bankId ? BANKS[bankId] : undefined;
}

export function getTier(bankId: string, tierId?: string): CardTier | undefined {
  return tierId ? getBank(bankId)?.tiers.find((t) => t.id === tierId) : undefined;
}
