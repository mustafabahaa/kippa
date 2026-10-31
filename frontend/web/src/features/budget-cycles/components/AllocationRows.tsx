import { DeleteIcon } from '@/components/AppIcon';

import { List, ListItemText, Stack, TextField } from '@monochrome-ui/design-system';
import { BudgetAllocationActions, BudgetAllocationRemoveButton, BudgetAllocationRow } from '@monochrome-ui/design-system';

export interface AllocationRow {
  categoryId: string;
  plannedAmount: string;
}

interface AllocationRowsProps {
  rows: AllocationRow[];
  privacyMode: boolean;
  maskDigits: (value: string) => string;
  getCategoryName: (categoryId: string) => string;
  onAmountChange: (categoryId: string, value: string) => void;
  onRemove: (categoryId: string) => void;
}

export function AllocationRows({
  rows,
  privacyMode,
  maskDigits,
  getCategoryName,
  onAmountChange,
  onRemove,
}: AllocationRowsProps) {
  return (
    <List disablePadding>
      {rows.map((row) => {
        const categoryName = getCategoryName(row.categoryId);
        return (
          <BudgetAllocationRow
            key={row.categoryId}
            secondaryAction={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <TextField
                  variant="standard"
                  type="number"
                  value={privacyMode && row.plannedAmount ? maskDigits(row.plannedAmount) : row.plannedAmount}
                  onChange={(event) => onAmountChange(row.categoryId, event.target.value)}
                  sx={{ width: 104 }}
                  slotProps={{
                    input: { disableUnderline: true },
                    htmlInput: { min: 0, style: { textAlign: 'right', fontWeight: 700, padding: '10px 12px' } },
                  }}
                />
                <BudgetAllocationActions className="allocation-actions" direction="row" spacing={0.25}>
                  <BudgetAllocationRemoveButton
                    aria-label={`Remove ${categoryName}`}
                    size="small"
                    onClick={() => onRemove(row.categoryId)}
                    color="error"
                  >
                    <DeleteIcon size={22} strokeWidth={1.8} />
                  </BudgetAllocationRemoveButton>
                </BudgetAllocationActions>
              </Stack>
            }
          >
            <ListItemText primary={categoryName} slotProps={{ primary: { variant: 'body2', fontWeight: 600 } }} />
          </BudgetAllocationRow>
        );
      })}
    </List>
  );
}
