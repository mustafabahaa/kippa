import { useState } from 'react';
import { Box, TextField, Typography, Stack } from '@mui/material';
import { BANK_LIST } from './banks/banks';

export function BankPicker({ onPick }: { onPick: (bankId: string) => void }) {
  const [q, setQ] = useState('');
  const filtered = BANK_LIST.filter(b => b.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Stack spacing={2}>
      <TextField
        value={q}
        onChange={e => setQ(e.target.value)}
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
        {filtered.map(b => (
          <Box
            key={b.id}
            onClick={() => onPick(b.id)}
            sx={{
              p: 1.5,
              cursor: 'pointer',
              height: 90,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 2,
              },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                bgcolor: b.accentColor,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
              {b.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
