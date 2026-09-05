import './styles.css';
import { CatalogParseError, parseCatalog, toCsv, type Catalog } from './catalog';
import { reconcile, type FieldMap, type Normalization, type ReconcileOptions, type ReconcileResult, type RowStatus } from './reconcile';

type Step = 'files' | 'map' | 'review';
type AppRoute = 'home' | 'demo' | 'privacy' | 'terms' | 'not-found';

const app = document.querySelector<HTMLDivElement>('#app') as HTMLDivElement;
if (!app) throw new Error('Application root not found');

const state: {
  step: Step;
  current?: Catalog;
  incoming?: Catalog;
  options?: ReconcileOptions;
  result?: ReconcileResult;
  filter: RowStatus | 'all';
  demo: boolean;
} = { step: 'files', filter: 'all', demo: false };

const BUILD_ID = 'v1.1.0 · repair 1';
const BASE_URL = 'https://collection-import-reconciler.sociobot.in';

const icon = (name: 'mark' | 'arrow' | 'lock' | 'check' | 'warning' | 'file') => {
  const paths = {
    mark: '<circle cx="10" cy="12" r="6"/><circle cx="14" cy="12" r="6"/><path d="M12 2v20M2 12h20"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    warning: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
    file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6m-6 4h6"/>',
  }[name];
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${paths}</svg>`;
};

function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] ?? character);
}

function header(): string {
  return `<div class="offline-banner" id="offline-banner" role="status" hidden>You’re offline. File comparison still works.</div>
    ${state.demo ? '<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><div><button id="reset-demo" type="button">Reset demo</button><a href="/" data-route>Start for real</a></div></aside>' : ''}
    <header class="site-header">
      <a class="brand" href="/" data-route aria-label="Catalog Reconciler home"><img src="/mark.svg" width="40" height="40" alt=""><span>Catalog<br>Reconciler</span></a>
      <nav aria-label="Primary"><a href="/#workspace">Check files</a><a href="/demo" data-route>Demo</a><a href="/privacy" data-route>Privacy</a></nav>
    </header>`;
}

function demoMarkup(): string {
  return `${header()}<main id="main">
    <section class="demo-intro" aria-labelledby="demo-title"><p class="eyebrow">Sample catalog comparison</p><h1 id="demo-title" tabindex="-1">Review a sample catalog import</h1><p>This Homebox example includes changed IDs, duplicate IDs, a blank ID, a missing item, and an unmapped field.</p></section>
    <section class="workspace demo-workspace" id="workspace" aria-labelledby="workspace-title"><div class="section-heading"><p class="eyebrow">Populated sample</p><h2 id="workspace-title">Check the sample findings</h2><p>Open a changed row, filter the report, or export the reviewed sample CSV.</p></div><div class="workbench"><ol class="steps" aria-label="Reconciliation progress">${stepItem('files', '1', 'Files')}${stepItem('map', '2', 'Map')}${stepItem('review', '3', 'Review')}</ol><div id="tool-body" class="tool-body"></div></div></section>
    <section class="limits" aria-labelledby="demo-data-title"><div class="limits-mark" aria-hidden="true">DEMO<br>ONLY</div><div><p class="eyebrow">Sample data</p><h2 id="demo-data-title">No real catalog is opened</h2><p>The sample stays in browser memory and does not change local storage.</p><p>Choose “Start for real” to compare your own files in an empty workspace.</p></div></section>
  </main>${footer()}<div id="toast" class="toast" role="status" aria-live="polite"></div>`;
}

function footer(): string {
  return `<footer><div><strong>Catalog Reconciler</strong><p>Compare catalog files before importing them.</p><p>${BUILD_ID}</p></div><nav aria-label="Legal"><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a><a href="https://sociobot.in" rel="noreferrer">Built by Param Factory</a></nav><p class="generated-note">The original hero artwork was generated for this product and reviewed by Param Factory.</p></footer>`;
}

function renderLegal(kind: 'privacy' | 'terms'): void {
  const privacy = kind === 'privacy';
  app.innerHTML = `${header()}<main id="main" class="legal-page"><a class="back-link" href="/" data-route>← Back to the reconciler</a><p class="eyebrow">${privacy ? 'Privacy' : 'Terms'}</p><h1 tabindex="-1">${privacy ? 'See what data stays in your browser' : 'Check the terms before using an export'}</h1>
    ${privacy ? `<section><h2>Catalog files</h2><p>CSV and JSON files are read in browser memory. Rows, identifiers, and field values are not uploaded.</p><p>Reloading or closing the page clears the active comparison.</p><h2>Demo data</h2><p>The demo uses bundled sample rows in memory. It does not read or change your files or local storage.</p><h2>Offline files</h2><p>The service worker stores public app files after your first visit. This lets the comparison screen reload without a network connection.</p><h2>Tracking</h2><p>This app includes no analytics, advertising, tracking pixels, external fonts, or external scripts.</p><h2>Your choices</h2><p>Clear this site’s stored app files in your browser settings at any time.</p><p>Send privacy questions to <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>` : `<section><h2>Purpose</h2><p>Catalog Reconciler compares files and produces a reviewed CSV export.</p><p>It does not write to Homebox, Koillection, spreadsheets, or another catalog service.</p><p>Back up the destination and check its import rules before writing data.</p><h2>No automatic deletion</h2><p>Missing records appear in the report but never become deletion commands.</p><p>Rows with collisions or blank identifiers are excluded from the reviewed export.</p><h2>Availability and warranty</h2><p>The tool is provided “as is,” without warranty.</p><p>File formats vary, so inspect the export and test it on a copy first.</p><h2>Acceptable use</h2><p>Use the tool only with data you are allowed to process.</p><p>Do not attempt to disrupt the service.</p>`}
    <p class="legal-date">Effective 28 August 2026</p></section></main>${footer()}`;
  bindGlobal();
}

function homeMarkup(): string {
  return `${header()}<main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy"><p class="eyebrow">Catalog import check</p><h1 id="hero-title" tabindex="-1">Check catalog imports before you write them</h1><p class="lede">For collectors moving records between systems who need to catch changed IDs and lost fields before import.</p><div class="hero-actions"><a class="button primary" href="#workspace">Check my files ${icon('arrow')}</a><a class="button text-button" href="/demo" data-route>Try it with sample data</a></div><p class="next-step">Choose the catalog you trust and the file you plan to import.</p><ul class="plain-facts"><li>Files stay in this browser.</li><li>Reads CSV and JSON.</li><li>Works offline after the first visit.</li></ul></div>
      <figure class="hero-art"><picture><source media="(max-width: 720px)" srcset="/assets/hero-ledgers-768.webp"><img src="/assets/hero-ledgers-1400.webp" width="1400" height="933" fetchpriority="high" alt="Two printed catalog ledgers aligned under a clear loupe"></picture><figcaption>The same item can have different identifiers in two catalog files.</figcaption></figure>
    </section>
    <section class="trust-strip" aria-label="Comparison stages"><span>01 / Choose files</span><span>02 / Match fields</span><span>03 / Review rows</span></section>
    <section class="workspace" id="workspace" aria-labelledby="workspace-title"><div class="section-heading"><p class="eyebrow">Compare files</p><h2 id="workspace-title">Check my files</h2><p>Start with the catalog you trust. Then add the file you plan to import.</p></div><div class="workbench"><ol class="steps" aria-label="Reconciliation progress">${stepItem('files', '1', 'Files')}${stepItem('map', '2', 'Map')}${stepItem('review', '3', 'Review')}</ol><div id="tool-body" class="tool-body"></div></div></section>
    <section class="how-it-works" aria-labelledby="how-title"><div><p class="eyebrow">How it works</p><h2 id="how-title">Review an import in three steps</h2></div><ol><li><strong>Choose both files</strong><span>Add the catalog you trust and the incoming CSV or JSON file.</span></li><li><strong>Match identifiers</strong><span>Choose the fields that identify the same item in both files.</span></li><li><strong>Review and export</strong><span>Check collisions, changed fields, missing items, and rows blocked from export.</span></li></ol></section>
    <section class="limits" aria-labelledby="limits-title"><div class="limits-mark" aria-hidden="true">NO<br>WRITE</div><div><p class="eyebrow">What it does not do</p><h2 id="limits-title">Your catalog is not changed</h2><p>The app does not connect to or write into another catalog system.</p><p>It never turns missing items into deletion commands.</p><p>You can compare files and export reviewed rows without an account.</p></div></section>
  </main>${footer()}<div id="toast" class="toast" role="status" aria-live="polite"></div>`;
}

function stepItem(step: Step, number: string, label: string): string {
  const order: Step[] = ['files', 'map', 'review'];
  const currentIndex = order.indexOf(state.step);
  const itemIndex = order.indexOf(step);
  const status = itemIndex < currentIndex ? 'done' : itemIndex === currentIndex ? 'current' : '';
  return `<li class="${status}" ${itemIndex === currentIndex ? 'aria-current="step"' : ''}><span>${status === 'done' ? '✓' : number}</span>${label}</li>`;
}

function guessId(catalog: Catalog): string {
  const wanted = ['import_ref', 'id', 'asset_id', 'identifier', 'uuid', 'sku', 'serial'];
  return catalog.fields.find((field) => wanted.includes(field.toLowerCase())) ?? catalog.fields[0] ?? '';
}

function suggestMaps(current: Catalog, incoming: Catalog): FieldMap[] {
  return incoming.fields.map((source) => {
    const target = current.fields.find((field) => field.toLowerCase() === source.toLowerCase()) ?? '';
    return { source, target, include: Boolean(target) };
  });
}

function renderFiles(): void {
  const body = document.querySelector<HTMLDivElement>('#tool-body');
  if (!body) return;
  body.innerHTML = `<div class="tool-intro"><div><p class="step-label">Step 1 of 3</p><h3>Choose both catalog files</h3></div><p>We read the first row as field names. JSON may be an array or an object containing an array.</p></div><div class="drop-grid">${fileSlot('current', 'Current catalog', 'The source of truth before migration', state.current)}${fileSlot('incoming', 'Incoming file', 'The file you plan to import', state.incoming)}</div><div id="file-error" class="message error" role="alert" hidden></div><div class="tool-actions"><span class="privacy-chip">${icon('lock')} Files stay in memory</span><button class="button primary" id="continue-map" type="button" ${state.current && state.incoming ? '' : 'disabled'}>Map identifiers ${icon('arrow')}</button></div>`;
  bindFileSlot('current');
  bindFileSlot('incoming');
  document.querySelector('#continue-map')?.addEventListener('click', () => {
    if (!state.current || !state.incoming) return;
    state.options = { currentId: guessId(state.current), incomingId: guessId(state.incoming), normalization: 'trim-case', fields: suggestMaps(state.current, state.incoming) };
    state.step = 'map';
    renderWorkspace();
  });
}

function fileSlot(kind: 'current' | 'incoming', title: string, subtitle: string, catalog?: Catalog): string {
  return `<div class="file-slot ${catalog ? 'loaded' : ''}" data-slot="${kind}"><input class="visually-hidden" type="file" id="${kind}-file" accept=".csv,.json,text/csv,application/json"><label for="${kind}-file">${icon(catalog ? 'check' : 'file')}<strong>${catalog ? escapeHtml(catalog.name) : title}</strong><span>${catalog ? `${catalog.rows.length.toLocaleString()} rows · ${catalog.fields.length} fields · ${catalog.format}` : subtitle}</span><span class="choose">${catalog ? 'Replace file' : 'Choose or drop CSV / JSON'}</span></label></div>`;
}

function bindFileSlot(kind: 'current' | 'incoming'): void {
  const input = document.querySelector<HTMLInputElement>(`#${kind}-file`);
  const slot = document.querySelector<HTMLElement>(`[data-slot="${kind}"]`);
  if (!input || !slot) return;
  const load = async (file?: File) => {
    if (!file) return;
    const error = document.querySelector<HTMLElement>('#file-error');
    slot.classList.add('reading');
    slot.setAttribute('aria-busy', 'true');
    const choose = slot.querySelector<HTMLElement>('.choose');
    const previousChoose = choose?.textContent ?? 'Choose or drop CSV / JSON';
    if (choose) choose.textContent = 'Reading locally…';
    announce(`Reading ${file.name} locally.`);
    try {
      if (file.size > 25 * 1024 * 1024) throw new CatalogParseError('That file is over 25 MB. Split it into smaller catalogs and compare each part.');
      const catalog = parseCatalog(file.name, await file.text());
      state[kind] = catalog;
      renderFiles();
      announce(`${kind === 'current' ? 'Current catalog' : 'Incoming file'} loaded: ${catalog.rows.length} rows.`);
    } catch (reason) {
      slot.classList.remove('reading');
      slot.removeAttribute('aria-busy');
      if (choose) choose.textContent = previousChoose;
      if (error) {
        error.hidden = false;
        error.textContent = reason instanceof Error ? reason.message : 'The file could not be read. Try a CSV or JSON file.';
      }
    }
  };
  input.addEventListener('change', () => void load(input.files?.[0]));
  for (const eventName of ['dragenter', 'dragover']) slot.addEventListener(eventName, (event) => { event.preventDefault(); slot.classList.add('dragging'); });
  for (const eventName of ['dragleave', 'drop']) slot.addEventListener(eventName, (event) => { event.preventDefault(); slot.classList.remove('dragging'); });
  slot.addEventListener('drop', (event) => void load(event.dataTransfer?.files[0]));
}

