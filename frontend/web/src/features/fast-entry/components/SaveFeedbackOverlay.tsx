import { alpha, Box, Portal, Stack, Typography } from '@mui/material';
import { CheckCircleIcon } from '@/components/AppIcon';

export type SaveFeedbackContent = { account: string; amount: string; category: string; title: string };

export function SaveFeedbackOverlay({ content, onClose, open }: { content: SaveFeedbackContent; onClose: () => void; open: boolean }) {
  if (!open) return null;
  return (
    <Portal>
      <Box role="status" aria-live="polite" aria-label="Entry saved" sx={{ position: 'fixed', inset: 0, zIndex: (theme) => theme.zIndex.modal + 2, bgcolor: (theme) => alpha(theme.palette.common.black, 0.22), backdropFilter: 'blur(7px)', animation: 'feedbackBackdrop 2200ms ease both', '@keyframes feedbackBackdrop': { '0%, 100%': { opacity: 0 }, '15%, 88%': { opacity: 1 } } }}>
        <Stack alignItems="center" spacing={1} onClick={onClose} sx={{ position: 'absolute', left: '50%', top: '50%', width: 'min(calc(100vw - 40px), 420px)', p: 3, textAlign: 'center', transform: 'translate(-50%, -50%)', borderRadius: 3, bgcolor: 'primary.dark', color: 'common.white', cursor: 'pointer', animation: 'feedbackCard 500ms ease both', '@keyframes feedbackCard': { from: { opacity: 0, transform: 'translate(-50%, -45%) scale(.94)' }, to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' } } }}>
          <CheckCircleIcon color="secondary" sx={{ fontSize: 72 }} />
          <Typography variant="sectionLabel" color="inherit">{content.title}</Typography>
          <Typography variant="h2" color="inherit">{content.amount}</Typography>
          <Typography variant="body2" color="inherit">{content.category} · {content.account}</Typography>
          <Typography variant="fieldHint" color="secondary">Saved securely · Tap to continue</Typography>
        </Stack>
      </Box>
    </Portal>
  );
}
