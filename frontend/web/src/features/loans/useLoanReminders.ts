import { useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { useAccounts, useLedgerSnapshot, useLoanPaymentHistory, useLoans } from '@/hooks/useFinance';
import { getLoanProgress, loanHasPaymentDueInCycle } from '@/libs/loanCalculations';
import { useAppContext } from '@/hooks/useAppContext';

/** Client-side funding reminder based on upcoming installments. */
export function useLoanReminders() {
  const { householdId } = useAppContext();
  const { enqueueSnackbar } = useSnackbar();
  const { data: loans = [] } = useLoans(householdId);
  const { data: accounts = [] } = useAccounts(householdId);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  now.setUTCDate(now.getUTCDate() + 3);
  const latestDueDate = now.toISOString().slice(0, 10);
  const candidateLoans = useMemo(
    () => loans.filter((loan) => loanHasPaymentDueInCycle(loan, today, latestDueDate)),
    [loans, today, latestDueDate],
  );
  const { data: paymentHistory } = useLoanPaymentHistory(householdId, candidateLoans.map((loan) => loan.id));
  const dueLoans = useMemo(() => candidateLoans.flatMap((loan) => {
    if (!paymentHistory) return [];
    const { nextDueDate } = getLoanProgress(loan, paymentHistory.transactions, paymentHistory.lines, today);
    if (!nextDueDate || nextDueDate < today || nextDueDate > latestDueDate) return [];
    return [{ loan, nextDueDate }];
  }), [candidateLoans, latestDueDate, paymentHistory, today]);
  const { data: snapshot } = useLedgerSnapshot(householdId, undefined, dueLoans.length > 0);

  useEffect(() => {
    if (!householdId || dueLoans.length === 0 || !accounts.length || !snapshot) return;
    for (const { loan, nextDueDate } of dueLoans) {
      if (!accounts.some((account) => account.id === loan.paymentAccountId)) continue;
      const balance = snapshot.balances[loan.paymentAccountId] ?? 0;
      const shortfall = Math.max(0, loan.installmentAmount - balance);
      if (shortfall <= 0) continue;
      const key = `kippa:loan-reminder:${householdId}:${loan.id}:${nextDueDate}`;
      if (localStorage.getItem(key)) continue;
      const message = `${loan.name}: add ${shortfall.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${loan.currency} before ${nextDueDate}.`;
      enqueueSnackbar(message, { variant: 'warning', persist: true });
      localStorage.setItem(key, new Date().toISOString());
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && 'serviceWorker' in navigator)
        void navigator.serviceWorker.ready.then((registration) =>
          registration.showNotification('Loan account needs funding', { body: message, tag: key }),
        );
    }
  }, [accounts, dueLoans, enqueueSnackbar, householdId, snapshot]);
}
