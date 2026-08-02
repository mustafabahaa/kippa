import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { createKippaTheme } from '@kippa/design-system';
import { describe, expect, it, vi } from 'vitest';

const { executeAction, savePendingActions, addMessage } = vi.hoisted(() => ({
  executeAction: vi.fn(async () => ({ ok: true })),
  savePendingActions: vi.fn(async () => undefined),
  addMessage: vi.fn(async (_householdId: string, conversationId: string, role: 'user' | 'assistant', content: string) => ({ id: 'done', householdId: 'h', conversationId, role, content, createdAt: new Date().toISOString() })),
}));

vi.mock('@/hooks/useAppContext', () => ({ useAppContext: () => ({ householdId: 'h', userProfile: { uid: 'u', displayName: 'User' }, createHousehold: vi.fn(), switchHousehold: vi.fn(), requestToJoinHousehold: vi.fn(), decideJoinRequest: vi.fn(), leaveHousehold: vi.fn() }) }));
vi.mock('@/notifications/useNotifications', () => ({ useNotifications: () => ({ requestPermission: vi.fn(), disable: vi.fn() }) }));
vi.mock('./services/readTools', async importOriginal => ({ ...(await importOriginal<typeof import('./services/readTools')>()), executePendingAiAction: executeAction }));
vi.mock('./services/conversations', () => ({ aiConversations: {
  list: vi.fn(async () => [{ id: 'c', householdId: 'h', createdBy: 'u', title: 'Test', createdAt: '', updatedAt: '', pendingActions: [{ id: 'a', toolName: 'createAccount', input: { name: 'Savings' }, summary: 'Create Savings (EGP)', risk: 'write' }] }]),
  messagesPage: vi.fn(async () => ({ messages: [{ id: 'm', householdId: 'h', conversationId: 'c', role: 'assistant', content: 'Please confirm.', createdAt: '' }], nextCursor: null })),
  savePendingActions,
  addMessage,
} }));

import { AiAssistant } from './AiAssistant';

describe('AiAssistant confirmations', () => {
  it('restores a pending proposal and executes it only after an explicit click', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><ThemeProvider theme={createKippaTheme('light')}><AiAssistant /></ThemeProvider></QueryClientProvider>);
    expect(await screen.findByText('Create Savings (EGP)')).toBeInTheDocument();
    expect(executeAction).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(executeAction).toHaveBeenCalledTimes(1));
    expect(addMessage).toHaveBeenCalledWith('h', 'c', 'assistant', 'Done — Create Savings (EGP).');
    expect(savePendingActions).toHaveBeenCalledWith('h', 'c', []);
  });
});
