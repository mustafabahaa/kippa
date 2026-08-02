import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import type { MessageIngestionCredential } from '@kippa/domain';
import { messageIngestionLib } from '@/libs/messageIngestion';

export function useMessageConnections(householdId: string) {
  const { enqueueSnackbar } = useSnackbar();
  const [credentials, setCredentials] = useState<MessageIngestionCredential[]>([]);
  const [generated, setGenerated] = useState<{ token: string; endpoint: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = async () => setCredentials(await messageIngestionLib.listCredentials(householdId));
  useEffect(() => { messageIngestionLib.listCredentials(householdId).then(setCredentials).catch(() => setCredentials([])); }, [householdId]);
  const create = async () => { setBusy(true); try { const result = await messageIngestionLib.createCredential(householdId); setGenerated({ token: result.token, endpoint: result.endpoint }); await refresh(); } catch (error) { enqueueSnackbar(error instanceof Error ? error.message : 'Could not create the connection', { variant: 'error' }); } finally { setBusy(false); } };
  const revoke = async (id: string) => { try { await messageIngestionLib.revokeCredential(id); await refresh(); enqueueSnackbar('Connection revoked', { variant: 'info' }); } catch (error) { enqueueSnackbar(error instanceof Error ? error.message : 'Could not revoke the connection', { variant: 'error' }); } };
  const copy = async (value: string, label: string) => { await navigator.clipboard.writeText(value); enqueueSnackbar(`${label} copied`, { variant: 'success' }); };
  return { busy, copy, create, credentials, generated, revoke };
}
