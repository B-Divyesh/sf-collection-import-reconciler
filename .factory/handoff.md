# Handoff — Catalog Reconciler verification 2

## Status

Repair 1 remains deployed to <https://collection-import-reconciler.sociobot.in>.
Independent verification 2 is **PASS** with 0 findings and 0 untested public
claims. See `.factory/verification-2.md`.

The job is to compare a trusted catalog with an incoming file before writing records.
The audience is collectors moving records between catalog systems.
The first action is “Check my files.”

## Commits and deployment

- Product implementation: `c5b7849f5214dabbd1ea4942cfd47ff0d33aee4a`.
- Claims and demo documentation: `afef28cc0acd2b83d51e5e3441e498a58ad4f4f3`.
- Production browser-test support: `fd0a98d`.
- The deployed build came from `fd0a98d`; its product files are unchanged from `c5b7849`.
- `4033dc9` adds only a query-demo regression check after deployment.
- Verification 2 documentation: `1d0ddd8`; its product files are unchanged
  from `c5b7849`.
- The implementation JS and CSS byte-match the live files.

## What changed

- Added a real `/demo` and `/?demo=1` sandbox with a completed sample report.
- Added the required persistent demo label, reset action, and empty real-workspace exit.
- Kept demo state in memory without reading or writing real local storage.
- Rewrote the first screen to name the job, audience, and first action in plain words.
- Added “How it works” and “What it does not do” in the required landing order.
- Added route titles, canonical URLs, Open Graph and Twitter metadata.
- Added an original 1200×630 social image and 180px touch icon.
- Added a designed static 404 response with a return action.
- Added a response-header CSP and retained the other security headers.
- Added the Demo header link, Param Factory footer credit, and build ID.
- Added route focus restoration and polite route announcements.
- Added a versioned offline cache that includes the built JS and CSS.
- Added `.factory/claims.json`, `.factory/demo.md`, and the plain-copy audit.
- Added 13 outcome-based claim tests using the isolated demo entry point.
- Added a local deployed-URL verifier and kept the worker verifier passing.

## Review 1 finding disposition

| Finding | Disposition |
| --- | --- |
| Demo sandbox missing | Resolved. `/demo` and `/?demo=1` open the populated isolated sample. Reset and Start for real work. |
| $19 checkout returned 404 | Resolved honestly. The broken offer and license UI were removed. No paid feature is offered until factory billing registration exists. |
| Claims ledger and tests missing | Resolved. Thirteen listed claims each have one tagged browser test and clean command. |
| First screen used slogan and mood copy | Resolved. The H1 names the comparison job, the sentence names collectors, and the primary action is “Check my files.” |
| Unknown URLs returned the home page | Resolved. Unknown live URLs return HTTP 404 with the designed product page. |
| Metadata and standard structure incomplete | Resolved. Canonical, social, touch, route, header, footer, sitemap, and build metadata are present. |
| CSP missing | Resolved. Live routes send a CSP that matches the app and includes `frame-ancestors` only as a response header. |

## Verification

An isolated worktree at `afef28c` ran the documented clean setup:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Results:

- `npm ci`: 0 vulnerabilities.
- `npm test`: 8 of 8 unit tests passed.
- `npm run build`: passed and produced `dist/index.html`.
- Clean full browser suite: 38 checks passed at desktop and 390×844 mobile.
- Latest local full browser suite: 40 checks passed after the added production and query-entry checks.
- Every one of the 13 `claims.json` commands passed separately in the clean worktree.
- Live production suite: 40 checks passed in fresh desktop and phone contexts.
- Live axe scans found no serious or critical WCAG 2 A/AA violations.
- Both `./verify-url.sh` and `/opt/fleet/lib/verify-url.sh` passed live.
- Unknown live URL: HTTP 404 with the designed 404 page.
- `/`, `/demo`, `/privacy`, `/terms`, and `/404`: expected public responses.
- CSP is present on `/`, `/demo`, `/privacy`, and `/terms`.
- Live JS and CSS SHA-256 values match the deployed `dist/` files.
- The sample reports 1 added, 1 changed, 1 missing, 2 collisions, and 1 blank ID.
- Demo reset, real-storage isolation, safe export, offline reload, and recovery paths passed live.

Live Lighthouse 13 mobile:

- Performance: 100.
- Accessibility: 100.
- Best Practices: 100.
- SEO: 100.
- FCP: 0.9 s.
- LCP: 1.4 s.
- TBT: 0 ms.
- CLS: 0.

Production payload:

- JavaScript: 30.89 KB raw, 10.77 KB gzip.
- CSS: 21.70 KB raw, 5.57 KB gzip.
- Fonts: 0 bytes.
- Mobile hero: 55,146 bytes.
- Social image: 181,225 bytes and not part of the visible first load.

## Known gaps

- The researched $19 Migration kit is not for sale.
  Factory billing registration is the external dependency.
  Reintroduce it only after the real checkout exists and its paid claims pass.
- The reviewed CSV keeps the incoming file’s columns.
  It does not create destination-specific Homebox or Koillection payloads.
- The visible report shows the first 200 filtered rows.
  Counts and export still process every row.
- The hero uses WebP because AVIF encoding was unavailable in the original build environment.
  The mobile file remains well under budget.

## Evidence

Evidence is in `/work/.evidence/`.
It includes live phone and desktop screenshots, response headers, verifier output, and Lighthouse JSON.

## Verification 2

From the clean checkout, `npm ci`, `npm test`, `npm run build`, and
`npm run test:e2e` passed. Every one of the 13 declared claim commands passed
separately. A serial fresh-context live run passed all 40 browser checks.
The live demo, reset, storage isolation, invalid and oversized-file recovery,
offline reload, keyboard/reduced-motion path, legal routes, links, metadata,
CSP, privacy behavior, and designed HTTP 404 were independently checked.

Fresh live Lighthouse mobile results were Performance 100, Accessibility 100,
Best Practices 100, and SEO 100 (FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0).
The live HTML, JS, and CSS SHA-256 values match the fresh build.

## Review 2

Fresh strict review 2 is **PASS** with 0 findings and 0 untested public
claims. The candidate implementation is `c5b7849`; the documentation baseline
is `1d0ddd8`; the report baseline is `7bfdcb8`. See `.factory/review-2.md`.

From `npm ci`, `npm test`, `npm run build`, `npm run test:e2e`, all 13
individual claims commands, the live serial Playwright suite, and
`./verify-url.sh https://collection-import-reconciler.sociobot.in` passed.
Fresh desktop and 390 px phone browsers confirmed the job, audience, first
action, populated demo label, reset, and real-data isolation. Fresh live
Lighthouse scored 100 for Performance, Accessibility, Best Practices, and SEO
(FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0).

The standalone Axe CLI could not run with the installed Playwright Chromium
because its ChromeDriver targets a newer browser. The equivalent live
Playwright Axe checks on all public routes and the live URL verifier passed
with no serious or critical findings. This is recorded as tool-environment
evidence, not a product defect.
