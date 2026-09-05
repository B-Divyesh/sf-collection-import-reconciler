# Demo sandbox

## Entry point

Open <https://collection-import-reconciler.sociobot.in/demo>.
The query form `/?demo=1` enters the same mode.

## Bundled sample

The current catalog has three collection records.
The incoming file has five records from a realistic Homebox migration.
The completed report shows one added, one changed, one missing, two collisions, and one blank identifier.
It also shows one unmapped current field.

The sample source files are in `public/samples/` as CSV and JSON.
The formula-like `=2+2` value proves spreadsheet formula neutralization during export.

## Isolation and reset

Demo state uses the in-memory `demo:` application namespace.
It never reads or writes localStorage, IndexedDB, OPFS, or user files.
The persistent banner identifies demo mode on every demo screen.

“Reset demo” restores the original populated report.
“Start for real” discards demo state and opens the empty real workspace.
The `@claim:demo-isolation` browser test proves real local storage is unchanged.
