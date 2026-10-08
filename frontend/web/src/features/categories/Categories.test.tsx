import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Categories } from './Categories';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  createAsync: vi.fn().mockResolvedValue(undefined),
  enqueueSnackbar: vi.fn(),
}));

vi.mock('@/hooks/useAppContext', () => ({ useAppContext: () => ({ householdId: 'household' }) }));
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }) }));
vi.mock('@/hooks/useFinance', () => ({
  useCategories: () => ({ data: [
    { id: 'income-1', householdId: 'household', name: 'Salary', type: 'income', isActive: true, createdAt: '' },
    { id: 'expense-1', householdId: 'household', name: 'Subscriptions', type: 'expense', isActive: true, createdAt: '', merchantKeywords: ['Netflix'] },
  ], isLoading: false }),
  useCreateCategoryMutation: () => ({ isPending: false, mutateAsync: mocks.createAsync }),
  useUpdateCategoryMutation: () => ({ isPending: false, mutateAsync: mocks.mutateAsync }),
}));

describe('Categories edit', () => {
  beforeEach(() => {
    mocks.mutateAsync.mockClear();
    mocks.enqueueSnackbar.mockClear();
  });

  it('renames the selected category with a trimmed name and keeps its merchants', async () => {
    const user = userEvent.setup();
    render(<Categories />);

    await user.click(screen.getByRole('button', { name: 'Edit Subscriptions' }));
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

    await user.click(screen.getByRole('button', { name: 'Edit Subscriptions' }));
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

    await user.click(screen.getByRole('button', { name: 'Edit Salary' }));
    const input = screen.getByLabelText('Category Name');
    await user.clear(input);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('creates a category with its merchant keywords', async () => {
    const user = userEvent.setup();
    render(<Categories />);

    await user.type(screen.getByLabelText('Category name'), 'Coffee');
    await user.type(screen.getByLabelText('Add merchant'), 'BEANOS');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: 'Create Category' }));

    expect(mocks.createAsync).toHaveBeenCalledWith({
      householdId: 'household',
      category: { name: 'Coffee', type: 'expense', isActive: true, merchantKeywords: ['BEANOS'] },
    });
  });
});
