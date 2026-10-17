# Implementation status

Audit of the website against the master implementation prompt. Product claims come from the supplied desktop-project checklist and were not independently re-tested by the website.

Tests: `npm test` — 12/12 passing (Node test runner; HTTP, content, config and catalog-validation tests). Responsive layout was reviewed manually in a browser at 1440/1024/768/390/320 px (no horizontal overflow); no automated visual or end-to-end tests exist.

| Requirement | Status | Evidence | Next action |
|---|---|---|---|
| Required pages (home, product, technical info, pricing, downloads, about, support, privacy, terms, billing, cancellation) | Done | HTML files at repo root; route test | — |
| Navigation, footer, titles, descriptions | Done | `site.js` shared header/footer; route and nav tests | — |
| Open Graph metadata | Done | `og:*` tags on every page | Add `og:image` when a brand image exists |
| Canonical URLs, sitemap | Blocked | Production domain unknown; not invented | Owner supplies domain, then add `<link rel="canonical">` and `sitemap.xml` |
| Accurate product status | Done | Content tests for key phrases | Re-check against desktop README on each release |
| Planned pricing only, no purchase | Done | `site-config.js`; pricing test | Keep until billing exists |
| Waitlist / signup | Intentionally not built | Owner removed it; no backend exists | Build only with a real backend (see below) |
| Release catalog with validation | Done | `release-catalog.js`; 2 catalog tests | Add real entry after approval |
| Planned editions cannot be downloaded | Done | Catalog test | — |
| Unsafe download URLs rejected | Done | HTTPS-only, no credentials; test | — |
| Public config contains no secrets | Done | Config test | — |
| Subscriptions, accounts, entitlements, webhooks | Blocked | Needs a backend and provider account | Owner decisions below |
| Security headers | Partial | Set by `server.js` for local preview only | Configure the same headers at the real host |
| Legal pages | Draft | Marked as drafts | Owner and legal review |
| Support channel | Not configured | `supportEmail` empty; no promise made | Owner sets a monitored address |

## Owner decisions and blockers

1. **Production domain** — needed for canonical URLs, sitemap, and CSP/host config.
2. **Support contact** — set `supportEmail` in `site-config.js` only once monitored.
3. **Approved release** — a signed, notarized artifact, its HTTPS URL, version, SHA-256, size and date. Then change the `anubis` entry to `Available`; the validator enforces completeness.
4. **Payments** — choose a provider (e.g. Stripe), create the account, and decide the price-change consent process. Minimum backend: hosted checkout, signature-verified idempotent webhooks, server-side entitlement checks, and an authenticated account area. Secrets belong only in host environment variables, with an `.env.example` of placeholder names added when the backend exists.
5. **Waitlist** — only with a backend, server-side validation, spam protection, consent text, and a retention policy.
6. **Legal review** of privacy, terms, billing and cancellation pages.