function optionsFor(fields: string[], selected: string): string {
  return `<option value="">Do not compare</option>${fields.map((field) => `<option value="${escapeHtml(field)}" ${field === selected ? 'selected' : ''}>${escapeHtml(field)}</option>`).join('')}`;
}

function renderMap(): void {
  if (!state.current || !state.incoming || !state.options) return;
  const body = document.querySelector<HTMLDivElement>('#tool-body');
  if (!body) return;
  body.innerHTML = `<div class="tool-intro"><div><p class="step-label">Step 2 of 3</p><h3>Align identity and fields</h3></div><p>Choose the columns that identify the same physical item. Normalization only affects matching; exported values stay unchanged.</p></div>
    <fieldset class="identity-grid"><legend>Identity match</legend><label>Current identifier<select id="current-id">${state.current.fields.map((field) => `<option ${field === state.options?.currentId ? 'selected' : ''}>${escapeHtml(field)}</option>`).join('')}</select><span>${escapeHtml(state.current.name)}</span></label><div class="match-symbol" aria-hidden="true">⇄</div><label>Incoming identifier<select id="incoming-id">${state.incoming.fields.map((field) => `<option ${field === state.options?.incomingId ? 'selected' : ''}>${escapeHtml(field)}</option>`).join('')}</select><span>${escapeHtml(state.incoming.name)}</span></label></fieldset>
    <fieldset class="normalization"><legend>Normalize identifiers before matching</legend><label><input type="radio" name="normalization" value="exact" ${state.options.normalization === 'exact' ? 'checked' : ''}><span><strong>Exact</strong> Case and spacing matter</span></label><label><input type="radio" name="normalization" value="trim-case" ${state.options.normalization === 'trim-case' ? 'checked' : ''}><span><strong>Trim + case-fold</strong> Recommended for text IDs</span></label><label><input type="radio" name="normalization" value="numeric" ${state.options.normalization === 'numeric' ? 'checked' : ''}><span><strong>Numeric</strong> Also treats 0012 and 12 as equal</span></label></fieldset>
    <div class="mapping-heading"><div><h4>Field map</h4><p>Only checked pairs are compared for changes.</p></div><span>${state.options.fields.filter((field) => field.include).length} mapped</span></div><div class="mapping-table" role="table" aria-label="Field mapping"><div role="row" class="mapping-header"><span role="columnheader">Use</span><span role="columnheader">Incoming field</span><span role="columnheader">Current field</span></div>${state.options.fields.map((mapping, index) => `<div role="row" class="mapping-row"><span role="cell"><input aria-label="Compare ${escapeHtml(mapping.source)}" type="checkbox" data-map-check="${index}" ${mapping.include ? 'checked' : ''}></span><span role="cell"><code>${escapeHtml(mapping.source)}</code></span><span role="cell"><label class="visually-hidden" for="map-${index}">Current field for ${escapeHtml(mapping.source)}</label><select id="map-${index}" data-map-select="${index}">${optionsFor(state.current!.fields, mapping.target)}</select></span></div>`).join('')}</div>
    <div id="map-error" class="message error" role="alert" hidden></div><div class="tool-actions"><button class="button secondary" id="back-files" type="button">← Back to files</button><button class="button primary" id="run-review" type="button">Review differences ${icon('arrow')}</button></div>`;
  bindMapping();
}

