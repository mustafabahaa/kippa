---
id: intro
title: Kippa documentation
slug: /
sidebar_position: 1
description: Product, architecture, setup, and design documentation for Kippa.
---

# Build and understand Kippa

Kippa is a ledger-first household finance PWA designed for fast expense entry, salary-cycle budgeting, shared households, and multi-currency money decisions.

## Start here

- Follow [Getting started](./getting-started.md) to configure Firebase and run the project.
- Read the [Product spec](./product-spec.md) for the problem, goals, and product rules.
- Review the [Data model](./data-model.md) before changing Firestore documents.
- Use the [Architecture guide](./architecture-and-folder-structure.md) when adding frontend, backend, or shared-domain code.

## Repository layout

```text
kippa/
├── frontend/
│   ├── web/          # Product PWA
│   └── landing/      # Public marketing site
├── backend/
│   └── functions/    # Firebase Functions
├── docs/              # Full-system Docusaurus site
└── packages/
    ├── design-system/ # Shared visual foundations
    └── domain/        # Shared type contracts
```

The [landing page](https://mustafabahaa.github.io/kippa/) provides the public product overview. The [GitHub repository](https://github.com/mustafabahaa/kippa) contains the full source.
