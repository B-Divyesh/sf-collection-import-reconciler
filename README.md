# Catalog Reconciler

Catalog Reconciler is a local-first import preflight for collectors moving records between spreadsheets, Homebox, Koillection, or another catalog. It compares a trusted current catalog with an incoming CSV or JSON file, exposes identity and data-loss risks, and exports only reviewable incoming rows. It does not host a collection or write to another system.

Live: <https://collection-import-reconciler.sociobot.in>

## What it checks

- Added, changed, unchanged, and missing records
- Duplicate identifiers in either side of a match
- Blank identifiers that could cause a destination to generate new IDs
- Current fields that have no incoming mapping
- Blank incoming values that would replace existing data
- Exact, trimmed/case-folded, or numeric identifier normalization

The reviewed CSV excludes incoming rows with blank or colliding identifiers. Missing current records are reported but never translated into deletions. Identifier normalization is used only for comparison; original incoming values are retained in the export.

## Supported files

- CSV with a unique, non-empty header row and at least one data row. Quoted commas, quotes, and line breaks are supported.
- JSON as an array of objects, or an object containing an array of objects. Nested values are preserved as JSON strings.
- Files up to 25 MB. Processing happens in browser memory and no catalog row is uploaded.

### Spreadsheet formula safety

CSV cells beginning with `=`, `+`, `-`, or `@` (after optional whitespace) can be executed as formulas by spreadsheet software. On export, Catalog Reconciler prefixes those cells with an apostrophe. This neutralizes formula injection while keeping the visible value recognizable. Always inspect an export in a copy of the destination before importing it into the live catalog.

## Free and paid features

All reconciliation, safety checks, and reviewed CSV export are free. The optional **Migration kit** is a one-time $19 license that adds reusable mapping recipes stored in the current browser and printable audit receipts. Checkout and verification use the Sociobot billing API; Dodo is the merchant of record. No payment provider is embedded in this app.

## Develop and verify

Requirements: Node.js 20 or newer and npm.

```sh
npm install
npm run dev
npm test
npm run build
npm run test:e2e
```

The exact production build command is `npm run build`. Vite writes the static deployment to `dist/`, with `dist/index.html` at its root. `npm run test:e2e` starts a preview server and runs Chromium at desktop and 390 px mobile sizes; Playwright 1.58.2 is pinned.

The app has no runtime CDN, web font, analytics, marketplace credential, or backend dependency for catalog processing. A service worker caches the public shell after the first production visit for offline use. Static Web Apps routing and cache headers are in `public/staticwebapp.config.json`.

## Structure

- `src/catalog.ts` — CSV/JSON parsing and formula-safe CSV encoding
- `src/reconcile.ts` — identifier normalization and diff engine
- `src/license.ts` — one-time license capture, cache, and verification
- `src/main.ts` — accessible three-step interface and legal routes
- `.factory/design.md` — visual system, motion rules, and image provenance
- `.factory/handoff.md` — verification record and known gaps

## License

MIT. See [LICENSE](LICENSE).
