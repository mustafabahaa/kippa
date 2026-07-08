<p align="center">
  <img src="./app/public/icons/logo_white_on_green.png" alt="Kippa" width="160" />
</p>

<h1 align="center">Kippa</h1>

<p align="center">
  A fast, ledger-first household finance PWA. Record expenses in seconds, know exactly where your money is, and see whether you're on track — across phone and desktop.
</p>

<p align="center">
  <a href="./LICENSE">
    <img alt="License: PolyForm Noncommercial" src="https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-4a7f5e?style=flat-square" />
  </a>
  <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-installable-blueviolet?style=flat-square" />
  <img alt="Made with React" src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white" />
  <img alt="Powered by Firebase" src="https://img.shields.io/badge/Firebase-powered-orange?style=flat-square&logo=firebase&logoColor=white" />
  <img alt="MUI" src="https://img.shields.io/badge/MUI-7-007fff?style=flat-square&logo=mui&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white" />
</p>

---

> ⚠️ **License notice.** This project is licensed under the **PolyForm Noncommercial License 1.0.0**. Personal and non-commercial use is fully permitted. **Commercial use requires a separate paid license** — see [LICENSE](./LICENSE) or contact `mustafa.bahaa123@gmail.com`.

---

## ✨ Features

- **Ledger-first architecture.** Store raw financial events; balances, projections, and reports are derived — never hardcoded into the data model.
- **Fast expense entry.** Recording an expense takes seconds, with smart category chips ordered by your recency and frequency.
- **Multi-currency.** First-class support for USD and EGP. USD→EGP transfers are modeled as transfers (not income).
- **Salary-cycle budgeting.** Budget around salary cycles (which may land on the 25th, 26th, or 27th) instead of rigid calendar months.
- **Real-time sync.** Cloud Firestore keeps two partners in sync across phone and PC, with offline persistence.
- **Budget pulse.** A clear answer to *“Am I on track or overspending?”* and *“Can I safely spend at this pace until next salary?”*
- **Push notifications.** Daily reminders and shared-household activity via Firebase Cloud Messaging.
- **Installable PWA.** Add to home screen; works offline and loads fast.
- **Manual reconciliation.** No bank API required — reconcile balances when reality drifts.

## 🧱 Tech stack

| Area | Tech |
| --- | --- |
| Frontend | React 19, Vite 7, TypeScript 5.8 |
| UI | Material UI (MUI) 7, Emotion |
| Backend | Firebase (Auth, Firestore, Hosting, Cloud Functions, Cloud Messaging) |
| Animations | GSAP, Three.js / postprocessing |
| Charts | MUI X Charts |
| State/data | React Query, Context |
| Testing | Vitest, Testing Library |
| PWA | vite-plugin-pwa, Workbox |

## 📸 Highlights

- Dashboard with total balance, budget pulse, recent activity, and account breakdown.
- Accounts view with USD bank, EGP bank, EGP cash, and credit cards.
- Budget cycles with allocations and analytics.
- Fast Entry screen optimized for one-handed expense logging.
- Shared household model with per-user notification settings.

## 🚀 Quick start

> ⚠️ **Firebase Blaze plan required.** Kippa relies on Cloud Functions (cron reminders, FCM fanout, derived data) and scheduled functions, which are **only available on the Firebase Blaze (pay-as-you-go) plan**. The free Spark plan will *not* work — deploys of `functions/` will fail. Upgrade in Firebase Console → *Build → Functions → Upgrade project* (or Console → ⚙️ → Usage and billing). See [GETTING_STARTED.md §4](./GETTING_STARTED.md#4-enable-firebase-services) for details.

**New here?** Follow the complete, step-by-step guide: **[GETTING_STARTED.md](./GETTING_STARTED.md)** — it covers installing the Firebase CLI and `gcloud`, creating a project, getting config values, enabling services, and deploying. Written so a human *or* an AI agent can get the app running and hosted in minutes.

### TL;DR

```bash
git clone https://github.com/mustafabahaa/kippa.git
cd kippa
npm install
```

### Configure & deploy

Firebase configuration, hosting, and deployment are all covered end-to-end in **[GETTING_STARTED.md](./GETTING_STARTED.md)**.

Once configured, the everyday commands are:

```bash
npm run dev          # Vite dev server
npm run build        # type-check + production build
npm run test         # Vitest unit tests (app + functions)
npm run lint         # ESLint
npm run typecheck    # TypeScript, no emit
npm run deploy       # build + firebase deploy (hosting + firestore + functions)
```

## 📂 Project structure

```
.
├── app/                        # React + Vite PWA
│   ├── public/
│   │   ├── icons/              # PWA icons and logos
│   │   └── firebase-messaging-sw.example.js
│   └── src/
│       ├── components/         # App shell, shared UI
│       ├── config/             # Firebase init
│       ├── contexts/           # React context providers
│       ├── domain/             # Finance type definitions
│       ├── features/           # Feature modules (accounts, cards, dashboard, fast-entry, …)
│       ├── hooks/              # Reusable hooks
│       ├── libs/               # Finance logic (ledger, selectors, currency, …)
│       └── notifications/      # FCM registration and handling
├── functions/                  # Cloud Functions (cron reminders, FCM fanout, derived data)
├── docs/                       # Product spec, data model, design system, UX flows
├── GETTING_STARTED.md          # End-to-end setup guide (CLIs → deploy)
├── .firebaserc.example
├── firebase.json.example
└── LICENSE
```

## 📚 Documentation

- **[Getting Started (full setup guide)](./GETTING_STARTED.md)** — install CLIs, create a Firebase project, configure, deploy.
- Deep-dive docs live in [`docs/`](./docs):

- [Product spec](./docs/product-spec.md)
- [Data model](./docs/data-model.md)
- [Firebase architecture](./docs/firebase-architecture.md)
- [Dashboard calculations](./docs/dashboard-calculations.md)
- [UX flows](./docs/ux-flows.md)
- [Notifications](./docs/notifications.md)
- [Architecture & folder structure](./docs/architecture-and-folder-structure.md)
- [Design system](./docs/design-system.md)

## 🤝 Contributing

Contributions are welcome! Please:

1. Open an issue to discuss the change first (for anything beyond a small fix).
2. Fork and create a feature branch from `main`.
3. Keep commits focused; run `npm run lint && npm run test` before submitting.
4. Open a pull request describing the change and motivation.

## 📄 License

Copyright (c) 2026 **Mustafa BAHAA**. Licensed under the [PolyForm Noncommercial License 1.0.0](./LICENSE).

- ✅ **Allowed:** personal use, learning, non-commercial projects, modifications for your own non-commercial use.
- 💰 **Requires a license:** any commercial use, SaaS, resale, or integration into a paid product.

For commercial licensing, contact: **mustafa.bahaa123@gmail.com**.

## 💬 Acknowledgements

Built for a household that earns in USD and spends in EGP — where knowing *“can I safely spend right now?”* should take a glance, not a spreadsheet.
