import { forwardRef } from 'react';
import { styled } from '@mui/material/styles';

export type ChartColorMarkerProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> & {
  color: string;
};

const Root = styled('span', {
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>(({ color }) => ({
  display: 'block',
  width: 8,
  height: 8,
  flexShrink: 0,
  borderRadius: '50%',
  backgroundColor: color,
}));

/** Marker for chart series whose color is supplied by the underlying data. */
export const ChartColorMarker = forwardRef<HTMLSpanElement, ChartColorMarkerProps>(function ChartColorMarker(
  { color, ...props },
  ref,
) {
  return <Root ref={ref} color={color} aria-hidden="true" {...props} />;
});
