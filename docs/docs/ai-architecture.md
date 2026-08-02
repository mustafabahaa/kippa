# Kip AI Architecture

Kip is Kippa's client-side financial companion, built on the current stable Vercel AI SDK. It connects directly to Google Gemini with the build-configured API key, so ordinary AI conversations and tool calls do not invoke Cloud Functions.

## Boundaries

- Financial calculations and application services remain the source of truth.
- Model output is untrusted input.
- The model never receives a generic Firestore read or write tool.
- Every tool has a strict schema, risk level, trusted household context, and a typed executor.
- Household and user identifiers come from authenticated application context, never model arguments.
- Read and memory tools may execute immediately. Write and sensitive tools create persisted proposals and execute only after the user presses the confirmation control.
- Confirmed actions reuse the same application services as the UI and invalidate the same client data cache after completion.

## Extension path

Add a new capability in this order:

1. Implement and test the deterministic domain service.
2. Define the smallest strict tool input schema; prefer names or intents over accepting arbitrary document IDs.
3. Resolve referenced entities inside the trusted household and validate relationships, currency, state, and permissions.
4. Register the tool with `read`, `write`, or `sensitive` risk.
5. For mutations, create a human-readable preview, persisted confirmation record, atomic mutation where the domain service supports it, and audit event.
6. Add tool-boundary tests for extra fields, nonexistent entities, cross-household identifiers, invalid state transitions, and duplicate execution.

## Conversations

Conversation metadata, completed messages, chart specifications, and pending action proposals are stored in Firestore. Streaming text remains local and the completed assistant message is written once. Messages load in bounded pages. Up to 100 recent messages are considered for each turn and then reduced to a fixed context budget. Loading older messages preserves the reader's scroll position, and streaming follows the bottom only when the user is already near it.

## Memory

Memory contracts distinguish facts, preferences, goals, decisions, corrections, patterns, and outcomes. Each memory carries user scope, confidence, source message IDs, timestamps, and supersession metadata. Kip stores only durable, explicitly user-provided context through a strict tool, deduplicates repeated memories, supersedes corrections, supports explicit forgetting, and retrieves a relevance-ranked bounded set for every turn. Financial facts already represented in Kippa and secrets are excluded from memory.

## Charts

Kip can request bar, line, or pie charts through a strict, data-only schema. The model cannot supply executable chart code or visual styling. MUI X Charts renders validated data with Kippa theme colors, and the chart specification is persisted with the assistant message.

## Provider and key handling

The provider is isolated behind the assistant service. The Gemini API key is configured through `VITE_GEMINI_API_KEY`; the real value belongs in the ignored local `.env`, while `.env.example` contains only an empty placeholder. Because Vite embeds this value in the browser bundle, it must be treated as a client credential and restricted to the intended web origins and Gemini API wherever Google permits.

Provider failures are classified separately for authentication, networking, rate limits, validation, and general provider errors. A failed user message remains in the conversation and can be retried. Financial mutations must never be automatically retried.
