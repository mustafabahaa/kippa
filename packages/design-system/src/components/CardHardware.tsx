import { Box } from '@mui/material';

export function CardChip() {
  return (
    <Box sx={{ width: 42, height: 30, flexShrink: 0, borderRadius: '5px', backgroundColor: '#B8B8B8', border: '1px solid rgba(0,0,0,.22)', overflow: 'hidden' }}>
      <svg viewBox="0 0 42 30" width="100%" height="100%" aria-hidden="true">
        <rect x="0.5" y="0.5" width="41" height="29" rx="4" fill="none" stroke="rgba(0,0,0,.2)" />
        <path d="M9 0v30M33 0v30M0 10h9m24 0h9M0 20h9m24 0h9M9 15h24m-12-15v10m0 10v10" stroke="rgba(0,0,0,.3)" strokeWidth=".8" fill="none" />
        <rect x="15" y="9" width="12" height="12" rx="2" fill="none" stroke="rgba(0,0,0,.3)" strokeWidth=".8" />
      </svg>
    </Box>
  );
}

export function ContactlessIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 8a6 6 0 0 1 0 8M9 6a10 10 0 0 1 0 12M13 4a14 14 0 0 1 0 16" />
    </svg>
  );
}
