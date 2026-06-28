import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Stack, 
  Typography, 
  Button, 
  Divider,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';

interface HouseholdSectionProps {
  householdId: string;
}

export function HouseholdSection({ householdId }: HouseholdSectionProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyHouseholdId = () => {
    navigator.clipboard.writeText(householdId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <Container maxWidth="xs" sx={{ py: 1, px: 2 }}>
      <Stack spacing={3}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
            Household Info
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
            View details and share access to your active household container
          </Typography>
        </Box>

        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2.5}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'info.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HomeIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Mustafa Household</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>EGP (Base Currency)</Typography>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase', tracking: '0.5px' }}>
                  Household Invite ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all', mt: 0.5, p: 1.5, bgcolor: 'action.hover', borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                  {householdId}
                </Typography>
              </Box>

              {copySuccess && (
                <Alert severity="success" sx={{ borderRadius: '12px', py: 0.5 }}>
                  Copied to clipboard!
                </Alert>
              )}

              <Button
                variant="contained"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyHouseholdId}
                sx={{
                  py: 1.2,
                  borderRadius: '12px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Copy Invite Link ID
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
