# Anubis AI website

A dependency-free static website for Anubis AI, a local-first desktop assistant under development. It uses plain HTML, CSS, and browser JavaScript so the public-facing pages can be hosted on a static web host without an account, database, payment provider, or build service.

Product descriptions are based on the supplied desktop-project checklist. That checklist reports a locally tested, unsigned Intel macOS app and disk image, two registered agents (Anubis and Thoth), and tested bounded workflows. The website distinguishes this local development status from an approved public release; it does not distribute an installer or represent all claims as independently re-tested in this website repository.

## Local development

- Requires Node.js 18 or newer.
- Run `npm start` and open <http://localhost:4173>.
- Run `npm test` for the built-in route, metadata, and release-catalog checks.
- There is no compilation step; the files served from the project root are the site.

The included Node server is a local preview server for this static site. It does not implement a production API, authentication, billing, or download hosting.

## Configuration and release workflow

`site-config.js` is the public configuration source for intended prices, support contact, and the release catalog. Values in this file are visible to every visitor; never place private credentials or secrets here.

Prices are planning targets only and are not active offers. Do not configure payment links as a substitute for a complete checkout, verified webhooks, customer management, cancellation, refunds, and server-enforced access.

The current catalog contains no public installer artifact. The desktop checklist reports an unsigned and unnotarized Intel macOS development package, not an approved public release. A release should be made available only through a reviewed change to the catalog after an approved artifact has been built, signed as appropriate, and verified. Add its exact version, supported operating systems, requirements, notes, download URL, and a verified checksum where available. Keep other editions marked planned until real, approved artifacts exist. Pantheon/edition selection belongs on this website; do not add an in-app edition-switching setting.

The simplest interim administrative process is a reviewed configuration change and controlled deployment. There is no admin dashboard or public release-management endpoint.

### Approving a release

1. Build, sign and notarize the artifact; record its SHA-256 (`shasum -a 256 <file>`).
2. Host it at an HTTPS URL you control.
3. In a pull request, edit the entry in `site-config.js`: set `availability: "Available"`, `version`, `operatingSystems`, `requirements`, `releaseNotes`, `downloadUrl`, `checksum`, and optionally `releaseDate` (`YYYY-MM-DD`) and `fileSize` (bytes).
4. `release-catalog.js` validates every entry (HTTPS only, no embedded credentials, 64-hex checksum, complete fields). Invalid entries are never shown as downloads, and `npm test` checks the shipped catalog.
5. Run `npm test`, review, merge and deploy.

## Deployment

The site is static: upload the repository files (excluding `server.js`, `test/` and `node_modules/`) to any static host such as GitHub Pages, Netlify or Cloudflare Pages. `server.js` is for local preview only, so configure its security headers at the host: a Content-Security-Policy restricting scripts, styles and images to `'self'`, plus `X-Content-Type-Options: nosniff`, `Referrer-Policy` and `X-Frame-Options: DENY`. Before launch, set the production domain (canonical URLs and sitemap), a monitored support email, and complete legal review. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for open items.

## Contact and signup

There are no registration or feedback forms. No support email or ticketing system is configured, so the site does not imply that messages can be delivered or stored.

## Payments, legal, and deployment readiness

There is no authentication, payment integration, account system, entitlement service, production installer, email delivery, analytics, or hosting configuration in this project. The legal and policy pages are drafts/placeholders requiring owner and qualified legal review before publication. Confirm the actual product data practices and supported environments before making product claims.

Before production deployment, configure the real domain and canonical URLs, HTTPS, hosting-level security headers, monitoring, backups as appropriate, and an accurate sitemap. A domain was not provided, so no canonical host or absolute sitemap URL has been invented. Review accessibility and responsive layouts on actual target devices.

## Pages

Home, Product, Technical Information, Pricing, Downloads, About, Support, Privacy, Terms, Subscription & Billing, and Cancellation & Refunds. The home page is a concise overview; its links and the navigation lead to separate pages with their complete relevant details.

The header navigation is grouped: Product (Product, Technical info, Pricing, Downloads) and Company (About, Support). Policy pages are linked from the footer.

## Repository

https://github.com/TheRealPharaohFresh/AnubisAI-Website — `main` branch. Being a static site, it can be hosted on any static host (e.g. GitHub Pages) once the legal pages are reviewed.
