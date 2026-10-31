import { Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const SystemStatusContent = styled(Stack, {
  name: 'KippaSystemStatusContent',
  slot: 'Root',
})(({ theme }) => ({
  width: '100%',
  maxWidth: 560,
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(1.5),
}));

export const SystemStatusLogo = styled('img', {
  name: 'KippaSystemStatusLogo',
  slot: 'Root',
})({
  display: 'block',
  width: 'clamp(144px, 28vw, 192px)',
  height: 'clamp(144px, 28vw, 192px)',
  objectFit: 'contain',
  marginBottom: 12,
});

export const SystemStatusCode = styled(Typography, {
  name: 'KippaSystemStatusCode',
  slot: 'Root',
})({});

export const SystemStatusTitle = styled(Typography, {
  name: 'KippaSystemStatusTitle',
  slot: 'Root',
})({});

export const SystemStatusAction = styled(Stack, {
  name: 'KippaSystemStatusAction',
  slot: 'Root',
})(({ theme }) => ({ alignItems: 'center', marginTop: theme.spacing(1.5) }));
