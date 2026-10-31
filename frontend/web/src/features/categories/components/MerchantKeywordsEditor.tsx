import { AddIcon, CloseIcon, ShoppingCartIcon } from '@/components/AppIcon';

import { useState } from 'react';
import { Box, Chip, IconButton, Stack, TextField, Typography } from '@mui/material';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { dedupeMerchantKeywords } from '@/libs/merchantSuggestions';

type Props = {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  disabled?: boolean;
  /** Show the dashed EmptyLayout panel when there are no keywords (used in
   *  dialogs); compact cards omit it and just render the add field. */
  emptyState?: boolean;
};

/** Add/remove merchant keywords that auto-suggest a category for imported
 *  bank messages. Shared by the Edit Category dialog and the create card. */
export function MerchantKeywordsEditor({ keywords, onChange, disabled = false, emptyState = false }: Props) {
  const [draft, setDraft] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    onChange(dedupeMerchantKeywords([...keywords, draft]));
    setDraft('');
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <ShoppingCartIcon size={22} strokeWidth={1.8} />
        <Typography variant="sectionLabel">Merchants</Typography>
      </Stack>
      <Typography variant="fieldHint" color="text.secondary">
        New transactions from these merchants auto-fill this category. Matching ignores case, symbols and spacing.
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          fullWidth
          label="Add merchant"
          placeholder="e.g. Seoudi, Beanos, Netflix"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          disabled={disabled}
        />
        <IconButton aria-label="Add" onClick={add} disabled={!draft.trim() || disabled} size="medium">
          <AddIcon size={22} strokeWidth={1.8} />
        </IconButton>
      </Stack>
      {keywords.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 0.75 }}>
          {keywords.map((merchant) => (
            <Chip
              key={merchant}
              label={merchant}
              onDelete={() => onChange(keywords.filter((entry) => entry !== merchant))}
              deleteIcon={<CloseIcon aria-label={`Remove ${merchant}`} size={22} strokeWidth={1.8} />}
              disabled={disabled}
            />
          ))}
        </Box>
      ) : emptyState ? (
        <EmptyLayout
          icon={<ShoppingCartIcon size={22} strokeWidth={1.8} />}
          title="No merchants yet"
          description="Add a merchant above and new transactions from it will auto-fill this category."
        />
      ) : null}
    </Stack>
  );
}
