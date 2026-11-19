import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Categories } from './Categories';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  createAsync: vi.fn().mockResolvedValue(undefined),
  deleteAsync: vi.fn().mockResolvedValue(undefined),
  isCategoryUsed: vi.fn().mockResolvedValue(false),
  enqueueSnackbar: vi.fn(),
}));

vi.mock('@/hooks/useAppContext', () => ({ useAppContext: () => ({ householdId: 'household' }) }));
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }) }));
vi.mock('@/hooks/useFinance', () => ({
  useCategories: () => ({
    data: [
      { id: 'income-1', householdId: 'household', name: 'Salary', type: 'income', isActive: true, createdAt: '' },
      {
        id: 'expense-1',
        householdId: 'household',
        name: 'Subscriptions',
        type: 'expense',
        isActive: true,
        createdAt: '',
        merchantKeywords: ['Netflix'],
      },
      { id: 'expense-2', householdId: 'household', name: 'Food', type: 'expense', isActive: true, createdAt: '' },
    ],
    isLoading: false,
  }),
  useCreateCategoryMutation: () => ({ isPending: false, mutateAsync: mocks.createAsync }),
  useUpdateCategoryMutation: () => ({ isPending: false, mutateAsync: mocks.mutateAsync }),
  useDeleteCategoryMutation: () => ({ isPending: false, mutateAsync: mocks.deleteAsync }),
}));
vi.mock('@/libs/ledger', () => ({ ledgerLib: { isCategoryUsed: mocks.isCategoryUsed } }));

describe('Categories edit', () => {
  beforeEach(() => {
    mocks.mutateAsync.mockClear();
    mocks.deleteAsync.mockClear();
    mocks.isCategoryUsed.mockReset().mockResolvedValue(false);
    mocks.enqueueSnackbar.mockClear();
  });

  it('renames the selected category with a trimmed name and keeps its merchants', async () => {
    const user = userEvent.setup();
    render(<Categories />);

    await user.click(screen.getByRole('button', { name: 'Edit category Subscriptions' }));
    const input = screen.getByLabelText('Category Name');
    expect(input).toHaveValue('Subscriptions');
    await user.clear(input);
    await user.type(input, '  Streaming  ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      householdId: 'household',
      categoryId: 'expense-1',
      updates: { name: 'Streaming', merchantKeywords: ['Netflix'] },
    });
  });

  it('adds and removes merchants from the edited category', async () => {
    const user = userEvent.setup();
    render(<Categories />);

    await user.click(screen.getByRole('button', { name: 'Edit category Subscriptions' }));
    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByText('Netflix')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Add merchant'), 'Spotify');
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(within(dialog).getByText('Spotify')).toBeInTheDocument();

    await user.click(within(dialog).getByLabelText('Remove Netflix'));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      householdId: 'household',
      categoryId: 'expense-1',
      updates: { name: 'Subscriptions', merchantKeywords: ['Spotify'] },
    });
  });

  it('cancels without writing and disables save for an empty name', async () => {
    const user = userEvent.setup();
    render(<Categories />);

    await user.click(screen.getByRole('button', { name: 'Edit category Salary' }));
    const input = screen.getByLabelText('Category Name');
    await user.clear(input);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('creates a category with its merchant keywords', async () => {
    const user = userEvent.setup();
    render(<Categories />);

    await user.click(screen.getByRole('button', { name: 'Add category' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Category Name'), 'Coffee');
    await user.type(within(dialog).getByLabelText('Add merchant'), 'BEANOS');
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));
    await user.click(within(dialog).getByRole('button', { name: 'Create category' }));

    expect(mocks.createAsync).toHaveBeenCalledWith({
      householdId: 'household',
      category: { name: 'Coffee', type: 'expense', isActive: true, merchantKeywords: ['BEANOS'] },
    });
  });

  it('deletes an unused category without asking for a replacement', async () => {
    const user = userEvent.setup();
    render(<Categories />);

    await user.click(screen.getByRole('button', { name: 'Edit category Salary' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete category' }));
    expect(within(dialog).getByText(/has no linked transactions or budget allocations/)).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Move records to')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete category' }));

    expect(mocks.deleteAsync).toHaveBeenCalledWith({
      householdId: 'household',
      categoryId: 'income-1',
      replacementCategoryId: undefined,
    });
  });

  it('requires a same-type replacement when the category is used', async () => {
    mocks.isCategoryUsed.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<Categories />);

    await user.click(screen.getByRole('button', { name: 'Edit category Subscriptions' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete category' }));
    expect(within(dialog).getByLabelText('Move records to')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Move & delete' }));

    expect(mocks.deleteAsync).toHaveBeenCalledWith({
      householdId: 'household',
      categoryId: 'expense-1',
      replacementCategoryId: 'expense-2',
    });
  });
});
