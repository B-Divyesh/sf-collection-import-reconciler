# Review: Check catalog imports before writing them

**Verdict: PASS**

Reviewed 2026-09-05 (UTC).

- Candidate implementation: `c5b7849f5214dabbd1ea4942cfd47ff0d33aee4a`.
- Documentation baseline: `1d0ddd86a8acdf8600367d1b6bac93e3c6ff621f`.
- Report baseline: `7bfdcb83ff11af213c01bc816dfe71b83a07429d`.
- Live URL: <https://collection-import-reconciler.sociobot.in>.
- Findings: **0**.
- Untested public claims: **0**.

## Job, audience, and first action

The job is to compare a trusted catalog with an incoming file before writing
records. The audience is collectors moving records between catalog systems.
Before scrolling in fresh 1440 px desktop and 390 px phone Chromium contexts,
the visible H1 states that job, the next sentence names collectors and changed
IDs or lost fields, and the first primary action is **Check my files**. The
adjacent action is **Try it with sample data**. Both contexts started at scroll
position zero, had no console or page errors, and had no horizontal overflow.

## Clean setup and declared claims

From the clean checkout, `npm ci` completed with 0 vulnerabilities. The
documented commands passed:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 8/8 unit tests |
| `npm run build` | PASS — produced `dist/index.html` |
| `npm run test:e2e` | PASS — 40 local browser checks |
| `PLAYWRIGHT_BASE_URL=https://collection-import-reconciler.sociobot.in npx playwright test --workers=1` | PASS — 40 live browser checks in serial fresh contexts |
| `./verify-url.sh https://collection-import-reconciler.sociobot.in` | PASS — title, language, main, alt text, labels, console, and serious Axe check |

Each of the 13 commands listed in `.factory/claims.json` was invoked
separately with the documented desktop project and completed successfully:
`csv-input`, `json-input`, `local-processing`, `identifier-normalization`,
`offline-reload`, `risk-report`, `reviewed-export`, `formula-neutralization`,
`free-core`, `no-account`, `demo-isolation`, `memory-reset`, and
`file-size-limit`.

The ledger has exactly one matching `@claim:<id>` browser test for each entry
and no extra tagged claim. The landing page, demo, legal pages, and README
were checked against the ledger. No public promise was unlisted.

The standalone `@axe-core/cli` could not use the supplied Playwright Chromium:
its ChromeDriver only supports Chrome 152 while the supplied browser is 145.
This is a test-tool browser-version mismatch, not a page failure. The product's
Playwright Axe integration ran against the installed Chromium on `/`, `/demo`,
`/privacy`, `/terms`, `/404`, and `/404.html` with no serious or critical
WCAG 2 A/AA violations, and the URL verifier's live Axe check also passed.

## Product paths and safeguards

Fresh live `/demo` displayed **Demo — sample data, nothing is saved** with
**Reset demo** and **Start for real**. It opened a realistic populated report:
1 added, 1 changed, 1 missing, 2 collisions, and 1 blank identifier. Reset
restored the sample. The storage-isolation claim seeded real local storage,
changed and reset the demo, then left demo mode; the real marker stayed intact
and the real workspace was empty.

The browser checks also passed the normal path and these recovery or boundary
paths: CSV and JSON input; exact, case-folded, and numeric identifier matching;
unmapped fields; reviewed CSV export; formula-prefix neutralization; invalid
CSV repair; rejection of a 25 MiB plus one byte file followed by a valid file;
real-workspace clearing on reload; offline reload after first visit; keyboard
and reduced-motion operation; 390 px layout; legal routes; internal links; and
route title and focus restoration.

All requests recorded during the populated demo, filtering, and export stayed
on the product origin. There are no analytics, third-party fonts, scripts, or
catalog-processing backend. Backend tenant, restart, health, and rate-limit
checks do not apply to this static local-first product.

## Live candidate and site checks

Fresh local build and live SHA-256 values match for `index.html`, the hashed
JavaScript file, and the hashed CSS file. The current source delta from
`c5b7849` contains documentation, claims metadata, Playwright configuration,
and tests only; it does not alter the shipped product implementation.

Live `/`, `/demo`, `/privacy`, `/terms`, `/404`, and `/404.html` returned the
expected pages. The normal HTML shell receives its route-specific title after
the client route renders. An unknown path returned the designed recovery page
with deliberate HTTP 404; this is expected behavior. The live response sends
the configured CSP plus HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and
`Permissions-Policy` headers.

Fresh mobile Lighthouse scored Performance 100, Accessibility 100, Best
Practices 100, and SEO 100. FCP was 0.9 s, LCP 1.2 s, TBT 0 ms, and CLS 0.
The fresh build is 30.89 KB JavaScript raw (10.77 KB gzip) and 21.70 KB CSS
raw (5.57 KB gzip).

## Earlier items

| Earlier item | Current disposition |
| --- | --- |
| Demo sandbox was missing | Resolved and exercised at `/demo` and `/?demo=1`, including label, reset, isolated storage, and real-mode exit. |
| Broken $19 checkout | Resolved honestly: no paid offer or license claim is present. |
| Claims ledger and outcome tests were missing | Resolved: 13 claims, one matching test each, all clean commands passed. |
| First screen used slogan or mood copy | Resolved: job, audience, and first action are visible before scrolling. |
| Unknown URLs rendered the home page | Resolved: unknown live URL is a designed HTTP 404 with a return action. |
| Metadata and standard structure were incomplete | Resolved: route titles, canonical and social metadata, touch icon, Demo navigation, footer, sitemap, and focus restoration are present. |
| CSP was missing | Resolved: the live CSP is a response header and matches the app resources. |
| Destination-specific templates were deferred | Still a stated non-goal; generic reviewed incoming CSV is within the brief. |
| Only the first 200 result rows are displayed | Still disclosed; complete counts and export are covered by the implementation and tests. |
| WebP-only hero | Still within budget at 55,146 bytes for the mobile asset; no user-path defect. |

## Evidence

Fresh captures and Lighthouse JSON are in `/work/.evidence/`:
`review-2-live-desktop.png`, `review-2-live-phone.png`,
`review-2-live-demo.png`, and `review-2-lighthouse.json`.

This review has **0 findings** and **0 untested public claims**. The verdict is
**PASS**.
