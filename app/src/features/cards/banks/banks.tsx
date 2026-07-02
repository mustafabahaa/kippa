import type { ReactNode } from 'react';
import type { CardKind, CardNetwork } from '@/domain/financeTypes';
import {
  HsbcLionBackground,
  HsbcLogo,
  HSBC_GRADIENT_CREDIT,
  HSBC_GRADIENT_DEBIT,
} from './hsbcTheme';
import {
  CibLogo,
  NbeLogo,
  BanqueMisrLogo,
  QnbLogo,
  ArabBankLogo,
  AdcbLogo,
  AaibLogo,
  FabmisrLogo,
  EgbankLogo,
  OtherLogo,
} from './logos';

export type CardTier = {
  id: string;
  label: string;
  networks: CardNetwork[];
  kinds: CardKind[];
};

export type CardBackgroundCtx = { kind: CardKind; tierId?: string };

export type BankDef = {
  id: string;
  name: string;
  logo: (props: { kind: CardKind }) => ReactNode;
  background: (ctx: CardBackgroundCtx) => { css: string; overlay?: ReactNode };
  tiers: CardTier[];
  accentColor: string;
};

// HSBC tier definitions
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
  hsbc: {
    id: 'hsbc',
    name: 'HSBC',
    logo: ({ kind }) => <HsbcLogo kind={kind} />,
    background: ({ kind }) => ({
      css: kind === 'credit' ? HSBC_GRADIENT_CREDIT : HSBC_GRADIENT_DEBIT,
      overlay: <HsbcLionBackground kind={kind} />,
    }),
    tiers: HSBC_TIERS,
    accentColor: '#db0011',
  },
  cib: {
    id: 'cib',
    name: 'CIB',
    logo: ({ kind }) => <CibLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #0B2D4A 0%, #1F4F7A 100%)',
    }),
    tiers: CIB_TIERS,
    accentColor: '#1F4F7A',
  },
  nbe: {
    id: 'nbe',
    name: 'NBE',
    logo: ({ kind }) => <NbeLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #143A17 0%, #2E7D32 100%)',
    }),
    tiers: NBE_TIERS,
    accentColor: '#2E7D32',
  },
  'banque-misr': {
    id: 'banque-misr',
    name: 'Banque Misr',
    logo: ({ kind }) => <BanqueMisrLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #5A1212 0%, #C62828 100%)',
    }),
    tiers: BANQUE_MISR_TIERS,
    accentColor: '#C62828',
  },
  qnb: {
    id: 'qnb',
    name: 'QNB',
    logo: ({ kind }) => <QnbLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #2A1240 0%, #5B2C83 100%)',
    }),
    tiers: QNB_TIERS,
    accentColor: '#5B2C83',
  },
  'arab-bank': {
    id: 'arab-bank',
    name: 'Arab Bank',
    logo: ({ kind }) => <ArabBankLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #0B3A66 0%, #1976D2 100%)',
    }),
    tiers: ARAB_BANK_TIERS,
    accentColor: '#1976D2',
  },
  adcb: {
    id: 'adcb',
    name: 'ADCB',
    logo: ({ kind }) => <AdcbLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #5A1212 0%, #D32F2F 100%)',
    }),
    tiers: ADCB_TIERS,
    accentColor: '#D32F2F',
  },
  aaib: {
    id: 'aaib',
    name: 'AAIB',
    logo: ({ kind }) => <AaibLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #0A2E5C 0%, #1565C0 100%)',
    }),
    tiers: AAIB_TIERS,
    accentColor: '#1565C0',
  },
  fabmisr: {
    id: 'fabmisr',
    name: 'FABMISR',
    logo: ({ kind }) => <FabmisrLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #300D44 0%, #6A1B9A 100%)',
    }),
    tiers: FABMISR_TIERS,
    accentColor: '#6A1B9A',
  },
  egbank: {
    id: 'egbank',
    name: 'EGBank',
    logo: ({ kind }) => <EgbankLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #00332C 0%, #00695C 100%)',
    }),
    tiers: EGBANK_TIERS,
    accentColor: '#00695C',
  },
  other: {
    id: 'other',
    name: 'Other bank',
    logo: ({ kind }) => <OtherLogo kind={kind} />,
    background: () => ({
      css: 'linear-gradient(135deg, #2A2E3A 0%, #495167 100%)',
    }),
    tiers: [],
    accentColor: '#495167',
  },
};

export const BANK_LIST: BankDef[] = Object.values(BANKS);

export function getBank(bankId?: string): BankDef | undefined {
  return bankId ? BANKS[bankId] : undefined;
}

export function getTier(bankId: string, tierId?: string): CardTier | undefined {
  return tierId ? getBank(bankId)?.tiers.find((t) => t.id === tierId) : undefined;
}
