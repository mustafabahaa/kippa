import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { AddIcon, SearchIcon } from '@/components/AppIcon';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@monochrome-ui/design-system';
import type { Category } from '@kippa/domain';

type CategoryChipsProps = {
  categories: Category[];
  expanded?: boolean;
  mode: 'expense' | 'income';
  onOpenAll?: () => void;
  onSearchChange?: (query: string) => void;
  onSelect: (categoryId: string) => void;
  onToggleExpanded?: () => void;
  searchValue?: string;
  selectedCategoryId: string | null;
  totalCount: number;
};

export function CategoryChips({
  categories,
  expanded = false,
  mode,
  onOpenAll,
  onSearchChange,
  onSelect,
  onToggleExpanded,
  searchValue,
  selectedCategoryId,
  totalCount,
}: CategoryChipsProps) {
  return (
    <Box>
      <Typography variant="sectionLabel" sx={{ mb: 1 }}>
        Category
      </Typography>
      {totalCount === 0 ? (
        <EmptyLayout
          title={`No ${mode} categories yet`}
          description={`Create ${mode} categories first to tag your ${mode} entries.`}
        />
      ) : (
        <Stack spacing={1.25}>
          {searchValue !== undefined && onSearchChange && (
            <TextField
              size="small"
              placeholder="Search categories"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              sx={{ width: 240, maxWidth: '100%' }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
          {categories.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map((category) => {
                const isSelected = selectedCategoryId === category.id;
                return (
                  <Chip
                    key={category.id}
                    label={category.name}
                    onClick={() => onSelect(category.id)}
                    aria-pressed={isSelected}
                    variant={isSelected ? 'filterSelected' : 'filter'}
                  />
                );
              })}
              {(searchValue === undefined || searchValue === '') &&
                ((onToggleExpanded && (expanded || totalCount > categories.length)) ||
                  (!onToggleExpanded && onOpenAll && totalCount > categories.length)) && (
                  <Chip
                    icon={expanded ? undefined : <AddIcon fontSize="small" />}
                    label={expanded ? 'Show less' : `More (${totalCount - categories.length})`}
                    onClick={onToggleExpanded ?? onOpenAll}
                    variant="filterAction"
                  />
                )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {searchValue ? `No categories match “${searchValue}”.` : 'No categories available.'}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}

type CategoryDialogProps = {
  categories: Category[];
  onClose: () => void;
  onSearchChange: (query: string) => void;
  onSelect: (categoryId: string) => void;
  open: boolean;
  search: string;
  selectedCategoryId: string | null;
};

export function CategoryDialog({
  categories,
  onClose,
  onSearchChange,
  onSelect,
  open,
  search,
  selectedCategoryId,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        Choose category
        <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Frequent categories stay on the entry screen for faster logging.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search categories"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          {categories.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map((category) => {
                const isSelected = selectedCategoryId === category.id;
                return (
                  <Chip
                    key={category.id}
                    label={category.name}
                    onClick={() => onSelect(category.id)}
                    aria-pressed={isSelected}
                    variant={isSelected ? 'filterSelected' : 'filter'}
                  />
                );
              })}
            </Box>
          ) : (
            <EmptyLayout title="No matching categories" description="Try another category name." />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
