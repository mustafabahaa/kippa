import { useState } from 'react';
import { Box, TextField, Stack, Paper } from '@monochrome-ui/design-system';
import { BANK_LIST } from './banks/banks';
import { BankLogo } from './CardDesign';

export function BankPicker({ onPick }: { onPick: (bankId: string) => void }) {
  const [q, setQ] = useState('');
  const filtered = BANK_LIST.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Stack spacing={2}>
      <TextField
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search banks..."
        size="small"
        fullWidth
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 1.5,
        }}
      >
        {filtered.map((b) => (
          <Paper
            key={b.id}
            variant="bankCard"
            data-clickable="true"
            onClick={() => onPick(b.id)}
            sx={{
              cursor: 'pointer',
              height: 90,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 1,
              p: 1.5,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <BankLogo bankId={b.id} kind="debit" />
            </Box>
          </Paper>
        ))}
      </Box>
    </Stack>
  );
}
