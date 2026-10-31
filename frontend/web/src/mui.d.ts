import '@mui/material/Chip';
import '@mui/material/Button';
import '@mui/material/Paper';
import '@mui/material/styles';
import '@mui/material/Typography';
import '@mui/material/MenuItem';
import '@mui/material/Avatar';

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
    budgetCategoryRow: true;
    profileHouseholdRow: true;
    navigationMenu: true;
    workspaceSidebar: true;
    emptyState: true;
    emptyStateIcon: true;
    emptyStateLogo: true;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    budgetMetricLabel: true;
    budgetMetricValue: true;
    budgetMetricMeta: true;
    budgetColumnHeading: true;
    budgetEmptyMessage: true;
    budgetCategoryName: true;
    budgetPercent: true;
    budgetCellLabel: true;
    budgetCellValue: true;
    budgetPulseStatus: true;
    budgetPulseValue: true;
    budgetPulseValueSuffix: true;
    budgetPulseSummary: true;
    budgetPulsePercent: true;
    budgetPulsePercentCompact: true;
    budgetPulseCategory: true;
    budgetPulseAmount: true;
    offlineBannerMessage: true;
    accountName: true;
    accountType: true;
    accountBalance: true;
  }
}

declare module '@mui/material/MenuItem' {
  interface MenuItemOwnProps {
    kippaTone?: 'destructive';
  }
}

declare module '@mui/material/Avatar' {
  interface AvatarPropsVariantOverrides {
    profileMenu: true;
    appBar: true;
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
    profileMenuName: React.CSSProperties;
    profileHouseholdName: React.CSSProperties;
    profileHouseholdId: React.CSSProperties;
    pageTitle: React.CSSProperties;
    emptyStateTitle: React.CSSProperties;
    emptyStateDescription: React.CSSProperties;
    tooltipEmphasis: React.CSSProperties;
    tooltipDetail: React.CSSProperties;
    offlineBannerMessage: React.CSSProperties;
    accountName: React.CSSProperties;
    accountType: React.CSSProperties;
    accountBalance: React.CSSProperties;
    chartTooltipValue: React.CSSProperties;
    chartCycleLabel: React.CSSProperties;
    chartLegendLabel: React.CSSProperties;
    cardAmount: React.CSSProperties;
    cardNumber: React.CSSProperties;
    cardDetailNumber: React.CSSProperties;
    cardDetailAmount: React.CSSProperties;
    cardDetailLabel: React.CSSProperties;
    cardMicro: React.CSSProperties;
    cardExpiry: React.CSSProperties;
    transactionAmount: React.CSSProperties;
    budgetMetricLabel: React.CSSProperties;
    budgetMetricValue: React.CSSProperties;
    budgetMetricMeta: React.CSSProperties;
    budgetColumnHeading: React.CSSProperties;
    budgetEmptyMessage: React.CSSProperties;
    budgetCategoryName: React.CSSProperties;
    budgetPercent: React.CSSProperties;
    budgetCellLabel: React.CSSProperties;
    budgetCellValue: React.CSSProperties;
    budgetPulseStatus: React.CSSProperties;
    budgetPulseValue: React.CSSProperties;
    budgetPulseValueSuffix: React.CSSProperties;
    budgetPulseSummary: React.CSSProperties;
    budgetPulsePercent: React.CSSProperties;
    budgetPulsePercentCompact: React.CSSProperties;
    budgetPulseCategory: React.CSSProperties;
    budgetPulseAmount: React.CSSProperties;
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
    profileMenuName?: React.CSSProperties;
    profileHouseholdName?: React.CSSProperties;
    profileHouseholdId?: React.CSSProperties;
    pageTitle?: React.CSSProperties;
    emptyStateTitle?: React.CSSProperties;
    emptyStateDescription?: React.CSSProperties;
    tooltipEmphasis?: React.CSSProperties;
    tooltipDetail?: React.CSSProperties;
    offlineBannerMessage?: React.CSSProperties;
    accountName?: React.CSSProperties;
    accountType?: React.CSSProperties;
    accountBalance?: React.CSSProperties;
    chartTooltipValue?: React.CSSProperties;
    chartCycleLabel?: React.CSSProperties;
    chartLegendLabel?: React.CSSProperties;
    cardAmount?: React.CSSProperties;
    cardNumber?: React.CSSProperties;
    cardDetailNumber?: React.CSSProperties;
    cardDetailAmount?: React.CSSProperties;
    cardDetailLabel?: React.CSSProperties;
    cardMicro?: React.CSSProperties;
    cardExpiry?: React.CSSProperties;
    transactionAmount?: React.CSSProperties;
    budgetMetricLabel?: React.CSSProperties;
    budgetMetricValue?: React.CSSProperties;
    budgetMetricMeta?: React.CSSProperties;
    budgetColumnHeading?: React.CSSProperties;
    budgetEmptyMessage?: React.CSSProperties;
    budgetCategoryName?: React.CSSProperties;
    budgetPercent?: React.CSSProperties;
    budgetCellLabel?: React.CSSProperties;
    budgetCellValue?: React.CSSProperties;
    budgetPulseStatus?: React.CSSProperties;
    budgetPulseValue?: React.CSSProperties;
    budgetPulseValueSuffix?: React.CSSProperties;
    budgetPulseSummary?: React.CSSProperties;
    budgetPulsePercent?: React.CSSProperties;
    budgetPulsePercentCompact?: React.CSSProperties;
    budgetPulseCategory?: React.CSSProperties;
    budgetPulseAmount?: React.CSSProperties;
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
    profileMenuName: true;
    profileHouseholdName: true;
    profileHouseholdId: true;
    pageTitle: true;
    emptyStateTitle: true;
    emptyStateDescription: true;
    tooltipEmphasis: true;
    tooltipDetail: true;
    chartTooltipValue: true;
    chartCycleLabel: true;
    chartLegendLabel: true;
    cardAmount: true;
    cardNumber: true;
    cardDetailNumber: true;
    cardDetailAmount: true;
    cardDetailLabel: true;
    cardMicro: true;
    cardExpiry: true;
    transactionAmount: true;
    offlineBannerMessage: true;
    accountName: true;
    accountType: true;
    accountBalance: true;
  }
}
