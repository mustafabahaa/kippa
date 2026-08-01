# @kippa/domain

Canonical Firestore and cross-runtime domain contracts shared by the React app
and Firebase Functions.

This package is deliberately type-only. Keeping it free of runtime exports means
the compiled Functions deployment remains self-contained even though Firebase
deploys `backend/functions/` independently from the rest of the monorepo.

Rules:

- Put types shared by the app and Functions here.
- Do not import Firebase, React, browser, or Node APIs here.
- Keep runtime business rules in the consuming workspace's `src/domain/` until
  the Functions deployment is changed to bundle workspace runtime packages.
