import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { CheckCircleIcon, CloseIcon, ContentCopyIcon, KeyIcon, NotesIcon } from '@/components/AppIcon';
import { cancelAiConnection, getAiConnection, startAiConnection, type AiConnectionDevice } from './services/connection';

export type AiConnectionStatus = 'checking' | 'connected' | 'disconnected';

type Props = {
  onStatusChange: (status: AiConnectionStatus) => void;
};

export function AiConnectionPanel({ onStatusChange }: Props) {
  const [status, setStatus] = useState<AiConnectionStatus>('checking');
  const [device, setDevice] = useState<AiConnectionDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const updateStatus = (next: AiConnectionStatus) => {
    setStatus(next);
    onStatusChange(next);
  };

  useEffect(() => {
    let active = true;
    void getAiConnection()
      .then((connection) => {
        if (!active) return;
        updateStatus(connection.connected ? 'connected' : 'disconnected');
      })
      .catch((caught) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Kip could not check the connection.');
        updateStatus('disconnected');
      });
    return () => {
      active = false;
      abortRef.current?.abort();
    };
  }, []);

  const connect = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError('');
    setDevice(null);
    setIsConnecting(true);
    try {
      const connection = await startAiConnection((nextDevice) => setDevice(nextDevice), controller.signal);
      if (!controller.signal.aborted) updateStatus(connection.connected ? 'connected' : 'disconnected');
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : 'Kip could not connect to ChatGPT.');
        updateStatus('disconnected');
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsConnecting(false);
      }
    }
  };

  const cancel = async () => {
    if (device) await cancelAiConnection(device.attemptId).catch(() => {});
    abortRef.current?.abort();
    abortRef.current = null;
    setIsConnecting(false);
    setDevice(null);
  };

  if (status === 'checking')
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  if (status === 'connected') return null;

  return (
    <Stack
      spacing={2.5}
      alignItems="center"
      justifyContent="center"
      sx={{ flex: 1, textAlign: 'center', py: { xs: 3, sm: 6 } }}
    >
      <Paper variant="assistantAvatar">
        <NotesIcon />
      </Paper>
      <Box>
        <Typography variant="h6">Connect Kip to ChatGPT</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 460 }}>
          Sign in with your ChatGPT account to use Kip here. Your chat and Kippa data stay tied to your account.
        </Typography>
      </Box>
      {error && (
        <Alert severity="warning" sx={{ width: '100%', maxWidth: 520 }}>
          {error}
        </Alert>
      )}
      {device && (
        <Paper variant="assistantAction" sx={{ width: '100%', maxWidth: 520, textAlign: 'left' }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="sectionLabel">Finish sign-in</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Open the verification page, then enter this one-time code.
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <KeyIcon fontSize="small" />
              <Typography variant="h6" sx={{ flex: 1 }}>
                {device.code}
              </Typography>
              <Button
                variant="segmented"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => void navigator.clipboard.writeText(device.code)}
              >
                Copy
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                component="a"
                href={device.verificationUrl}
                target="_blank"
                rel="noreferrer"
                variant="segmentedSelected"
              >
                Open ChatGPT sign-in
              </Button>
              <Button variant="segmented" startIcon={<CloseIcon fontSize="small" />} onClick={() => void cancel()}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
      {!device && !isConnecting && (
        <Button variant="primaryAction" onClick={() => void connect()} startIcon={<CheckCircleIcon fontSize="small" />}>
          Connect ChatGPT
        </Button>
      )}
      {isConnecting && !device && (
        <Stack alignItems="center" spacing={1}>
          <CircularProgress size={20} />
          <Typography variant="fieldHint" color="text.secondary">
            Waiting for sign-in…
          </Typography>
          <Button variant="segmented" onClick={() => void cancel()}>
            Cancel
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