function bindMapping(): void {
  if (!state.options || !state.current || !state.incoming) return;
  document.querySelector('#back-files')?.addEventListener('click', () => { state.step = 'files'; renderWorkspace(); });
  document.querySelector<HTMLSelectElement>('#current-id')?.addEventListener('change', (event) => { state.options!.currentId = (event.target as HTMLSelectElement).value; });
  document.querySelector<HTMLSelectElement>('#incoming-id')?.addEventListener('change', (event) => { state.options!.incomingId = (event.target as HTMLSelectElement).value; });
  document.querySelectorAll<HTMLInputElement>('input[name="normalization"]').forEach((input) => input.addEventListener('change', () => { state.options!.normalization = input.value as Normalization; }));
  document.querySelectorAll<HTMLInputElement>('[data-map-check]').forEach((input) => input.addEventListener('change', () => { state.options!.fields[Number(input.dataset.mapCheck)]!.include = input.checked; updateMappedCount(); }));
  document.querySelectorAll<HTMLSelectElement>('[data-map-select]').forEach((select) => select.addEventListener('change', () => { const map = state.options!.fields[Number(select.dataset.mapSelect)]!; map.target = select.value; map.include = Boolean(select.value); renderMap(); }));
  document.querySelector('#run-review')?.addEventListener('click', () => {
    const error = document.querySelector<HTMLElement>('#map-error');
    const active = state.options!.fields.filter((field) => field.include && field.target);
    if (!state.options!.currentId || !state.options!.incomingId || !active.length) {
      if (error) { error.hidden = false; error.textContent = 'Choose both identifier fields and at least one field pair to compare.'; }
      return;
    }
    state.result = reconcile(state.current!, state.incoming!, state.options!);
    state.filter = 'all';
    state.step = 'review';
    renderWorkspace();
  });
}

