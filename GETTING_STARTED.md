# Getting Started

End-to-end setup for Kippa — from an empty machine to a deployed, hosted PWA on Firebase. Written to be followable by a human **or** an AI agent checking out the repo.

> **Goal:** clone at 0:00, app running locally by 0:03, deployed to Firebase Hosting by 0:10.

---

## 0. Prerequisites (what you need installed first)

| Tool | Why | Required version |
| --- | --- | --- |
| **Node.js** | Run the app + functions build | 20 LTS or newer (22 recommended for Functions runtime) |
| **npm** | Install dependencies | comes with Node |
| **Firebase CLI** | Create project, deploy, configure | latest (`>=13`) |
| **Google Cloud CLI (`gcloud`)** | Enable APIs, manage auth provider config | latest |

### Install the Firebase CLI

```bash
# Using npm (works on all platforms)
npm install -g firebase-tools

# Verify
firebase --version
```

> macOS alternative: `brew install firebase-cli`
> The CLI is also available as a standalone binary from <https://github.com/firebase/firebase-tools/releases>.

### Install the Google Cloud CLI (`gcloud`)

**macOS (Apple Silicon):**
```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-darwin-arm.tar.gz
tar -xf google-cloud-cli-darwin-arm.tar.gz
./google-cloud-sdk/install.sh
exec -l $SHELL   # reload shell so gcloud is on PATH
```

**macOS (Intel):** replace `darwin-arm` with `darwin-x86_64` above.

**Linux:**
```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
tar -xf google-cloud-cli-linux-x86_64.tar.gz
./google-cloud-sdk/install.sh
exec -l $SHELL
```

**Windows:** download and run the installer from <https://cloud.google.com/sdk/docs/install>.

Verify:
```bash
gcloud --version
```

> **First time only — accept component updates:** if `gcloud` prompts to install additional components (e.g. `gcloud components install beta`), accept.

---

## 1. Authenticate

Sign in once; this authorizes both CLIs to act on your Google/Firebase account.

```bash
firebase login
gcloud auth login
```

A browser window opens — complete the OAuth flow for each. The Firebase CLI uses its own account login; `gcloud` is needed for project-level API and OAuth provider configuration in step 4.

> **Agent/headless mode (optional):** instead of `firebase login`, you can set `GOOGLE_APPLICATION_CREDENTIALS` to point at a service-account JSON key. This is the right path for CI/CD and AI agents without a browser.
> ```bash
> export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
> ```
> Generate the key in Google Cloud Console → IAM & Admin → Service accounts → your account → Keys → Add key → JSON.

---

## 2. Create a Firebase project

