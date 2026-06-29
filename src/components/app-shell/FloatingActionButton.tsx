import { Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export function FloatingActionButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname === '/entry') return null;

  return (
    <Box
      onClick={() => navigate('/entry')}
      sx={{
        position: 'fixed',
        bottom: { xs: 92, md: 100 },
        right: 16,
        width: 56,
        height: 56,
        bgcolor: 'background.paper',
        color: 'primary.main',
        borderRadius: '16px',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 999,
        transition: 'all 0.2s ease-in-out',
        '&:active': { transform: 'scale(0.95)' },
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>add</span>
    </Box>
  );
}
