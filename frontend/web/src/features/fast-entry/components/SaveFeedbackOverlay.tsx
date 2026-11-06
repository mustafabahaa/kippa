import { Box, Paper, Portal, Typography } from '@monochrome-ui/design-system';
import { SaveFeedbackMotion } from '@monochrome-ui/design-system';
import { CheckCircleIcon, ReceiptLongIcon } from '@/components/AppIcon';

export type SaveFeedbackContent = { account: string; amount: string; category: string; title: string };

export function SaveFeedbackOverlay({
  content,
  onClose,
  open,
}: {
  content: SaveFeedbackContent;
  onClose: () => void;
  open: boolean;
}) {
  if (!open) return null;

  return (
    <Portal>
      <Paper
        variant="saveFeedbackOverlay"
        role="status"
        aria-live="polite"
        aria-label="Entry saved"
        onClick={onClose}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2,
          '--save-origin-x': { xs: '50%', md: 'calc(100% - 104px)', lg: '50%' },
          '--save-origin-y': {
            xs: 'calc(100% - 116px - env(safe-area-inset-bottom, 0px))',
            md: 'calc(100% - 52px)',
            lg: 'calc(100% - 96px)',
          },
        }}
      >
        {[0, 1].map((ring) => (
          <SaveFeedbackMotion
            variant="ring"
            sequence={ring}
            key={ring}
          />
        ))}

        <SaveFeedbackMotion variant="copy">
          <Typography variant="sectionLabel" color="inherit">
            {content.title}
          </Typography>
          <Typography variant="h2" color="inherit">
            {content.amount}
          </Typography>
          <Typography variant="body2" color="inherit">
            {content.category} · {content.account}
          </Typography>
          <Typography variant="fieldHint" color="inherit" sx={{ pt: 1 }}>
            Tap anywhere to continue
          </Typography>
        </SaveFeedbackMotion>

        <SaveFeedbackMotion variant="launch">
          {[0, 1, 2].map((trail) => (
            <SaveFeedbackMotion
              key={trail}
              variant="trail"
              sequence={trail}
            />
          ))}
          <Box
            sx={{
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              width: { xs: 84, sm: 92 },
              height: { xs: 84, sm: 92 },
            }}
          >
            <ReceiptLongIcon size={62} strokeWidth={1.6} />
            <CheckCircleIcon
              size={26}
              color="success"
              sx={{ position: 'absolute', right: 0, bottom: 8 }}
            />
          </Box>
        </SaveFeedbackMotion>
      </Paper>
    </Portal>
  );
}
