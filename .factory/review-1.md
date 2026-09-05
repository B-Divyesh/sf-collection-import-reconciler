# Review: reconcile catalog imports safely

**Verdict: FAIL**

Reviewed on 2026-09-05 (UTC). The live implementation is
`c448dacc04726c724c2ff0377b7d0828342b8505`. The later documentation-only
commit is `2d02fb27a199c4c0fe62e4c6eeb452732ef86e7e`. A fresh build at the latter
commit has the same product files as the implementation commit, and its index,
JS, CSS, both WebP images, mark, manifest, robots, sitemap, and service worker
SHA-256 values exactly match the live files.

Job: compare a trusted catalog with an incoming import file before writing to a
new catalog. Audience: collectors moving a personal catalog between a
spreadsheet, Homebox, Koillection, or another system. Before scrolling, the
first action shown is **Check my files**; a secondary action says **Try a safe
example**.

## Findings

### High

1. **The required one-click demo sandbox is not implemented.** The live
   `/demo`, `/?demo=1`, and `/` addresses all load the normal app; `/demo`
   returns HTTP 200 with the ordinary landing page and title, rather than a
   demo route. Clicking “Try a safe example” loads realistic files and reaches
   a useful review (1 added, 1 changed, 1 missing, 2 collisions, 1 blank ID,
   2 safe rows), but it leaves the URL unchanged and shows no persistent
   “Demo — sample data, nothing is saved” label, **Reset demo**, or **Start for
   real** control. It has no separate `demo:` storage namespace. The required
   safe entry point cannot therefore be used by a catalog or verifier.

2. **The paid purchase path is broken.** The visible “Buy the Migration kit”
   link resolves to
   `https://api.sociobot.in/api/v1/products/collection-import-reconciler/checkout`,
   which returned HTTP 404 on 2026-09-05. The $19 one-time feature is publicly
   offered but cannot be bought.

### Medium

3. **The required claims ledger and claim tests are absent.**
   `.factory/claims.json` does not exist, so no public claim has the required
   `@claim:<id>` demo test or clean command. This leaves 10 material claims
   untested by the required contract: local/no-upload processing, CSV support,
   JSON support, offline use, collision/field-loss reporting, reviewed CSV
   export, formula neutralization, free core use, the paid recipe/receipt
   feature, and no-account use. The repository also has no `verify-url.sh` to
   run as required by the accessibility review instruction. Manual evidence is
   not a substitute for a listed repeatable claim test.

4. **The first screen does not say the job and audience in plain words.** Its
   only H1 is “Keep every item. Keep its identity.”, which is a slogan rather
   than the import-comparison job. It does not name collectors or their
   migration situation. “A preflight for precious catalogs”, “What the stamps
   mean”, and “Repeat the careful parts” are decorative/mood copy rather than
   section names. The sample action is not the required visible “Try it with
   sample data” action. `.factory/copy-audit.md` is also absent.

5. **Unknown URLs are not a designed 404 page.**
   `/definitely-not-a-page` returns HTTP 200 and renders the normal landing
   page. There is no `/404.html` or Static Web Apps 404 response override, so
   a mistyped address is silently treated as the home page instead of getting
   a clear recovery route.

6. **Required metadata and standard site structure are incomplete.** The
   document has no canonical link, Open Graph metadata, Twitter card, or
   180px Apple touch icon. The header has no Demo link. The footer says “A
   Sociobot utility” but lacks the required “Built by Param Factory” and a
   version/build ID. `sitemap.xml` does not list the required demo or 404
   routes.

7. **The deployed responses have no Content-Security-Policy.** Live `/`,
   `/privacy`, and `/terms` return `X-Content-Type-Options`,
   `Referrer-Policy`, and `Permissions-Policy`, but no CSP header. This misses
   the static-site security-header requirement.

### Critical and low

No critical or low findings.

## Checks that passed

From a clean dependency installation (`npm ci`, 0 vulnerabilities), every
declared README command passed:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 8 unit tests |
| `npm run build` | PASS — `dist/index.html` produced; JS 32.91 KB (11.78 KB gzip), CSS 20.79 KB (5.41 KB gzip) |
| `npm run test:e2e` | PASS — 6 Playwright tests at desktop and 390 px mobile |

Fresh Chromium contexts exercised the live page at 1440 × 960 and 390 × 844.
Both had no horizontal overflow or console/page errors. The normal sample
workflow completed and export was enabled. An invalid header-only CSV gave
the stated repair message, then a valid replacement loaded successfully. A
25 MiB plus one byte CSV was rejected before parsing with the stated recovery
instruction. The review test at 390 px was usable.

Live request logging during the sample workflow showed only the product
origin. Catalog rows were not sent off-origin. After the initial online visit,
the service worker controlled a reload and an offline reload rendered the app.
The app keeps ordinary comparison state in memory; this is why the sample did
not alter real data, but it does not satisfy the required labelled sandbox.

Playwright injected `axe-core` 4.10.3 into fresh live pages at `/`, `/privacy`,
`/terms`, and `/demo`; no serious or critical WCAG 2 A/AA violations were
found. Keyboard focus, visible focus styling, reduced-motion CSS, one H1,
`lang`, `main`, legal-route titles, and direct legal-route loads were also
confirmed. `npx @axe-core/cli@4.11.0` itself could not start because that CLI
searched for a system Chrome binary; Chromium supplied for the pinned
Playwright suite was used for the equivalent live axe scan.

## Earlier verification and handoff items

| Earlier item | Current disposition |
| --- | --- |
| 2026-08-28 verification reported zero defects and passing unit/build/e2e checks | Re-run clean commands pass. Core sample, validation recovery, mobile, accessibility smoke, and offline shell also pass as recorded. The stricter 2026-09-05 contract checks above nevertheless find 7 defects. |
| Paid product registration was listed as a release step / not purchase-tested | Not resolved; the live checkout endpoint now proves it is a High finding (finding 2). |
| Destination-specific templates were deferred | Still an explicit non-goal. The generic reviewed incoming CSV workflow remains within the brief. |
| 25 MB file cap | Confirmed: 25 MiB + 1 byte is rejected before parsing with recovery advice. |
| First 200 rows shown while counts/export include all rows | No regression identified in source or workflow; this is a disclosed display limit, not a deletion path. |
| WebP-only hero due unavailable AVIF encoding | Still WebP-only. The 768px image is 55,146 bytes, below the 300 KB mobile budget; this did not cause a user-path failure in this review. |

## Result

Finding count: **7**. Untested public-claim count: **10**. Because both are
non-zero, this review is **FAIL**. No product code was changed during the
review.