function updateMappedCount(): void {
  const output = document.querySelector('.mapping-heading > span');
  if (output && state.options) output.textContent = `${state.options.fields.filter((field) => field.include).length} mapped`;
}

const labels: Record<RowStatus, string> = { added: 'Added', changed: 'Changed', unchanged: 'Unchanged', collision: 'Collision', 'needs-id': 'Needs ID', missing: 'Missing' };

function renderReview(): void {
  if (!state.result || !state.incoming) return;
  const body = document.querySelector<HTMLDivElement>('#tool-body');
  if (!body) return;
  const result = state.result;
  const blocking = result.counts.collision + result.counts['needs-id'];
  const filtered = result.rows.filter((row) => state.filter === 'all' || row.status === state.filter);
  body.innerHTML = `<div class="tool-intro review-intro"><div><p class="step-label">Step 3 of 3</p><h3>${blocking ? 'Review before you import' : 'Ready for a safer import'}</h3></div><p>${blocking ? `${blocking} incoming ${blocking === 1 ? 'row is' : 'rows are'} blocked from export. Repair identifiers in the source for a complete migration.` : 'No identity blockers found. Missing records remain informational and are never deleted.'}</p></div>
    <div class="scoreboard" aria-label="Reconciliation counts">${stat('added', '+')}${stat('changed', '≠')}${stat('missing', '−')}${stat('collision', '!')}${stat('needs-id', '?')}</div>
    <div class="review-notices">${result.lostFields.length ? `<div class="message warning">${icon('warning')}<div><strong>${result.lostFields.length} current ${result.lostFields.length === 1 ? 'field is' : 'fields are'} not mapped</strong><p>${result.lostFields.map(escapeHtml).join(', ')}. Values in these fields cannot be represented by this incoming file.</p></div></div>` : ''}${result.blankOverwriteCount ? `<div class="message warning">${icon('warning')}<div><strong>${result.blankOverwriteCount} blank ${result.blankOverwriteCount === 1 ? 'value would' : 'values would'} replace existing data</strong><p>Open changed rows below to inspect the affected fields.</p></div></div>` : ''}${result.normalizedCount ? `<div class="message info">${result.normalizedCount} incoming ${result.normalizedCount === 1 ? 'identifier was' : 'identifiers were'} normalized for matching. Exported values are unchanged.</div>` : ''}</div>
    <div class="ledger-toolbar"><div class="filters" aria-label="Filter report"><button data-filter="all" class="${state.filter === 'all' ? 'active' : ''}" type="button">All <span>${result.rows.length}</span></button>${(['added', 'changed', 'missing', 'collision', 'needs-id'] as RowStatus[]).map((status) => `<button data-filter="${status}" class="${state.filter === status ? 'active' : ''}" type="button">${labels[status]} <span>${result.counts[status]}</span></button>`).join('')}</div><p>Showing ${Math.min(filtered.length, 200)} of ${filtered.length}</p></div>
    <div class="result-table-wrap" tabindex="0" role="region" aria-label="Reconciliation results"><table class="result-table"><thead><tr><th scope="col">Identifier</th><th scope="col">Status</th><th scope="col">Finding</th></tr></thead><tbody>${filtered.slice(0, 200).map(resultRow).join('') || '<tr><td colspan="3" class="no-results">No rows match this filter.</td></tr>'}</tbody></table></div>${filtered.length > 200 ? '<p class="table-limit">The table shows the first 200 results. Counts and export include the complete file.</p>' : ''}
    <div class="export-note"><div>${icon('check')}<p><strong>${result.exportRows.length} safe incoming rows</strong><span>Collisions and blank identifiers excluded. Missing current items never become deletions.</span></p></div><button class="button primary" id="export-csv" type="button">Export reviewed CSV</button></div>
    <div class="tool-actions"><button class="button secondary" id="back-map" type="button">← Adjust mapping</button><button class="button text-button" id="start-over" type="button">Start over</button></div>`;
  bindReview();
}

