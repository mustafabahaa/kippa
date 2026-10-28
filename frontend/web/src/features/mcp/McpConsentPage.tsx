import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useSearchParams } from 'react-router-dom';
import { auth } from '@/config/firebase';
import { useAppContext } from '@/hooks/useAppContext';

type ConsentRequest = {
  clientName: string;
  redirectUri: string;
  scopes: string[];
  expiresAt: string | number;
};

type ConsentResponse = { redirectUrl: string };

type ApiError = { error?: string; message?: string };

function errorMessage(body: ApiError, fallback: string) {
  return body.message || body.error || fallback;
}

export function McpConsentPage() {
  const { userProfile, householdId, userHouseholds, isLoadingHouseholds } = useAppContext();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('request') ?? '';
  const [request, setRequest] = useState<ConsentRequest | null>(null);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(householdId);
  const [loadedRequestId, setLoadedRequestId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<{ requestId: string; message: string } | null>(null);
  const isLoadingRequest = !!requestId && loadedRequestId !== requestId;
  const error = !requestId
    ? 'This authorization link is missing its request ID. Start again from your MCP client.'
    : requestError?.requestId === requestId
      ? requestError.message
      : '';

  useEffect(() => {
    if (!requestId) return;

    const controller = new AbortController();
    void fetch(`/mcp-auth/consent?request=${encodeURIComponent(requestId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as ConsentRequest & ApiError;
        if (!response.ok) throw new Error(errorMessage(body, 'Could not load the authorization request.'));
        if (
          typeof body.clientName !== 'string' ||
          typeof body.redirectUri !== 'string' ||
          !Array.isArray(body.scopes) ||
          !body.scopes.every((scope) => typeof scope === 'string') ||
          (typeof body.expiresAt !== 'string' && typeof body.expiresAt !== 'number')
        ) {
          throw new Error('The authorization service returned an invalid request.');
        }
        if (!Number.isFinite(new Date(body.expiresAt).getTime())) {
          throw new Error('The authorization service returned an invalid expiration time.');
        }
        setRequest(body);
        setLoadedRequestId(requestId);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setRequestError({
          requestId,
          message: caught instanceof Error ? caught.message : 'Could not load the authorization request.',
        });
        setLoadedRequestId(requestId);
      });

    return () => controller.abort();
  }, [requestId]);

  const selectedHousehold = userHouseholds.find((household) => household.id === selectedHouseholdId);
  const isOwner = !!selectedHousehold && selectedHousehold.createdBy === userProfile?.uid;
  const requestsWriteAccess = request?.scopes.includes('kippa:write') ?? false;

  const chooseHousehold = (event: SelectChangeEvent) => {
    setSelectedHouseholdId(event.target.value);
    setRequestError(null);
  };

  const submitDecision = async (decision: 'approve' | 'deny') => {
    if (!requestId || !selectedHouseholdId || !auth?.currentUser) {
      setRequestError({ requestId, message: 'Sign in and choose a household before continuing.' });
      return;
    }
    if (decision === 'approve' && !isOwner) {
      setRequestError({ requestId, message: 'Only the owner of the selected household can approve access.' });
      return;
    }

    setIsSubmitting(true);
    setRequestError(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/mcp-auth/consent', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, householdId: selectedHouseholdId, decision }),
      });
      const body = (await response.json().catch(() => ({}))) as ConsentResponse & ApiError;
      if (!response.ok) throw new Error(errorMessage(body, 'Could not complete the authorization request.'));
      if (typeof body.redirectUrl !== 'string') {
        throw new Error('The authorization service returned no redirect URL.');
      }
      window.location.assign(body.redirectUrl);
    } catch (caught) {
      setRequestError({
        requestId,
        message: caught instanceof Error ? caught.message : 'Could not complete the authorization request.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 } }}>
      <Card sx={{ width: '100%', maxWidth: 560 }}>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h3">Authorize MCP access</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Review which household data this client is requesting before you continue.
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {isLoadingRequest ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress aria-label="Loading authorization request" />
              </Stack>
            ) : request ? (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="sectionLabel" color="text.secondary">
                    Client
                  </Typography>
                  <Typography variant="body1">{request.clientName}</Typography>
                </Box>
                <Box>
                  <Typography variant="sectionLabel" color="text.secondary">
                    Redirect destination
                  </Typography>
                  <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                    {request.redirectUri}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="sectionLabel" color="text.secondary">
                    Request expires
                  </Typography>
                  <Typography variant="body2">{new Date(request.expiresAt).toLocaleString()}</Typography>
                </Box>
                <Alert severity={requestsWriteAccess ? 'warning' : 'info'}>
                  {requestsWriteAccess
                    ? 'This client can view household information and create, update, or delete Kippa records. It cannot move money or make payments through your bank.'
                    : 'This grants read-only access. The client can view the selected household’s information; it cannot make changes.'}
                </Alert>
                {request.scopes.length > 0 && (
                  <Box>
                    <Typography variant="sectionLabel" color="text.secondary">
                      Requested access
                    </Typography>
                    <Stack component="ul" spacing={0.5} sx={{ mt: 0.5, mb: 0, pl: 2.5 }}>
                      {request.scopes.map((scope) => (
                        <Typography component="li" variant="body2" key={scope}>
                          {scope === 'kippa:read'
                            ? 'Read household financial information'
                            : scope === 'kippa:write'
                              ? 'Create, update, and delete Kippa records'
                            : scope === 'offline_access'
                              ? 'Stay connected for up to 30 days'
                              : scope}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
                <FormControl fullWidth disabled={isLoadingHouseholds || isSubmitting}>
                  <InputLabel id="mcp-household-label">Household</InputLabel>
                  <Select
                    labelId="mcp-household-label"
                    label="Household"
                    value={selectedHouseholdId}
                    onChange={chooseHousehold}
                  >
                    {userHouseholds.map((household) => (
                      <MenuItem key={household.id} value={household.id}>
                        {household.name}
                        {household.createdBy === userProfile?.uid ? ' (owner)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {!isOwner && (
                  <Alert severity="warning">Approval is available only to the owner of the selected household.</Alert>
                )}
                <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="inherit"
                    disabled={isSubmitting || !selectedHouseholdId || isLoadingHouseholds}
                    onClick={() => void submitDecision('deny')}
                  >
                    Deny
                  </Button>
                  <Button
                    variant="contained"
                    disabled={
                      isSubmitting ||
                      !!error ||
                      isLoadingRequest ||
                      !selectedHouseholdId ||
                      !isOwner ||
                      isLoadingHouseholds
                    }
                    onClick={() => void submitDecision('approve')}
                    startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                  >
                    {requestsWriteAccess ? 'Approve read and write access' : 'Approve read-only access'}
                  </Button>
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
