import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { CurrencyCode } from '@/domain/financeTypes';
import { CURRENCIES } from '@/libs/currencyMeta';

type Props = {
  label?: string;
  labelId: string;
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
};

export function CurrencySelect({ label = 'Currency', labelId, value, onChange }: Props) {
  return (
    <FormControl fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        value={value}
        label={label}
        onChange={(e: SelectChangeEvent) => onChange(e.target.value as CurrencyCode)}
        sx={{ borderRadius: '12px' }}
      >
        {CURRENCIES.map(c => (
          <MenuItem key={c.code} value={c.code}>
            {c.code} ({c.name})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
