import '@mui/material/Chip';
import '@mui/material/Button';
import '@mui/material/Paper';
import '@mui/material/styles';
import '@mui/material/Typography';

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    filter: true;
    filterSelected: true;
    filterAction: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    segmented: true;
    segmentedSelected: true;
    keypad: true;
    keypadBack: true;
    compactField: true;
    primaryAction: true;
    assistantPrompt: true;
    assistantPromptFeatured: true;
    assistantSend: true;
  }
}

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    dashboardSection: true;
    bankCard: true;
    bankCardHeader: true;
    cardDetailDialog: true;
    amountPanel: true;
    amountPanelInactive: true;
    selectable: true;
    selectableSelected: true;
    assistantAvatar: true;
    assistantComposer: true;
    assistantUserMessage: true;
    assistantReply: true;
    assistantMessageAvatar: true;
    assistantHeader: true;
    assistantCooldown: true;
    assistantAction: true;
    assistantChart: true;
    saveFeedbackOverlay: true;
    iconBadge: true;
    balanceTile: true;
    dashboardAccountRow: true;
    timelineRow: true;
    categoryCapacity: true;
    categoryCapacitySpent: true;
    categoryCapacityOver: true;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    sectionLabel: React.CSSProperties;
    fieldHint: React.CSSProperties;
    amountValue: React.CSSProperties;
    amountPlaceholder: React.CSSProperties;
    amountCurrency: React.CSSProperties;
    assistantPromptLabel: React.CSSProperties;
    assistantPromptTitle: React.CSSProperties;
    assistantMessage: React.CSSProperties;
    loanTitle: React.CSSProperties;
    loanMetric: React.CSSProperties;
    loanMetricCompact: React.CSSProperties;
    loanMeta: React.CSSProperties;
    sectionTitle: React.CSSProperties;
    sectionSubtitle: React.CSSProperties;
    cardAmount: React.CSSProperties;
    cardNumber: React.CSSProperties;
    cardDetailNumber: React.CSSProperties;
    cardDetailAmount: React.CSSProperties;
    cardDetailLabel: React.CSSProperties;
    cardMicro: React.CSSProperties;
    cardExpiry: React.CSSProperties;
    transactionAmount: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    sectionLabel?: React.CSSProperties;
    fieldHint?: React.CSSProperties;
    amountValue?: React.CSSProperties;
    amountPlaceholder?: React.CSSProperties;
    amountCurrency?: React.CSSProperties;
    assistantPromptLabel?: React.CSSProperties;
    assistantPromptTitle?: React.CSSProperties;
    assistantMessage?: React.CSSProperties;
    loanTitle?: React.CSSProperties;
    loanMetric?: React.CSSProperties;
    loanMetricCompact?: React.CSSProperties;
    loanMeta?: React.CSSProperties;
    sectionTitle?: React.CSSProperties;
    sectionSubtitle?: React.CSSProperties;
    cardAmount?: React.CSSProperties;
    cardNumber?: React.CSSProperties;
    cardDetailNumber?: React.CSSProperties;
    cardDetailAmount?: React.CSSProperties;
    cardDetailLabel?: React.CSSProperties;
    cardMicro?: React.CSSProperties;
    cardExpiry?: React.CSSProperties;
    transactionAmount?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    sectionLabel: true;
    fieldHint: true;
    amountValue: true;
    amountPlaceholder: true;
    amountCurrency: true;
    assistantPromptLabel: true;
    assistantPromptTitle: true;
    assistantMessage: true;
    loanTitle: true;
    loanMetric: true;
    loanMetricCompact: true;
    loanMeta: true;
    sectionTitle: true;
    sectionSubtitle: true;
    cardAmount: true;
    cardNumber: true;
    cardDetailNumber: true;
    cardDetailAmount: true;
    cardDetailLabel: true;
    cardMicro: true;
    cardExpiry: true;
    transactionAmount: true;
  }
}
