# whyguard-demo

A small checkout service, used to show what [WhyGuard](https://github.com/rosselps/whyguard)
does on a real repository.

Two behaviors here exist because something broke in production, and both look removable to
anyone reading the code today:

- `createOrder` returns the existing order for a repeated idempotency key ([#1](../../issues/1))
- `capturePayment` waits 2000ms between attempts ([#2](../../issues/2))

Neither is obvious from the code. The first looks like a redundant lookup, the second like
an arbitrary sleep. Both are recorded in `.whyguard/decisions/` so the tool can say why
they are there, and block their removal instead of warning about it.

## Try it

```bash
npx whyguard trace createOrder
npx whyguard scan --base main --head HEAD
```

`whyguard init` has already been run here, so the Git `pre-commit` hook is installed and
the GitHub App publishes a Check Run on every pull request.

## Tests

```bash
npm install
npm test
```