You can create the project from the [Firebase Console](https://console.firebase.google.com), but the CLI path below is fully scriptable.

### Option A — Firebase CLI (recommended)

```bash
firebase projects:create kippa-$(date +%s) --display-name "Kippa"
```

> The project ID must be globally unique. Appending a timestamp (or your GitHub handle) guarantees that. **Write down the returned project ID** — you'll use it everywhere below. We'll call it `$PROJECT_ID` in the rest of this guide.

Set it as the active project alias for this checkout:

```bash
# From the repo root:
PROJECT_ID=kippa-1234567890   # ← replace with your real project ID
firebase use --add "$PROJECT_ID"
```

`firebase use --add` creates a local `.firebaserc` with the right alias. (If it doesn't prompt, the default alias is used.)

### Option B — Console

Create a project at <https://console.firebase.google.com>, then run `firebase use --add <PROJECT_ID>` from the repo root.

---

## 3. Register a Web App and get config values

The PWA needs Firebase web SDK credentials. These are **public** client values — safe to ship in the app bundle — not secrets.

```bash
# Creates a web app named "Kippa web" and prints its config as JSON
firebase apps:create web "Kippa web" --project "$PROJECT_ID"

# Print the Web App's config values (apiKey, appId, projectId, …)
firebase apps:sdkconfig --project "$PROJECT_ID" web
```

Copy the printed `firebaseConfig` object — you'll paste its values into `app/.env` next.

### 3a. Get your Messaging Sender ID

The SDK config output above includes `messagingSenderId`. Note it.

---

## 4. Enable Firebase services

The app needs Auth, Firestore, Hosting, and Cloud Functions. Enable everything up front so deploys don't fail later.

```bash
# Link the project's underlying Google Cloud project for gcloud commands
gcloud config set project "$PROJECT_ID"

# Firestore (creates the database in production mode by default — adjust region as needed)
firebase firestore:databases:create --project "$PROJECT_ID" --location us-central1 || true

# Enable the Google Cloud APIs the project needs
gcloud services enable \
  firebase.googleapis.com \
  firebaserules.googleapis.com \
  firestore.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  firebasehosting.googleapis.com \
  identitytoolkit.googleapis.com
```

> **Region:** pick one close to your users. Firestore location cannot be changed later. `us-central1` is a safe default; for EU use `europe-west1`.

---

## 5. Enable Google sign-in (Authentication provider)

Kippa authenticates via Google sign-in.

**Console path (simplest):** Firebase Console → *Build → Authentication → Sign-in method → Google → Enable.*

**gcloud path (scriptable):** the Identity Toolkit API handles this; for the standard Google provider you typically enable it in the Console. If you've already done so, no further action is needed.

Either way, also set the **authorized domains** under Authentication → Settings → so your Firebase Hosting domain (`<PROJECT_ID>.web.app`) and `localhost` are allowed:

```bash
# localhost and the Firebase domain are pre-allowed by default. Verify in:
# Console → Authentication → Settings → Authorized domains
```

---

## 6. Generate a Web Push VAPID key (for notifications)

Push notifications require an FCM Web Push certificate key pair.

```bash
firebase apps:web:get-web-push-config --project "$PROJECT_ID" || true
```

If a key pair doesn't exist yet, generate one:

**Console path:** Firebase Console → *Project settings → Cloud Messaging → Web Push certificates → Generate key pair.*

Copy the resulting **public key** (long string starting with `B…`). You'll paste it as `VITE_FIREBASE_VAPID_KEY` below.

---

## 7. Configure the repo's local files

Four files hold project-specific values and are gitignored. Each has a committed `.example` template — copy and fill in. Run everything from the repo root.

### 7a. App environment — `app/.env`

```bash
cp app/.env.example app/.env
```

Open `app/.env` and fill in the values from step 3 and 6:

```dotenv
VITE_FIREBASE_API_KEY=AIza…                  # from apps:sdkconfig
VITE_FIREBASE_AUTH_DOMAIN=<PROJECT_ID>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<PROJECT_ID>
VITE_FIREBASE_STORAGE_BUCKET=<PROJECT_ID>.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=…          # from apps:sdkconfig
VITE_FIREBASE_APP_ID=1:…:web:…               # from apps:sdkconfig
VITE_FIREBASE_MEASUREMENT_ID=                # optional, leave blank
VITE_FIREBASE_VAPID_KEY=B…                    # from step 6
```

### 7b. Service worker — `app/public/firebase-messaging-sw.js`

Service workers can't read `.env`, so the FCM config must be inlined (these are the same **public** client values, not secrets).

```bash
cp app/public/firebase-messaging-sw.example.js app/public/firebase-messaging-sw.js
```

Open the new file and replace every `YOUR_*` placeholder with the matching value from step 3:

```js
firebase.initializeApp({
  apiKey: 'AIza…',
  authDomain: '<PROJECT_ID>.firebaseapp.com',
  projectId: '<PROJECT_ID>',
  storageBucket: '<PROJECT_ID>.firebasestorage.app',
  messagingSenderId: '…',
  appId: '1:…:web:…',
});
```

### 7c. Firebase CLI alias — `.firebaserc`

If you ran `firebase use --add` in step 2, this already exists. If not:

```bash
cp .firebaserc.example .firebaserc
```

Then set the default project:

```json
{
  "projects": { "default": "<PROJECT_ID>" },
  "targets": {},
  "etags": {}
}
```

### 7d. Firebase config — `firebase.json`

```bash
cp firebase.json.example firebase.json
```

Update the OAuth support email to one you own:

```json
"auth": {
  "providers": {
    "googleSignIn": {
      "oAuthBrandDisplayName": "Kippa",
      "supportEmail": "you@example.com"
    }
  }
}
```

> If you prefer not to set auth-provider config via `firebase.json`, you can skip that block entirely and manage it in the Console.

---

## 8. Install dependencies

```bash
npm install
```

This installs both the `app/` and `functions/` workspaces (the repo is an npm workspace monorepo).

---

## 9. Run locally

```bash
npm run dev
```

Vite starts on <http://localhost:5173>. The app will:

- Initialize Firebase using `app/.env`.
- Connect to Firestore (offline persistence enabled automatically).
- Offer Google sign-in.

### Run tests, lint, type-check

```bash
npm run test       # Vitest — app + functions
npm run lint
npm run typecheck
```

---

## 10. Deploy to Firebase

A single command builds the app and deploys Hosting + Firestore rules + indexes + Cloud Functions:

```bash
npm run deploy
```

Which is equivalent to:

```bash
npm run build                      # builds app/ into app/dist
firebase deploy --only hosting,firestore:rules,firestore:indexes,functions
```

When it completes, the CLI prints your live URLs:

- Hosting: `https://<PROJECT_ID>.web.app`
- Functions: `https://<region>-<PROJECT_ID>.cloudfunctions.net/…`

### Deploy only what changed

```bash
npm run deploy:web        # hosting only (fast — no function rebuild)
npm run deploy:functions  # functions only
firebase deploy --only firestore:rules     # rules only
firebase deploy --only firestore:indexes   # indexes only
```

---

## 11. Post-deploy checklist

After your first deploy, confirm:

- [ ] Opening `https://<PROJECT_ID>.web.app` shows the Kippa app and login screen.
- [ ] Google sign-in completes (if it fails, check *Authentication → Authorized domains* includes your `.web.app` domain).
- [ ] Signing in creates a `users/{uid}` document in Firestore (check Console → Firestore).
- [ ] The daily reminder scheduled function appears under *Functions → Schedules* in the Console.
- [ ] Firestore indexes are building (Console → Firestore → Indexes). Composite indexes can take a few minutes.
- [ ] On a phone, "Add to Home Screen" installs the PWA.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `firebase login` opens a browser that won't load | Use `firebase login --no-localhost` and paste the OAuth code manually. |
| `Permission denied` on deploy | Run `firebase login` again; ensure you're an Owner/Editor on the Firebase project. |
| Firestore composite-index errors at runtime | Re-run `firebase deploy --only firestore:indexes` and wait a few minutes. |
| Google sign-in blocked | Add your domain under *Authentication → Settings → Authorized domains*. |
| Functions deploy fails on `cloudfunctions.googleapis.com` | Run the `gcloud services enable …` block from step 4 again. |
| `dailyReminderCron` schedule not created | The Cloud Scheduler API must be enabled (step 4) and the project must be on the Blaze (pay-as-you-go) plan. Scheduled functions require Blaze. |
| Push notifications silently fail | Verify `VITE_FIREBASE_VAPID_KEY` and the inlined values in `firebase-messaging-sw.js` match your project. |
| `gcloud: command not found` after install | Reload your shell: `exec -l $SHELL`, or open a new terminal. |

---

## Agent / CI notes

- All sensitive values live in gitignored files (`app/.env`, `.firebaserc`, `firebase.json`, `firebase-messaging-sw.js`). Never commit them.
- For headless auth, set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account key with Owner/Editor + Firebase Admin roles.
- The full setup is scriptable; the only step that usually needs a human is generating the initial VAPID key pair, after which every value can be persisted as a CI secret.
- The Functions runtime is pinned to `nodejs22` in `firebase.json` — your CI Node version only needs to be able to build TS, not match exactly.
