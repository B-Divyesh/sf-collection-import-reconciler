# Catalog Reconciler

Catalog Reconciler compares a trusted catalog with a planned import before anything is written.
It is for collectors moving records between spreadsheets, Homebox, Koillection, or another system.

Live: <https://collection-import-reconciler.sociobot.in>

Demo: <https://collection-import-reconciler.sociobot.in/demo>

## What it checks

- Reads CSV and JSON catalog files.
- Reports added, changed, missing, duplicate, and blank identifiers.
- Reports current fields that have no incoming match.
- Compares exact, case-folded, or numeric identifiers.
- Exports reviewed CSV rows without collisions or blank identifiers.
- Never turns missing current records into deletion commands.
- Keeps catalog processing in the browser.
- Works offline after the first visit.
- Requires no account.

Every comparison and reviewed CSV export is free.
No paid feature is offered in this build.
The planned $19 Migration kit still needs factory billing registration.

## Demo sandbox

Open `/demo` or choose “Try it with sample data” on the first screen.
The sample shows one added, one changed, one missing, two duplicate, and one blank-ID row.
It also includes an unmapped field and a formula-like CSV value.

Demo state stays in memory under the isolated `demo:` application state.
It does not read or change local storage.
“Reset demo” restores the bundled sample.
“Start for real” opens an empty workspace.

See [.factory/demo.md](.factory/demo.md) for the verification contract.

## File and export rules

CSV files need unique, non-empty headers and at least one data row.
JSON may be an array of objects or an object containing an array.
Files larger than 25 MB are rejected before comparison.

Exported cells beginning with `=`, `+`, `-`, or `@` receive an apostrophe prefix.
This prevents spreadsheet formula execution while keeping the value readable.
Always test the reviewed export on a copy of the destination.

Reloading clears an active real comparison.
The service worker stores only public app files for offline reloads.
The app has no analytics, external font, external script, or catalog-processing backend.

## Run and verify

Requirements: Node.js 20 or newer and npm.

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run test:claims
```

`npm run build` writes the deployable site to `dist/`.
Browser commands build first, then start the production preview.
Playwright 1.58.2 is pinned for desktop and 390-pixel mobile checks.

Each public claim and its clean command are listed in [.factory/claims.json](.factory/claims.json).
Run a deployed URL check with `./verify-url.sh <url>`.

## Deploy

Deploy the contents of `dist/` as an Azure Static Web App.
Keep `staticwebapp.config.json` at the deployment root.
The factory owns deployment and product-domain configuration.

## Structure

- `src/catalog.ts` — CSV and JSON parsing plus formula-safe CSV encoding.
- `src/reconcile.ts` — identifier normalization and comparison rules.
- `src/main.ts` — routes, demo state, workflow, and legal pages.
- `tests/e2e/claims.spec.ts` — observable tests for every public claim.
- `.factory/design.md` — visual system and asset provenance.
- `.factory/handoff.md` — verification evidence and known gaps.

## License

MIT. See [LICENSE](LICENSE).
