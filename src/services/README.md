# Services

Use this folder for Firebase repositories, transaction writers, derived selectors, and notification services.

The important architectural boundary:

```text
raw ledger data -> calculation/selectors -> UI
```

Do not make dashboard components mutate or invent financial truth.

