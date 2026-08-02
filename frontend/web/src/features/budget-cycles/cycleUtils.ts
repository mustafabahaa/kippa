export type CycleDaysInfo = {
  elapsed: number;
  progress: number | null;
  remaining: number | null;
  total: number | null;
};

export function getDaysInfo(startDate: string, endDate?: string | null): CycleDaysInfo {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const elapsed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000));
  if (!endDate) return { elapsed, total: null, remaining: null, progress: null };
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const total = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
  return {
    elapsed,
    total,
    remaining: Math.max(0, Math.floor((end.getTime() - today.getTime()) / 86_400_000)),
    progress: Math.min(100, Math.round((elapsed / total) * 100)),
  };
}

export function formatCycleDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
