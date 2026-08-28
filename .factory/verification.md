# Independent verification — PASS

**Candidate:** `c448dacc04726c724c2ff0377b7d0828342b8505`  
**Live URL:** <https://collection-import-reconciler.sociobot.in>  
**Verified:** 2026-08-28 (UTC)  
**Verdict:** **PASS** — the live deployment is the candidate build and the local-first import-preflight workflow meets the researched brief.

## Evidence

### Clean checkout and quality gates

An isolated detached worktree at the candidate commit was used. `npm ci` completed with 0 vulnerabilities, then:

| Check | Result |
| --- | --- |
| `npm test` | PASS — 8/8 Vitest tests |
| `npm run build` | PASS — `tsc --noEmit` and Vite production build; `dist/` produced |
| `npm run test:e2e` | PASS — 6/6 Chromium tests at desktop and 390 × 844 mobile |
| Built JS | 32,913 B / 11,765 B gzip (under 200 KB) |
| Built CSS | 20,792 B / 5,422 B gzip (under 50 KB) |
| Fonts | 0 B shipped (system stacks only) |
| Mobile hero | 55,146 B WebP (under 300 KB) |

Fresh mobile Lighthouse against production: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.3 s, TBT 130 ms, CLS 0, total transfer 73 KiB.

### Product workflow

Using actual file-picker input in the production build, I exercised:

- An invalid header-only CSV: it displayed the specific repair message, then accepted a valid replacement file.
- A JSON current catalog and CSV incoming catalog: numeric normalization matched `001` to `1`; the review reported 1 added, 1 changed, 1 missing, 2 collisions, and 1 blank identifier.
- A blank incoming mapped field: the review surfaced the blank-overwrite/field-loss warning.
- A reviewed CSV download: duplicate-ID and blank-ID rows were excluded; missing records were not exported; original `001` was retained; `+SUM(1,1)` exported as `'+SUM(1,1)` to neutralize spreadsheet formula execution.
- A 25 MiB + 1 B CSV: it was rejected before parsing with the documented size-limit recovery instruction.

No catalog-processing network request or non-GET request occurred. A normal browser load requested only the product origin and produced no console errors or page errors. The only implemented remote path is the explicit Sociobot checkout/license-verification flow; catalog rows are not included in it.

### UX, accessibility, and PWA

- Desktop and 390 px mobile were exercised. At 390 px, document `scrollWidth` equalled viewport width (390 px).
- Existing independent Playwright axe checks passed on home, privacy, and terms with no serious or critical WCAG 2 A/AA finding.
- Keyboard path reached the skip link and file inputs; the designed 3 px violet focus ring is present. Reduced-motion emulation reduced transitions to 0.01 ms.
- `<html lang>`, title, one `<h1>`, `<main>`, landmarks, image alt text, legal routes, and visible focus were confirmed.
- Service worker registered, took control after reload, and a subsequent offline reload rendered the application shell without errors. Its `catalog-reconciler-v1` cache was present.

### Deployment, privacy, and response policy

The following deployed files byte-match the fresh `dist/` output: `index.html`, hashed JS, hashed CSS, both WebP assets, `mark.svg`, manifest, robots.txt, sitemap, and `sw.js`. The URL is therefore serving this candidate. `/`, `/privacy`, and `/terms` returned 200 and legal routes rendered their client-side content.

Production responses provide HTTPS/HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and immutable one-year caching for hashed JS/CSS/WebP. No analytics, pixel, CDN font, or third-party runtime script was observed.

`staticwebapp.config.json` is correctly copied into `dist/` and its configured response headers are live; Azure does not expose that deployment-control file as a public URL (it returns Azure's expected 404 document), so that is not an artifact mismatch.

## Defects by severity

- **Critical:** none.
- **High:** none.
- **Medium:** none.
- **Low:** none.

## Notes

This is a static web application, not a library, CLI, or backend. Consumer-package, API concurrency/persistence, and backend health checks do not apply. The optional paid Migration kit was not purchase-tested because no test license/product registration was supplied; its free core reconciliation and export are not gated.
