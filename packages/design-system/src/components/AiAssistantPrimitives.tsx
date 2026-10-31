import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const AiAssistantPage = styled(Box, {
  name: 'KippaAiAssistantPage',
  slot: 'Root',
})(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
}));

export const AiAssistantFooter = styled(Box, {
  name: 'KippaAiAssistantFooter',
  slot: 'Root',
})(({ theme }) => ({
  flexShrink: 0,
  backgroundColor: theme.palette.background.paper,
}));

export const AiAssistantStreamCursor = styled('span', {
  name: 'KippaAiAssistantStreamCursor',
  slot: 'Root',
})(({ theme }) => ({
  display: 'inline-block',
  width: 6,
  height: 16,
  marginLeft: theme.spacing(0.5),
  verticalAlign: 'text-bottom',
  backgroundColor: theme.palette.primary.main,
  animation: 'kippaAiCursor 900ms steps(1) infinite',
  '@keyframes kippaAiCursor': { '50%': { opacity: 0 } },
}));

export const AiAssistantLoadingBadge = styled(Box, {
  name: 'KippaAiAssistantLoadingBadge',
  slot: 'Root',
})(({ theme }) => ({
  display: 'grid',
  width: 28,
  height: 28,
  flex: '0 0 28px',
  placeItems: 'center',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
}));
