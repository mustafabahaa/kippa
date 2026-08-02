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
  }
}

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    amountPanel: true;
    amountPanelInactive: true;
    selectable: true;
    selectableSelected: true;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    sectionLabel: React.CSSProperties;
    fieldHint: React.CSSProperties;
    amountValue: React.CSSProperties;
    amountCurrency: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    sectionLabel?: React.CSSProperties;
    fieldHint?: React.CSSProperties;
    amountValue?: React.CSSProperties;
    amountCurrency?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    sectionLabel: true;
    fieldHint: true;
    amountValue: true;
    amountCurrency: true;
  }
}
