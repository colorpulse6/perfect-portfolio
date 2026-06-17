---
title: "El Form: React Hook Form Parity + a TypeScript Speed Win"
date: "2026-06-09"
type: "update"
link: "https://elform.dev"
cta: "Visit"
status: "released"
featured: false
project: "Library"
---

Pushed El Form closer to a drop-in React Hook Form alternative: a `useWatch` hook for reactive value subscriptions, a `useFieldArray` hook for dynamic arrays with stable keys, and the missing `formState` fields (`isSubmitted`, `isSubmitSuccessful`, `submitCount`, plus `isValidating` and a reactive `dirtyFields`), along with `mode: "onTouched"` and an opt-in `reValidateMode`.

At the same time I reworked the `Path<T>` types so they instantiate roughly 7.8× less at depth — El Form now type-checks *faster* than React Hook Form on realistic nested schemas, while keeping its selector-based, minimal-re-render core.
