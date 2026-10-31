import Box, { type BoxProps } from '@mui/material/Box';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';

export type SaveFeedbackMotionVariant = 'ring' | 'copy' | 'launch' | 'trail' | 'mark';

export type SaveFeedbackMotionProps = Omit<BoxProps, 'variant'> & {
  /** Named design-system treatment for each part of the saved-entry motion. */
  variant: SaveFeedbackMotionVariant;
  sequence?: number;
};

const motionStyles: Record<SaveFeedbackMotionVariant, SxProps<Theme>> = {
  ring: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: { xs: 220, sm: 320 },
    aspectRatio: '1',
    borderRadius: '50%',
    border: '1px solid',
    borderColor: (theme) => alpha(theme.palette.common.white, 0.2),
    animation: 'saveFeedbackRing 720ms ease-out both',
    '@keyframes saveFeedbackRing': {
      '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.25)' },
      '22%': { opacity: 1 },
      '100%': { opacity: 0, transform: 'translate(-50%, -50%) scale(2.6)' },
    },
  },
  copy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    left: '50%',
    top: '54%',
    width: 'min(84vw, 440px)',
    textAlign: 'center',
    animation: 'saveFeedbackCopy 1600ms cubic-bezier(0.22, 1, 0.36, 1) both',
    '@keyframes saveFeedbackCopy': {
      '0%': { transform: 'translate(-50%, 22px) scale(0.96)' },
      '32%': { transform: 'translate(-50%, 0) scale(1)' },
      '88%': { transform: 'translate(-50%, -4px) scale(1)' },
      '100%': { transform: 'translate(-50%, -18px) scale(0.98)' },
    },
  },
  launch: {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    left: 'var(--save-origin-x)',
    top: 'var(--save-origin-y)',
    animation: 'saveFeedbackLaunch 1100ms cubic-bezier(0.22, 1, 0.36, 1) both',
    '@keyframes saveFeedbackLaunch': {
      '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.42) rotate(10deg)' },
      '14%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
      '62%': { opacity: 1, transform: 'translate(-50%, calc(-50% - 52vh)) scale(1.04) rotate(-4deg)' },
      '82%': { opacity: 1, transform: 'translate(-50%, calc(-50% - 58vh)) scale(0.92) rotate(0deg)' },
      '100%': { opacity: 0, transform: 'translate(-50%, calc(-50% - 64vh)) scale(0.72)' },
    },
  },
  trail: {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: 'secondary.main',
    animation: 'saveFeedbackTrail 260ms ease-in-out infinite alternate',
    '@keyframes saveFeedbackTrail': {
      from: { transform: 'translateY(0) scale(0.75)' },
      to: { transform: 'translateY(8px) scale(1)' },
    },
  },
  mark: {
    width: { xs: 120, sm: 132 },
    height: { xs: 120, sm: 132 },
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: 'secondary.main',
    color: 'secondary.contrastText',
    position: 'relative',
  },
};

export function SaveFeedbackMotion({ variant, sequence = 0, sx, ...props }: SaveFeedbackMotionProps) {
  const sequenceStyles: SxProps<Theme> =
    variant === 'ring'
      ? { animationDelay: `${100 + sequence * 90}ms` }
      : variant === 'trail'
        ? {
            top: 124 + sequence * 22,
            width: 11 - sequence,
            height: 11 - sequence,
            opacity: 0.68 - sequence * 0.16,
            animationDelay: `${sequence * 45}ms`,
          }
        : {};

  return <Box {...props} sx={[motionStyles[variant], sequenceStyles, ...(Array.isArray(sx) ? sx : [sx])]} />;
}
