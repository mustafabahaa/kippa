import { createContext, forwardRef, useContext } from 'react';
import { Autocomplete, Button, Checkbox, Chip, Paper, Stack, TextField, type PaperProps } from '@monochrome-ui/design-system';

export type MultiSelectFilterOption = { id: string; label: string };

type FilterActions = {
  allLabel: string;
  allSelected: boolean;
  clearDisabled: boolean;
  onSelectAll: () => void;
  onClear: () => void;
};

const FilterActionsContext = createContext<FilterActions | null>(null);

const FilterPopoverPaper = forwardRef<HTMLDivElement, PaperProps>(function FilterPopoverPaper(props, ref) {
  const actions = useContext(FilterActionsContext);

  return (
    <Paper {...props} ref={ref}>
      {actions && (
        <>
          <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ px: 1.5, py: 0.5 }}>
            <Button
              size="small"
              variant="text"
              disabled={actions.allSelected}
              onMouseDown={(event) => event.preventDefault()}
              onClick={actions.onSelectAll}
            >
              {actions.allLabel}
            </Button>
            <Button
              size="small"
              variant="text"
              disabled={actions.clearDisabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={actions.onClear}
            >
              Clear selection
            </Button>
          </Stack>
        </>
      )}
      {props.children}
    </Paper>
  );
});

type MultiSelectFilterProps = {
  label: string;
  allLabel: string;
  searchPlaceholder: string;
  options: MultiSelectFilterOption[];
  selectedIds: string[] | null;
  onChange: (selectedIds: string[] | null) => void;
};

export function MultiSelectFilter({
  label,
  allLabel,
  searchPlaceholder,
  options,
  selectedIds,
  onChange,
}: MultiSelectFilterProps) {
  const allSelected = selectedIds === null;
  const value = allSelected ? options : options.filter((option) => selectedIds.includes(option.id));
  const actions: FilterActions = {
    allLabel,
    allSelected,
    clearDisabled: selectedIds?.length === 0,
    onSelectAll: () => onChange(null),
    onClear: () => onChange([]),
  };
  return (
    <FilterActionsContext.Provider value={actions}>
      <Autocomplete<MultiSelectFilterOption, true, true, false>
        multiple
        disableCloseOnSelect
        disableClearable
        openOnFocus
        limitTags={1}
        slotProps={{ listbox: { sx: { maxHeight: 280 } } }}
        options={options}
        value={value}
        onChange={(event, nextValue) => {
          void event;
          onChange(nextValue.map((option) => option.id));
        }}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        slots={{ paper: FilterPopoverPaper }}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox checked={selected} tabIndex={-1} disableRipple />
            {option.label}
          </li>
        )}
        renderValue={(tagOptions, getItemProps) => {
          const tagLabel = allSelected
            ? allLabel
            : tagOptions.length === 1
              ? tagOptions[0].label
              : `${tagOptions.length} selected`;
          return tagLabel ? (
            <Chip {...getItemProps({ index: 0 })} onDelete={undefined} label={tagLabel} key="selection-summary" />
          ) : null;
        }}
        renderInput={(params) => <TextField {...params} label={label} placeholder={searchPlaceholder} />}
      />
    </FilterActionsContext.Provider>
  );
}
