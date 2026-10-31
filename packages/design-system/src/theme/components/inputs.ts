import type { Components, Theme } from '@mui/material/styles';
import { designTokens } from '../../foundations/tokens';
import type { OverrideContext } from './types';

export const inputOverrides = ({ mode, tokens: t }: OverrideContext): Components<Theme> => ({
  MuiAutocomplete: {
    styleOverrides: {
      option: {
        borderRadius: 0,
        '&:hover, &.Mui-focused': {
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(13, 13, 13, 0.03)',
        },
        '&[aria-selected="true"]': {
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(13, 13, 13, 0.045)',
        },
        '&[aria-selected="true"]:hover, &[aria-selected="true"].Mui-focused': {
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(13, 13, 13, 0.06)',
        },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        width: 44,
        height: 28,
        padding: 0,
        overflow: 'visible',
        '& .MuiSwitch-switchBase': {
          padding: 4,
          color: mode === 'dark' ? '#ECECEC' : '#FFFFFF',
          transition: 'transform 180ms ease',
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: mode === 'dark' ? '#0D0D0D' : '#FFFFFF',
            '& + .MuiSwitch-track': {
              backgroundColor: mode === 'dark' ? '#ECECEC' : '#0D0D0D',
              opacity: 1,
            },
          },
          '&.Mui-disabled': { opacity: 0.45 },
          '&.Mui-focusVisible .MuiSwitch-thumb': {
            outline: `3px solid ${mode === 'dark' ? 'rgba(236, 236, 236, 0.24)' : 'rgba(13, 13, 13, 0.2)'}`,
            outlineOffset: 2,
          },
        },
        '& .MuiSwitch-thumb': {
          boxSizing: 'border-box',
          width: 20,
          height: 20,
          border: `1px solid ${t.borderGray}`,
          boxShadow: 'none',
        },
        '& .MuiSwitch-track': {
          borderRadius: 14,
          backgroundColor: mode === 'dark' ? '#5D5D5D' : '#D4D4D4',
          opacity: 1,
          transition: 'background-color 180ms ease',
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { opacity: 1 },
      },
      sizeSmall: {
        width: 36,
        height: 22,
        '& .MuiSwitch-switchBase': {
          padding: 3,
          '&.Mui-checked': { transform: 'translateX(14px)' },
        },
        '& .MuiSwitch-thumb': { width: 16, height: 16 },
        '& .MuiSwitch-track': { borderRadius: 11 },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundColor: t.surfacePure,
        fontSize: 16,
        transition: 'background-color .2s ease',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: t.borderGray },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.outline },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: mode === 'dark' ? '#FFFFFF' : designTokens.color.primaryContainer,
          borderWidth: 2,
        },
      },
    },
  },
  MuiFilledInput: {
    styleOverrides: {
      root: {
        borderRadius: designTokens.radius.control,
        backgroundColor: t.surfaceContainerLow,
        color: t.textPrimary,
        transition: 'background-color 150ms ease',
        '&:before, &:after': { display: 'none' },
        '&:hover:not(.Mui-disabled)': { backgroundColor: t.surfaceContainer },
        '&.Mui-focused': { backgroundColor: t.surfaceContainerLow },
        '&.Mui-disabled': { backgroundColor: t.surfaceOffWhite },
      },
      input: { padding: '12px 14px' },
      multiline: { '& .MuiFilledInput-input': { padding: '14px 16px' } },
    },
  },
});
