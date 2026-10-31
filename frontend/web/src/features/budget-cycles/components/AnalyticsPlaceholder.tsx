import { Skeleton, Stack, Typography } from '@mui/material';

export function AnalyticsPlaceholder({ loading }: { loading: boolean }) {
  return (
    loading ? (
      <Stack spacing={2}>
        <Skeleton variant="text" width="40%" height={28} animation="wave" />
        <Skeleton variant="rounded" width="100%" height={200} animation="wave" />
      </Stack>
    ) : (
      <Stack spacing={1}>
        <Typography variant="h5">No analytics data yet</Typography>
        <Typography variant="body2" color="text.secondary">
          Once a cycle has transactions, cash flow and category trends will appear here.
        </Typography>
      </Stack>
    )
  );
}
