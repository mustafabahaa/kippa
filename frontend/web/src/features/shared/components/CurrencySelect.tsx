import { Autocomplete, InputAdornment, Stack, TextField } from '@mui/material';
import type { CurrencyCode } from '@kippa/domain';
import { CURRENCIES, countryFlagEmoji } from '@/libs/currencyMeta';

type Props = {
  label?: string;
  labelId: string;
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
};

export function CurrencySelect({ label = 'Currency', labelId, value, onChange }: Props) {
  const selectedCurrency = CURRENCIES.find((currency) => currency.code === value) ?? null;

  return (
    <Autocomplete
      id={labelId}
      fullWidth
      options={CURRENCIES}
      value={selectedCurrency ?? undefined}
      getOptionLabel={(currency) => `${currency.code} (${currency.name})`}
      isOptionEqualToValue={(option, selected) => option.code === selected.code}
      onChange={(event, currency) => {
        void event;
        if (currency) onChange(currency.code);
      }}
      disableClearable
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: selectedCurrency ? (
                <InputAdornment position="start" aria-hidden="true">
                  {countryFlagEmoji(selectedCurrency.flagRegion)}
                </InputAdornment>
              ) : (
                params.InputProps.startAdornment
              ),
            },
          }}
        />
      )}
      renderOption={(props, currency) => (
        <li {...props}>
          <Stack direction="row" spacing={1} alignItems="center">
            <span aria-hidden="true">{countryFlagEmoji(currency.flagRegion)}</span>
            <span>
              {currency.code} ({currency.name})
            </span>
          </Stack>
        </li>
      )}
    />
  );
}
