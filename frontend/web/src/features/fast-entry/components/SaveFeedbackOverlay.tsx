import { Paper, Portal, Typography } from '@mui/material';
import { SaveFeedbackMotion } from '@kippa/design-system';
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
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
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
          <SaveFeedbackMotion variant="mark">
            <ReceiptLongIcon fontSize="small" />
            <CheckCircleIcon fontSize="small" />
          </SaveFeedbackMotion>
        </SaveFeedbackMotion>
      </Paper>
    </Portal>
  );
}
