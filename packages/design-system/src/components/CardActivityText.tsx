import { styled } from '@mui/material/styles';
import Typography, { type TypographyProps } from '@mui/material/Typography';

type CardActivityTextProps = Omit<TypographyProps, 'color'> & { paid: boolean };

const CardActivityTextRoot = styled(Typography, {
  name: 'KippaCardActivityText',
  slot: 'Root',
  shouldForwardProp: (prop) => prop !== 'paid',
})<{ paid: boolean }>(({ theme, paid }) =>
  paid
    ? {
        color: theme.palette.text.disabled,
        textDecoration: 'line-through',
      }
    : {},
);

/** Typography treatment for settled card charges, shared by all card activity views. */
export function CardActivityText({ paid, ...props }: CardActivityTextProps) {
  return <CardActivityTextRoot paid={paid} {...props} />;
}
