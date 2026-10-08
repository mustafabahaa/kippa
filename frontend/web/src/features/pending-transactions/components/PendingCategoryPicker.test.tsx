import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { Account, Category, PendingFinancialMessage } from '@kippa/domain';
import { PrivacyModeProvider } from '@/hooks/PrivacyModeProvider';
import { PendingReviewDialog } from './PendingReviewDialog';

vi.mock('@/hooks/useAppContext', () => ({ useAppContext: () => ({ householdId: 'household' }) }));
const frequency = vi.fn(() => ({ 'cat-3': 5, 'cat-1': 2 } as Record<string, number>));
vi.mock('@/hooks/useFinance', () => ({ useCategoryFrequency: () => frequency() }));

const account: Account = {
  id: 'acc-1', householdId: 'household', name: 'EGP Bank', type: 'running',
  currency: 'EGP', isActive: true, sortOrder: 0, createdAt: '2026-08-02T00:00:00.000Z',
};

const makeCategory = (i: number): Category => ({
  id: `cat-${i}`, householdId: 'household', name: `Category ${i}`, type: 'expense',
  isActive: true, createdAt: '2026-08-02T00:00:00.000Z',
});

const item: PendingFinancialMessage = {
  id: 'pending-1', householdId: 'household', receivedBy: 'user', kind: 'expense',
  source: 'ios-shortcut', provider: 'hsbc', amount: 100, currency: 'EGP', date: '2026-08-02',
  description: 'TEST MERCHANT', messagePreview: 'HSBC card purchase',
  suggestedAccountId: null, createdAt: '2026-08-02T00:00:00.000Z', status: 'pending',
};

it('orders chips by frequency, opens the More dialog with search, and commits a selection', async () => {
  const user = userEvent.setup();
  const onCategoryChange = vi.fn();
  const categories = Array.from({ length: 10 }, (_, i) => makeCategory(i + 1));

  render(
    <PrivacyModeProvider>
      <PendingReviewDialog
        accountId="acc-1"
        accounts={[account]}
        busy={false}
        categories={categories}
        categoryId=""
        destinationAccountId=""
        destinationAccounts={[]}
        item={item}
        onAccountChange={vi.fn()}
        onApprove={vi.fn()}
        onCategoryChange={onCategoryChange}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
        onDiscard={vi.fn()}
        state="idle"
      />
    </PrivacyModeProvider>,
  );

  // Only scored categories become chips (Fast Entry behavior): the two with
  // usage history, frequency-first.
  const chips = screen.getAllByRole('button').filter((b) => b.textContent?.startsWith('Category '));
  expect(chips[0]).toHaveTextContent('Category 3');
  expect(chips).toHaveLength(2);
  expect(screen.getByRole('button', { name: /More \(8\)/ })).toBeInTheDocument();

  // The unscored categories are reachable through the search dialog.
  await user.click(screen.getByRole('button', { name: /More \(8\)/ }));
  expect(screen.getByText('Choose category')).toBeInTheDocument();
  await user.type(screen.getByPlaceholderText('Search categories'), 'Category 9');
  await user.click(screen.getByRole('button', { name: 'Category 9' }));

  expect(onCategoryChange).toHaveBeenCalledWith('cat-9');
  await waitFor(() => expect(screen.queryByText('Choose category')).toBeNull());
});
