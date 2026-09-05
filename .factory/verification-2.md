# Verification: Check catalog imports before writing them

**Verdict: PASS**

Verified 2026-09-05 (UTC).

- Candidate implementation: `c5b7849f5214dabbd1ea4942cfd47ff0d33aee4a`.
- Documentation commit: `1d0ddd86a8acdf8600367d1b6bac93e3c6ff621f`.
- Live URL: <https://collection-import-reconciler.sociobot.in>.
- Findings: **0**.
- Untested public claims: **0**.

## Job, audience, and first action

The job is to compare a trusted catalog with an incoming file before writing
records. The audience is collectors moving records between catalog systems.
In fresh desktop and 390 px phone browsers, before scrolling, the page states
this job in its one H1 and names the audience. The first primary action is
**Check my files**. The adjacent one-click action is **Try it with sample
data**. Both fresh sessions started at scroll position zero, had no console or
page errors, and the phone page had no horizontal overflow.

## Clean checkout checks

`npm ci` completed with 0 vulnerabilities. The declared quality commands
passed:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 8/8 unit tests |
| `npm run build` | PASS — produced `dist/index.html` |
| `npm run test:e2e` | PASS — 40/40 local browser checks |
| `PLAYWRIGHT_BASE_URL=https://collection-import-reconciler.sociobot.in npx playwright test --workers=1` | PASS — 40/40 live browser checks in fresh serial contexts |

The fresh build's initial JavaScript is 30.89 KB raw / 10.77 KB gzip and CSS
is 21.70 KB raw / 5.57 KB gzip. The live HTML, JavaScript, and CSS SHA-256
values exactly match the fresh `dist/` files.

A first parallel live Playwright run had one Chromium SIGSEGV while creating a
new browser context. Its trace contains a browser crash, not an application
assertion. The clean serial rerun above passed all 40 checks, including the
affected demo-isolation test, so this is environment evidence and not a
product finding.

## Demo and product path

Fresh live `/demo` loaded the title `Demo — Catalog Reconciler`, a persistent
**Demo — sample data, nothing is saved** label, **Reset demo**, and **Start for
real**. Its realistic completed report showed 1 added, 1 changed, 1 missing, 2
collisions, and 1 blank identifier, including a visible added `HB-004` row.
Reset restored the collision count to 2. A real-storage marker remained
unchanged during demo use; leaving demo removed the label, returned to the
empty real workspace, and retained that marker. The sample did not change real
data.

Normal, invalid, boundary, and recovery paths passed in the browser suite:

- CSV and JSON input, exact/case-folded/numeric identifier matching, field-loss
  reporting, reviewed export, and formula-prefix neutralization.
- Invalid CSV repair, a file larger than 25 MiB rejection followed by a valid
  replacement, and active-real-workspace clearing on reload.
- Offline reload after the first visit, keyboard navigation, visible focus,
  reduced motion, mobile layout, route titles/focus restoration, legal pages,
  and all product-internal links.

## Claims

All 13 entries in `.factory/claims.json` have exactly one matching
`@claim:<id>` test and no extra tagged claims. I ran every declared command
separately from the clean checkout. Each passed:

`csv-input`, `json-input`, `local-processing`, `identifier-normalization`,
`offline-reload`, `risk-report`, `reviewed-export`, `formula-neutralization`,
`free-core`, `no-account`, `demo-isolation`, `memory-reset`, and
`file-size-limit`.

This confirms the listed public promises, including local-only catalog
processing, no account, free core export, demo isolation, offline reload, and
the 25 MB file limit. The landing page, legal pages, and README were
cross-checked against the claims ledger; no unlisted public claim was found.

## Accessibility, privacy, security, and routes

Both `./verify-url.sh https://collection-import-reconciler.sociobot.in` and
the factory URL verifier passed. They confirmed a title, `lang="en"`, one H1,
one main landmark, image alt text, no unlabeled buttons, and no console errors.
The live Playwright axe scans found no serious or critical WCAG 2 A/AA issues
on home, demo, privacy, terms, and both 404 forms. The page includes a skip
link, keyboard paths, designed focus styling, and reduced-motion behavior.

`/`, `/demo`, `/privacy`, `/terms`, `/404`, and `/404.html` returned their
expected pages with route-specific titles. Product-internal links returned
200. An unknown live path returned deliberate HTTP 404 with the designed
`Page not found — Catalog Reconciler` recovery page; it is expected behavior,
not a defect.

Live responses include the configured CSP, HSTS, `X-Content-Type-Options`,
`Referrer-Policy`, and `Permissions-Policy`. The CSP permits only same-origin
runtime resources. Request logging during the claim flow found no catalog data
sent off-origin. No analytics, third-party fonts, or third-party scripts are
used.

The repeat mobile Lighthouse run completed without runtime error: Performance
100, Accessibility 100, Best Practices 100, and SEO 100; FCP 0.9 s, LCP 1.2
s, TBT 0 ms, and CLS 0.

This is a static local-first web product. Backend tenant isolation, restart
persistence, health endpoints, and 429/Retry-After checks do not apply.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| One-click demo sandbox missing | Resolved and independently exercised at `/demo` and `/?demo=1`. |
| Broken $19 checkout | Resolved honestly: the offer and license UI are absent; no paid claim remains. |
| Claims ledger and tests missing | Resolved: 13 listed claims, all separately passed. |
| First screen used slogan/mood copy | Resolved: job, audience, and first action are plain and visible before scrolling. |
| Unknown URLs returned home | Resolved: unknown live URL is designed HTTP 404. |
| Metadata and standard structure incomplete | Resolved: route titles, canonical/social metadata, touch icon, Demo link, footer credit/build ID, and sitemap checks passed. |
| CSP missing | Resolved: CSP is present on all checked live routes as a response header. |

## Evidence

`/work/.evidence/verification-2-live-desktop-first-screen.png`,
`/work/.evidence/verification-2-live-phone-first-screen.png`,
`/work/.evidence/verification-2-live-demo.png`,
`/work/.evidence/verification-2-url/verify.json`, and
`/work/.evidence/verification-2-lighthouse-retry.json` contain the recorded
browser, URL, and Lighthouse evidence.