function stat(status: RowStatus, symbol: string): string {
  const count = state.result?.counts[status] ?? 0;
  return `<button type="button" data-filter="${status}" class="stat ${status}" aria-label="Show ${labels[status]} rows"><span>${symbol}</span><strong>${count}</strong><small>${labels[status]}</small></button>`;
}

function resultRow(row: ReconcileResult['rows'][number]): string {
  const details = row.changes.length ? `<details><summary>${escapeHtml(row.reason)}</summary><ul>${row.changes.map((change) => `<li><code>${escapeHtml(change.field)}</code><span class="before">${escapeHtml(change.before || '(blank)')}</span><span aria-hidden="true">→</span><span class="after ${change.blankOverwrite ? 'blank' : ''}">${escapeHtml(change.after || '(blank)')}</span>${change.blankOverwrite ? '<strong>Field loss</strong>' : ''}</li>`).join('')}</ul></details>` : escapeHtml(row.reason);
  return `<tr><th scope="row"><code>${escapeHtml(row.displayId)}</code></th><td><span class="row-status ${row.status}">${labels[row.status]}</span></td><td>${details}</td></tr>`;
}

function bindReview(): void {
  document.querySelectorAll<HTMLElement>('[data-filter]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.filter as RowStatus | 'all'; renderReview(); }));
  document.querySelector('#back-map')?.addEventListener('click', () => { state.step = 'map'; renderWorkspace(); });
  document.querySelector('#export-csv')?.addEventListener('click', exportCsv);
  document.querySelector('#start-over')?.addEventListener('click', () => {
    if (!window.confirm('Clear both loaded catalogs and this review? Your original files will not be changed.')) return;
    state.current = undefined; state.incoming = undefined; state.options = undefined; state.result = undefined; state.step = 'files'; renderWorkspace();
  });
}

function exportCsv(): void {
  if (!state.result || !state.incoming) return;
  const content = toCsv(state.incoming.fields, state.result.exportRows);
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  const stem = state.incoming.name.replace(/\.(csv|json)$/i, '');
  link.href = url; link.download = `${stem}-reviewed.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce(`Exported ${state.result.exportRows.length} reviewed rows. Spreadsheet formulas were neutralized.`);
}

function renderWorkspace(scroll = true): void {
  document.querySelector('.steps')!.innerHTML = `${stepItem('files', '1', 'Files')}${stepItem('map', '2', 'Map')}${stepItem('review', '3', 'Review')}`;
  if (state.step === 'files') renderFiles();
  if (state.step === 'map') renderMap();
  if (state.step === 'review') renderReview();
  if (scroll) document.querySelector('#workspace')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function announce(message: string): void {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = message; toast.classList.add('shown');
  window.setTimeout(() => toast.classList.remove('shown'), 3600);
}

function seedDemo(): void {
  state.current = parseCatalog('my-collection.csv', 'import_ref,name,location,notes\nHB-001,Blue vase,Hall shelf,Inherited\nHB-002,Field guide,Study,First edition\nHB-003,Film camera,Studio,Working');
  state.incoming = parseCatalog('homebox-import.csv', 'import_ref,name,location,import_note\nhb-001,Blue vase,Living room,\nHB-002,Field guide,Study,\nHB-002,Duplicate row,Garage,\n,Unnumbered print,Archive,\nHB-004,Brass compass,Desk,=2+2');
  state.options = {
    currentId: 'import_ref', incomingId: 'import_ref', normalization: 'trim-case', fields: [
      { source: 'import_ref', target: 'import_ref', include: true },
      { source: 'name', target: 'name', include: true },
      { source: 'location', target: 'location', include: true },
      { source: 'import_note', target: '', include: false },
    ],
  };
  state.result = reconcile(state.current, state.incoming, state.options);
  state.filter = 'all';
  state.step = 'review';
}

function updateNetwork(): void {
  const banner = document.querySelector<HTMLElement>('#offline-banner');
  if (banner) banner.hidden = navigator.onLine;
}

function bindGlobal(): void {
  updateNetwork();
  window.addEventListener('online', updateNetwork);
  window.addEventListener('offline', updateNetwork);
  document.querySelector('#reset-demo')?.addEventListener('click', () => {
    seedDemo();
    renderWorkspace(false);
    announce('Demo reset to the original sample findings.');
  });
}

function routeForLocation(): AppRoute {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/' && new URLSearchParams(window.location.search).get('demo') === '1') return 'demo';
  if (path === '/') return 'home';
  if (path === '/demo') return 'demo';
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  return 'not-found';
}

function setMetadata(route: AppRoute): void {
  const details: Record<AppRoute, { title: string; description: string; path: string }> = {
    home: { title: 'Catalog Reconciler — compare catalog imports', description: 'Compare current and incoming catalog files, find identity risks, and export reviewed CSV rows in your browser.', path: '/' },
    demo: { title: 'Demo — Catalog Reconciler', description: 'Review a populated sample catalog comparison without opening or changing your files.', path: '/demo' },
    privacy: { title: 'Privacy — Catalog Reconciler', description: 'See how Catalog Reconciler reads files in browser memory and stores only public app files for offline use.', path: '/privacy' },
    terms: { title: 'Terms — Catalog Reconciler', description: 'Read the terms for comparing catalog files and using a reviewed CSV export.', path: '/terms' },
    'not-found': { title: 'Page not found — Catalog Reconciler', description: 'Return to Catalog Reconciler to compare catalog import files.', path: '/404' },
  };
  const current = details[route];
  document.title = current.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', current.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', current.title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', current.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', `${BASE_URL}${current.path}`);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', current.title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', current.description);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `${BASE_URL}${current.path}`);
}

function renderNotFound(): void {
  app.innerHTML = `${header()}<main id="main" class="not-found"><div class="error-code" aria-hidden="true">404</div><p class="eyebrow">Page not found</p><h1 tabindex="-1">Return to your catalog check</h1><p>This address does not match a page in Catalog Reconciler.</p><a class="button primary" href="/" data-route>Check my files ${icon('arrow')}</a></main>${footer()}`;
  bindGlobal();
}

function focusRouteHeading(): void {
  const heading = document.querySelector<HTMLElement>('h1');
  heading?.focus({ preventScroll: true });
  const announcer = document.querySelector<HTMLElement>('#route-announcer');
  if (announcer && heading) announcer.textContent = heading.textContent ?? document.title;
}

function render(fromNavigation = false): void {
  const route = routeForLocation();
  state.demo = route === 'demo';
  setMetadata(route);
  if (route === 'privacy' || route === 'terms') {
    renderLegal(route);
  } else if (route === 'not-found') {
    renderNotFound();
  } else {
    if (state.demo) seedDemo();
    else { state.current = undefined; state.incoming = undefined; state.options = undefined; state.result = undefined; state.filter = 'all'; state.step = 'files'; }
    app.innerHTML = state.demo ? demoMarkup() : homeMarkup();
    bindGlobal();
    renderWorkspace(false);
  }
  if (fromNavigation) window.requestAnimationFrame(focusRouteHeading);
}

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-route]');
  if (!link || link.origin !== window.location.origin) return;
  event.preventDefault();
  history.pushState({}, '', `${link.pathname}${link.search}${link.hash}`);
  render(true);
});
window.addEventListener('popstate', () => render(true));

render();
if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
