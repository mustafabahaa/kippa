# Kippa MCP server

Provider-neutral Model Context Protocol server over stateless Streamable HTTP.
MCP clients can connect with standard OAuth 2.1 authorization or with manually
provisioned bearer credentials. No model provider SDK, model name, or provider account is required.

## Build and deploy

From the repository root, run `npm ci` and `npm run functions:build`.
The build compiles Firebase functions and bundles the shared application tool
registry with server-side Firebase adapters. The generated `dist/` and
`dist-bundle/` directories are ignored and must not be committed.

Configure Firebase Admin through Application Default Credentials in the runtime.
Configure `KIPPA_WEB_API_KEY` in the Firebase functions environment (see
`../.env.example`). `GCLOUD_PROJECT` is supplied by the deployed runtime;
`KIPPA_FUNCTIONS_REGION` defaults to `us-central1` and must match the existing
callable functions. The web API key is Firebase client configuration, not an
Admin credential; there is no hardcoded key or production project fallback.
Never put service account keys or bearer tokens in source control.

Deploy the functions and Firestore rules with your configured Firebase project.
The endpoint is `https://<region>-<project>.cloudfunctions.net/kippaMcp`.
No deployment is performed by the build. The checked-in `firebase.json.example`
includes hosting rewrites for `/mcp`, OAuth discovery and authorization endpoints,
and the `/mcp-auth/consent` API; retain these in your local Firebase configuration.
Set `KIPPA_PUBLIC_URL` to the HTTPS origin serving Kippa (for example,
`https://your-project.web.app`).

## OAuth connections

Use the public URL `https://your-project.web.app/mcp` in your MCP client and
select OAuth with dynamic client registration. Client ID and secret are not
required: public clients use PKCE S256. Discovery is served at
`/.well-known/oauth-protected-resource/mcp` and
`/.well-known/oauth-authorization-server`.

The browser opens Kippa sign-in and consent. The household owner chooses a
household and explicitly approves the requested access. The `kippa:read` scope allows reads;
`kippa:write` additionally allows creating, updating and deleting Kippa records. OAuth access tokens expire
in one hour. Request `kippa:read offline_access` (or add `kippa:write` for writes) to stay connected with rotating
refresh tokens for up to 30 days. The selected resource, client, redirect URI,
PKCE challenge and user are bound throughout the flow. Authorization codes are
single-use and expire in one minute. Reusing a refresh token revokes its entire
grant; revocation also disables access tokens from that grant. Membership,
ownership and disabled account status are checked on every read.

The server uses the MCP SDK's OAuth endpoint handlers and stores authorization
state in server-only Firestore collections. Write access is granted only when the client requests `kippa:write` and the owner approves it.
Write-enabled calls execute immediately; use client-side approvals before mutations.
No model provider names or account assumptions are embedded in the flow.

## Manual bearer credentials

Use the authenticated Firebase callable functions with the owner's existing
Firebase session. These are management functions, not MCP tools:

- `createMcpCredential({ householdId, label, allowWrites?: boolean, expiresAt?: number })`
  returns `{ credential, token }`. Save `token` securely: it is returned once.
  Expiry is an epoch timestamp in milliseconds; the default is 30 days.
- `listMcpCredentials({ householdId })` returns redacted credential metadata.
- `revokeMcpCredential({ householdId, credentialId })` disables a credential.

Only an owner who still belongs to the household can manage credentials.
The endpoint rechecks ownership, membership, expiry, revocation, and disabled
Firebase accounts on every HTTP request. Tokens contain 32 random bytes and
only SHA-256 hashes are persisted. Firestore client access to credential records
is denied. There is no credential management screen yet.

## Connect a client

Configure your MCP client's remote URL and request header:

```json
{
  "url": "https://<region>-<project>.cloudfunctions.net/kippaMcp",
  "headers": { "Authorization": "Bearer <token-from-createMcpCredential>" }
}
```

The configuration envelope varies by client; `url` and `headers` illustrate the
required values. Keep actual tokens in the client's secret store. Never put
credentials in URL paths or query strings. Clients must send the standard MCP
`Accept: application/json, text/event-stream` header. The MCP SDK handles
initialization, `tools/list`, and `tools/call`.

The server accepts POST requests; GET and DELETE return 405. Sessions are
stateless. Browser origins are rejected. Server-side MCP clients work normally.
Browser-based consent uses the same-origin Kippa application. The MCP resource
itself is intended for server-side clients and rejects browser Origin headers.

## Tools and permissions

The app's existing tool definitions and validation schemas are reused. Browser
notification actions, household creation/switching/join/leave actions, chart UI
rendering, and listing other households are excluded. Database adapters enforce
the credential's household boundary and reject database path injection.

Credentials are read-only by default: mutating tools (including memory changes)
are neither listed nor callable. Setting `allowWrites: true` explicitly enables
mutating tools and allows immediate execution. There is no in-app confirmation
step in remote MCP calls. Configure the client to request approval before writes.
MCP tool annotations identify read-only and potentially destructive operations;
annotations are hints, while credential permissions are enforced by the server.

## Verify

Run `npm run functions:test` and `npm run functions:build`. Tests use mocked
Firebase services; deployment credentials and live financial data are not needed.

## Cloud Run ingress authentication

MCP authentication is enforced by Kippa. The HTTP functions must be publicly
invocable at the Cloud Run layer, so standard OAuth clients do not also need a
Google Cloud IAM token. With Cloud Run Invoker IAM checking enabled, opaque MCP
bearer credentials may be rejected before reaching the function. After deployment,
configure both HTTP services for application-managed authentication:

```sh
gcloud run services update kippamcp --no-invoker-iam-check --region us-central1 --project YOUR_PROJECT
gcloud run services update kippamcpauth --no-invoker-iam-check --region us-central1 --project YOUR_PROJECT
```

Unauthenticated MCP calls still return 401 from Kippa with OAuth discovery.
