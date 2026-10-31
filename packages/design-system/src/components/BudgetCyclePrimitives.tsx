import type { ComponentProps } from 'react';
import { Box, IconButton, ListItem, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';

/** Shared separators and row treatments used by budget-cycle screens. */
export const BudgetCycleAccountRow = styled(Box, {
  name: 'KippaBudgetCycleAccountRow',
  slot: 'Root',
})(({ theme }) => ({
  paddingTop: theme.spacing(2.5),
  paddingBottom: theme.spacing(2.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const BudgetCycleSummaryItem = styled(Box, {
  name: 'KippaBudgetCycleSummaryItem',
  slot: 'Root',
})(({ theme }) => ({
  paddingTop: theme.spacing(2.5),
  paddingBottom: theme.spacing(2.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.up('lg')]: { borderBottom: 0 },
}));

const AllocationRowRoot = styled(ListItem, {
  name: 'KippaBudgetAllocationRow',
  slot: 'Root',
})(({ theme }) => ({
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  minHeight: 48,
  '&:hover .allocation-actions, &:focus-within .allocation-actions': { opacity: 1 },
}));

export function BudgetAllocationRow(props: ComponentProps<typeof ListItem>) {
  return <AllocationRowRoot {...props} />;
}

const AllocationActionsRoot = styled(Stack, {
  name: 'KippaBudgetAllocationActions',
  slot: 'Root',
})(({ theme }) => ({
  opacity: 0,
  [theme.breakpoints.down('md')]: { opacity: 1 },
}));

export function BudgetAllocationActions(props: ComponentProps<typeof Stack>) {
  return <AllocationActionsRoot {...props} />;
}

const AllocationRemoveButtonRoot = styled(IconButton, {
  name: 'KippaBudgetAllocationRemoveButton',
  slot: 'Root',
})({ width: 30, height: 30 });

export function BudgetAllocationRemoveButton(props: ComponentProps<typeof IconButton>) {
  return <AllocationRemoveButtonRoot {...props} />;
}
