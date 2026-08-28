# Handoff — Catalog Reconciler v1

## Independent verification verdict — PASS

Candidate `c448dacc04726c724c2ff0377b7d0828342b8505` was independently verified on 2026-08-28 against <https://collection-import-reconciler.sociobot.in>. The live HTML, hashed JS/CSS, images, manifest, and service worker byte-match the fresh candidate build. Clean-install tests, production build, end-to-end workflow, 390 px mobile/keyboard/reduced-motion checks, axe, offline reload, outbound-request review, headers, budgets, and Lighthouse all passed. See [verification.md](verification.md) for exact commands, results, and severity-ranked defects (none found).

## What shipped

- A complete local CSV/JSON preflight: two-file loading by picker or drag/drop, identity selection, field mapping, three normalization modes, and an auditable difference report.
- Findings for added, changed, unchanged, missing, colliding, and blank-ID rows. Unmapped current fields and blank overwrites are called out separately.
- Safe CSV export that excludes collision/blank-ID rows, never emits deletion instructions, retains original incoming identifiers, and neutralizes spreadsheet-formula prefixes.
- A keyboard- and mobile-friendly risograph evidence-desk interface with empty, parse-error, offline, loading/license, and result states.
- Local service-worker shell caching, no analytics or catalog upload, no third-party runtime scripts/fonts.
- A $19 one-time Migration kit integration using the Sociobot checkout and verification contract. Core reconciliation/export remains free; paid features are local mapping recipes and print receipts. Product registration remains a factory release task.
- `/privacy` and `/terms` routes, README, MIT license, static-host routing/security headers, and original generated artwork with prompt/provenance in `.factory/design.md` and `assets/src/`.

## Verification

Run from a clean checkout:

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Verified 2026-08-28:

- `npm test`: 8/8 unit tests pass (CSV/JSON parsing, malformed input, formula injection, normalization, reconciliation, safe export).
- `npm run build`: passes; output is `dist/` with `dist/index.html` at the root.
- `npm run test:e2e`: 6/6 Chromium tests pass across desktop and a 390 × 844 mobile viewport. The test completes a reconciliation/download, asserts no console errors, checks keyboard access, and runs axe on home, privacy, and terms. No serious or critical violations.
- Lighthouse 11.7.1 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100. FCP 0.9 s, LCP 1.4 s, TBT 0 ms, CLS 0.
- Production payload: 32.91 KB JS / 11.78 KB gzip; 20.79 KB CSS / 5.41 KB gzip; mobile hero WebP 54 KB. All are inside the 200 KB JS, 50 KB CSS, 120 KB font (zero shipped), and 300 KB hero budgets.
- Manual visual review performed at desktop and 390 px. Generated hero contains no readable text, logo, watermark, person, or unintended brand.

## Known gaps and release steps

- The factory must register the paid product and confirm the production return URL before launch. The client intentionally uses the slug-based production endpoint and contains no product ID.
- Import schemas differ between catalog products. v1 emits a reviewed CSV in the incoming file’s columns; it does not create Homebox- or Koillection-specific API payloads.
- Very large files are capped at 25 MB to avoid browser memory pressure. Reports render the first 200 filtered rows while counts and export process the complete file.
- AVIF encoding was unavailable in the build image, so the reviewed production asset ships as responsive WebP only; the mobile derivative is 54 KB.

## Next useful work

- Add opt-in destination templates only after validating their current import schemas against real migration files.
- Pilot 20 migrations and measure whether at least 30% surface an identity collision or field-loss risk, matching the brief’s success metric.
