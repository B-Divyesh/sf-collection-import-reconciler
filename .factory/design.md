# Catalog Reconciler — visual thesis

## Direction

**Risograph evidence desk.** A catalog migration is less like importing a file and more like comparing two paper ledgers before signing off. The interface borrows the imperfect registration, overprinted spot inks, crop marks, ruled worksheets, and clipped paper scraps of a small risograph studio. Decoration always explains the job: doubled silhouettes mean comparison, registration marks mean alignment, and stamped status blocks mean a decision has been made.

This is deliberately a warm, single-mode light treatment. The paper substrate is essential to the evidence-desk metaphor; a dark theme would turn the spot inks luminous and break the printed-material logic. The page explicitly paints every surface.

## Palette

All colors are encoded as CSS tokens.

- `paper #F3EBD7`: warm recycled stock background.
- `sheet #FFF9EA`: working sheet / primary surface.
- `ink #1D2824`: near-black green for copy (12.8:1 on paper).
- `muted #58635D`: secondary copy (5.2:1 on paper).
- `violet #583B86`: primary spot ink and focus (7.2:1 on sheet).
- `orange #C44820`: action/stamp accent (4.9:1 on sheet).
- `mint #BBD7C5`: calm verified fill; paired with text/icons.
- `yellow #F3C84B`: review fill; always paired with labels.
- `danger #9E2F2D`: collision/error ink (7.0:1 on sheet).
- `rule #B7AD98`: rules and quiet boundaries (non-text only).

The two ink colors overlap in the hero and status marks. State never depends on color alone: every state has a word, count, and symbol.

## Typography

- Display: `Arial Black`, `Arial Narrow Bold`, system sans-serif. Compressed, blunt headlines resemble block type without downloading a font.
- Interface/body: `ui-monospace`, `SFMono-Regular`, `Cascadia Mono`, `Roboto Mono`, monospace. Columnar numerals make identifiers and counts easy to scan.
- Scale: 14 / 16 / 20 / 28 / clamp(42–76) px; body never below 16 px. Tables use tabular figures. Reading measure tops out at 68 characters.

Using system fonts means zero font payload and no third-party request.

## Spacing and layout

An 8 px base rhythm with 4 px for tight label relationships. The desktop workbench uses a 12-column grid; the active worksheet is slightly rotated only in the decorative hero, never around form controls. Controls are at least 44 px high. At 390 px, metadata and decorative crop marks drop away, steps become a compact horizontal strip, and comparison tables become vertically scrollable ledgers.

## Interaction grammar

- Files land on dashed, offset-shadow paper trays.
- The workflow advances left-to-right through numbered registration circles: Files → Map → Review.
- Selected filters look like physical stamp impressions.
- Changes reveal the old value struck through beside the new value.
- Export is the only orange filled action; secondary work stays ink-on-paper.
- Errors are written as repair instructions, not generic alerts.

## Motion policy

Transitions run 160–240 ms and affect only opacity and transform: a loaded sheet settles 6 px into its tray; changing steps slides the worksheet 12 px from its origin; stamps scale from 0.97 to 1. No ambient or looping motion. Under `prefers-reduced-motion: reduce`, movement is removed and state changes are immediate opacity swaps. Print styles remove all texture, controls, and decorative art.

## Asset plan and provenance

The hero illustration is a generated, editorial still life of two overlapping inventory ledgers, paper tags, crop marks, and a magnifying loupe rendered as a two-color risograph collage. It explains comparison and identity alignment without pretending to show the product UI. A small hand-authored SVG registration mark is used as the product emblem.

Prompt sheet:

- Subject: two overlapping paper collection ledgers, numbered specimen tags, a transparent magnifying loupe aligning duplicate catalog marks.
- World/materials: recycled cream paper, deckled edges, rubber-stamp blocks, halftone dots, visible ink misregistration.
- Composition: wide horizontal editorial still life, objects weighted to the right, quiet paper space on the left, no UI mockup.
- Light/lens: flat overhead printmaker's-table light, tactile macro detail, no photographic depth of field.
- Palette words: warm oat paper, deep aubergine-violet ink, burnt vermilion-orange ink, restrained sage overprint.
- Negative list: no readable text, no letters, no logos, no brands, no watermark, no people, no hands, no glossy 3D, no gradients, no blue tech aesthetic.

Generated with the factory Azure image deployment (`factory-image`) on 2026-08-28. Original prompt is stored beside the source file in `assets/src/hero-ledgers.json`. The generated asset is original to this product; production WebP/AVIF derivatives are local and contain no third-party material.

The 1200×630 social preview was cropped from that original artwork on 2026-09-05.
The 180px touch icon was rasterized from the hand-authored product mark on the same date.
Both derivatives were produced locally with ImageMagick and add no third-party material.
