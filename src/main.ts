import './styles.css';
import { CatalogParseError, parseCatalog, toCsv, type Catalog } from './catalog';
import { reconcile, type FieldMap, type Normalization, type ReconcileOptions, type ReconcileResult, type RowStatus } from './reconcile';
import { buyUrl, captureReturnedLicense, clearLicense, optimisticLicenseState, saveLicense, storedLicense, verifyLicense, type LicenseState } from './license';

type Step = 'files' | 'map' | 'review';
interface Recipe { name: string; currentId: string; incomingId: string; normalization: Normalization; fields: FieldMap[] }

const app = document.querySelector<HTMLDivElement>('#app') as HTMLDivElement;
if (!app) throw new Error('Application root not found');

const state: {
  step: Step;
  current?: Catalog;
  incoming?: Catalog;
  options?: ReconcileOptions;
  result?: ReconcileResult;
  filter: RowStatus | 'all';
  license: LicenseState;
} = { step: 'files', filter: 'all', license: optimisticLicenseState() };

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
  return `<div class="offline-banner" id="offline-banner" role="status" hidden>You’re offline. File comparison still works; license checks will resume when you reconnect.</div>
    <header class="site-header">
      <a class="brand" href="/" aria-label="Catalog Reconciler home"><img src="/mark.svg" width="40" height="40" alt=""><span>Catalog<br>Reconciler</span></a>
      <nav aria-label="Primary"><a href="/#workspace">Reconcile</a><a href="/#migration-kit">Migration kit</a><a href="/privacy">Privacy</a></nav>
    </header>`;
}

function footer(): string {
  return `<footer><div><strong>Catalog Reconciler</strong><p>Your catalogs stay in this browser. No account required.</p></div><nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://sociobot.in" rel="noreferrer">A Sociobot utility</a></nav><p class="generated-note">Hero artwork was generated for this product and reviewed by the Param Factory.</p></footer>`;
}

function renderLegal(kind: 'privacy' | 'terms'): void {
  const privacy = kind === 'privacy';
  document.title = `${privacy ? 'Privacy' : 'Terms'} — Catalog Reconciler`;
  app.innerHTML = `${header()}<main id="main" class="legal-page"><a class="back-link" href="/">← Back to the reconciler</a><p class="eyebrow">Plain-language ${privacy ? 'privacy' : 'terms'}</p><h1>${privacy ? 'Your catalog never leaves your browser.' : 'Use it as a careful preflight, not a backup.'}</h1>
    ${privacy ? `<section><h2>What stays local</h2><p>CSV and JSON files are read in your browser memory. Their rows, identifiers, and field values are not uploaded to us. Closing or reloading the page clears the active comparison.</p><h2>What is stored</h2><p>If you buy or restore the Migration kit, your license token, verification time, and any mapping recipes you save are stored in this browser’s local storage. You can remove them from the Migration kit panel. The service worker stores public app files so the tool can work offline.</p><h2>Billing request</h2><p>The buy link opens Sociobot’s hosted checkout. Sociobot and Dodo, its merchant of record, process purchase and billing information. License verification sends only your license token and product name to <code>api.sociobot.in</code>. Catalog contents are never included.</p><h2>Analytics</h2><p>This app includes no analytics, advertising, tracking pixels, or third-party fonts and scripts.</p><h2>Your choices</h2><p>Use the free tool without storage, clear your browser site data at any time, or remove the saved license from the product. Questions: <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>` : `<section><h2>Purpose</h2><p>Catalog Reconciler compares files and produces a reviewed export. It does not write to Homebox, Koillection, spreadsheets, or any catalog service. You are responsible for backing up your destination and checking its import requirements.</p><h2>No automatic deletion</h2><p>Missing records appear in the report but are never placed into the exported import file as deletion commands. Collision and blank-identifier rows are excluded from export.</p><h2>One-time license</h2><p>The $19 Migration kit is a one-time purchase for reusable mapping recipes and printable migration receipts. Sociobot/Dodo is the merchant of record. Refunds are handled through that checkout service and revoke the associated license.</p><h2>Availability and warranty</h2><p>The tool is provided “as is,” without warranty. File formats vary, so inspect the result and test imports on a backup or copy first. We may improve or discontinue the hosted version; exported files remain yours.</p><h2>Acceptable use</h2><p>Use the tool only with data you are authorized to process. Do not attempt to disrupt the service or license system.</p>`}
    <p class="legal-date">Effective 28 August 2026</p></section></main>${footer()}`;
  bindGlobal();
}

function homeMarkup(): string {
  return `${header()}<main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy"><p class="eyebrow">A preflight for precious catalogs</p><h1 id="hero-title">Keep every item.<br><em>Keep its identity.</em></h1><p class="lede">Compare your current catalog with the file you plan to import. Catch renumbered IDs, collisions, blank fields, and missing records before another system touches your collection.</p><div class="hero-actions"><a class="button primary" href="#workspace">Check my files ${icon('arrow')}</a><button class="button text-button" id="load-example" type="button">Try a safe example</button></div><p class="local-note">No upload · CSV or JSON · Works offline</p></div>
      <figure class="hero-art"><picture><source media="(max-width: 720px)" srcset="/assets/hero-ledgers-768.webp"><img src="/assets/hero-ledgers-1400.webp" width="1400" height="933" fetchpriority="high" alt="Two overlapping printed catalog ledgers examined through a clear registration loupe"></picture><figcaption>Two records only align when their identities do.</figcaption></figure>
    </section>
    <section class="trust-strip" aria-label="Safety principles"><span>01 / Read locally</span><span>02 / Compare visibly</span><span>03 / Export reversibly</span></section>
    <section class="workspace" id="workspace" aria-labelledby="workspace-title"><div class="section-heading"><p class="eyebrow">Import desk</p><h2 id="workspace-title">Reconcile a catalog</h2><p>Nothing is sent to a server. Start with the catalog you trust, then add the file you are about to import.</p></div><div class="workbench"><ol class="steps" aria-label="Reconciliation progress">${stepItem('files', '1', 'Files')}${stepItem('map', '2', 'Map')}${stepItem('review', '3', 'Review')}</ol><div id="tool-body" class="tool-body"></div></div></section>
    <section class="how-it-works" aria-labelledby="how-title"><div><p class="eyebrow">What the stamps mean</p><h2 id="how-title">A diff you can act on</h2></div><dl><div><dt><span class="status-dot added">+</span> Added</dt><dd>A new normalized identifier. Included in the reviewed export.</dd></div><div><dt><span class="status-dot changed">≠</span> Changed</dt><dd>A known item whose mapped values differ. Every change is shown.</dd></div><div><dt><span class="status-dot collision">!</span> Collision</dt><dd>An identifier occurs twice. Blocked from export until repaired at the source.</dd></div><div><dt><span class="status-dot missing">−</span> Missing</dt><dd>An existing item is absent from the incoming file. Reported, never deleted.</dd></div></dl></section>
    <section class="migration-kit" id="migration-kit" aria-labelledby="kit-title"><div class="kit-stamp" aria-hidden="true">SAVE<br>THE<br>RECIPE</div><div><p class="eyebrow">Optional migration kit · one-time $19</p><h2 id="kit-title">Repeat the careful parts.</h2><p>Core comparison and safe CSV export are always free. The Migration kit saves reusable field-mapping recipes in this browser and turns the current review into a print-ready migration receipt.</p><ul><li>${icon('check')} Saved mapping recipes</li><li>${icon('check')} Printable audit receipts</li><li>${icon('check')} One-time purchase, no account subscription</li></ul></div><div id="license-panel" class="license-panel"></div></section>
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
  body.innerHTML = `<div class="tool-intro"><div><p class="step-label">Step 1 of 3</p><h3>Place both catalogs on the desk</h3></div><p>We read the first row as field names. JSON may be an array or an object containing an array.</p></div><div class="drop-grid">${fileSlot('current', 'Current catalog', 'The source of truth before migration', state.current)}${fileSlot('incoming', 'Incoming file', 'The file you plan to import', state.incoming)}</div><div id="file-error" class="message error" role="alert" hidden></div><div class="tool-actions"><span class="privacy-chip">${icon('lock')} Files stay in memory</span><button class="button primary" id="continue-map" type="button" ${state.current && state.incoming ? '' : 'disabled'}>Map identifiers ${icon('arrow')}</button></div>`;
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

function recipes(): Recipe[] {
  try { return JSON.parse(localStorage.getItem('cr:mapping-recipes') ?? '[]') as Recipe[]; } catch { return []; }
}

function renderMap(): void {
  if (!state.current || !state.incoming || !state.options) return;
  const body = document.querySelector<HTMLDivElement>('#tool-body');
  if (!body) return;
  const saved = recipes();
  body.innerHTML = `<div class="tool-intro"><div><p class="step-label">Step 2 of 3</p><h3>Align identity and fields</h3></div><p>Choose the columns that identify the same physical item. Normalization only affects matching; exported values stay unchanged.</p></div>
    ${state.license === 'unlocked' && saved.length ? `<div class="recipe-row"><label for="recipe-select">Saved recipe</label><select id="recipe-select"><option value="">Choose a recipe</option>${saved.map((recipe, index) => `<option value="${index}">${escapeHtml(recipe.name)}</option>`).join('')}</select><button type="button" class="button small" id="apply-recipe">Apply recipe</button></div>` : ''}
    <fieldset class="identity-grid"><legend>Identity match</legend><label>Current identifier<select id="current-id">${state.current.fields.map((field) => `<option ${field === state.options?.currentId ? 'selected' : ''}>${escapeHtml(field)}</option>`).join('')}</select><span>${escapeHtml(state.current.name)}</span></label><div class="match-symbol" aria-hidden="true">⇄</div><label>Incoming identifier<select id="incoming-id">${state.incoming.fields.map((field) => `<option ${field === state.options?.incomingId ? 'selected' : ''}>${escapeHtml(field)}</option>`).join('')}</select><span>${escapeHtml(state.incoming.name)}</span></label></fieldset>
    <fieldset class="normalization"><legend>Normalize identifiers before matching</legend><label><input type="radio" name="normalization" value="exact" ${state.options.normalization === 'exact' ? 'checked' : ''}><span><strong>Exact</strong> Case and spacing matter</span></label><label><input type="radio" name="normalization" value="trim-case" ${state.options.normalization === 'trim-case' ? 'checked' : ''}><span><strong>Trim + case-fold</strong> Recommended for text IDs</span></label><label><input type="radio" name="normalization" value="numeric" ${state.options.normalization === 'numeric' ? 'checked' : ''}><span><strong>Numeric</strong> Also treats 0012 and 12 as equal</span></label></fieldset>
    <div class="mapping-heading"><div><h4>Field map</h4><p>Only checked pairs are compared for changes.</p></div><span>${state.options.fields.filter((field) => field.include).length} mapped</span></div><div class="mapping-table" role="table" aria-label="Field mapping"><div role="row" class="mapping-header"><span role="columnheader">Use</span><span role="columnheader">Incoming field</span><span role="columnheader">Current field</span></div>${state.options.fields.map((mapping, index) => `<div role="row" class="mapping-row"><span role="cell"><input aria-label="Compare ${escapeHtml(mapping.source)}" type="checkbox" data-map-check="${index}" ${mapping.include ? 'checked' : ''}></span><span role="cell"><code>${escapeHtml(mapping.source)}</code></span><span role="cell"><label class="visually-hidden" for="map-${index}">Current field for ${escapeHtml(mapping.source)}</label><select id="map-${index}" data-map-select="${index}">${optionsFor(state.current!.fields, mapping.target)}</select></span></div>`).join('')}</div>
    <div id="map-error" class="message error" role="alert" hidden></div><div class="tool-actions"><button class="button secondary" id="back-files" type="button">← Back to files</button><div class="action-cluster">${state.license === 'unlocked' ? '<button class="button secondary" id="save-recipe" type="button">Save recipe</button>' : ''}<button class="button primary" id="run-review" type="button">Review differences ${icon('arrow')}</button></div></div>`;
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
  document.querySelector('#save-recipe')?.addEventListener('click', saveRecipe);
  document.querySelector('#apply-recipe')?.addEventListener('click', applyRecipe);
}

function updateMappedCount(): void {
  const output = document.querySelector('.mapping-heading > span');
  if (output && state.options) output.textContent = `${state.options.fields.filter((field) => field.include).length} mapped`;
}

function saveRecipe(): void {
  if (!state.options) return;
  const name = window.prompt('Name this mapping recipe (for example, Homebox → Koillection):')?.trim();
  if (!name) return;
  const all = recipes();
  all.push({ name, currentId: state.options.currentId, incomingId: state.options.incomingId, normalization: state.options.normalization, fields: state.options.fields });
  localStorage.setItem('cr:mapping-recipes', JSON.stringify(all.slice(-20)));
  announce(`Saved mapping recipe “${name}” in this browser.`);
  renderMap();
}

function applyRecipe(): void {
  const select = document.querySelector<HTMLSelectElement>('#recipe-select');
  const recipe = recipes()[Number(select?.value)];
  if (!recipe || !state.current || !state.incoming) return;
  if (!state.current.fields.includes(recipe.currentId) || !state.incoming.fields.includes(recipe.incomingId)) {
    announce('That recipe does not fit these files. Its identifier fields are missing.');
    return;
  }
  state.options = {
    currentId: recipe.currentId,
    incomingId: recipe.incomingId,
    normalization: recipe.normalization,
    fields: state.incoming.fields.map((source) => {
      const saved = recipe.fields.find((field) => field.source === source);
      return saved && state.current!.fields.includes(saved.target) ? { ...saved } : { source, target: '', include: false };
    }),
  };
  renderMap();
  announce(`Applied recipe “${recipe.name}”.`);
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
    <div class="result-table-wrap" tabindex="0" role="region" aria-label="Reconciliation results"><table class="result-table"><thead><tr><th scope="col">Identifier</th><th scope="col">Status</th><th scope="col">Finding</th></tr></thead><tbody>${filtered.slice(0, 200).map(resultRow).join('') || '<tr><td colspan="3" class="no-results">No rows match this stamp.</td></tr>'}</tbody></table></div>${filtered.length > 200 ? '<p class="table-limit">The table shows the first 200 results. Counts and export include the complete file.</p>' : ''}
    <div class="export-note"><div>${icon('check')}<p><strong>${result.exportRows.length} safe incoming rows</strong><span>Collisions and blank identifiers excluded. Missing current items never become deletions.</span></p></div><button class="button primary" id="export-csv" type="button">Export reviewed CSV</button></div>
    <div class="tool-actions"><button class="button secondary" id="back-map" type="button">← Adjust mapping</button><div class="action-cluster">${state.license === 'unlocked' ? '<button class="button secondary" id="print-receipt" type="button">Print receipt</button>' : '<a class="button secondary" href="#migration-kit">Unlock receipts</a>'}<button class="button text-button" id="start-over" type="button">Start over</button></div></div>`;
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
  document.querySelector('#print-receipt')?.addEventListener('click', () => window.print());
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

function licenseMarkup(): string {
  const statusCopy: Record<LicenseState, string> = {
    locked: 'Paste a license to restore a purchase.', checking: 'Checking your saved license…', unlocked: 'Migration kit unlocked on this browser.', inactive: 'This license is no longer active.', offline: 'Offline: license could not be checked yet.',
  };
  return `<div class="price"><strong>$19</strong><span>once</span></div><p class="license-status ${state.license}">${state.license === 'unlocked' ? icon('check') : icon('lock')}${statusCopy[state.license]}</p>${state.license === 'unlocked' ? '<button class="button secondary" id="remove-license" type="button">Remove from this browser</button>' : `<a class="button primary" href="${buyUrl()}">Buy the Migration kit ${icon('arrow')}</a><details class="restore"><summary>Have a license? Restore it</summary><form id="license-form"><label for="license-token">License token</label><input id="license-token" name="license" autocomplete="off" spellcheck="false" required value="${escapeHtml(storedLicense())}"><button class="button secondary" type="submit">Verify license</button></form></details>`}<p class="legal-mini">Checkout by Sociobot/Dodo. <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>`;
}

function renderLicense(): void {
  const panel = document.querySelector<HTMLDivElement>('#license-panel');
  if (!panel) return;
  panel.innerHTML = licenseMarkup();
  document.querySelector('#license-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = new FormData(event.currentTarget as HTMLFormElement).get('license')?.toString().trim();
    if (!token) return;
    saveLicense(token); state.license = 'checking'; renderLicense();
    state.license = await verifyLicense(true); renderLicense();
    if (state.step === 'map') renderMap(); if (state.step === 'review') renderReview();
  });
  document.querySelector('#remove-license')?.addEventListener('click', () => {
    if (!window.confirm('Remove the saved license and mapping recipes from this browser?')) return;
    clearLicense(); localStorage.removeItem('cr:mapping-recipes'); state.license = 'locked'; renderLicense();
    if (state.step === 'map') renderMap(); if (state.step === 'review') renderReview();
  });
}

function announce(message: string): void {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = message; toast.classList.add('shown');
  window.setTimeout(() => toast.classList.remove('shown'), 3600);
}

function loadExample(): void {
  state.current = parseCatalog('my-collection.csv', 'import_ref,name,location,notes\nHB-001,Blue vase,Hall shelf,Inherited\nHB-002,Field guide,Study,First edition\nHB-003,Film camera,Studio,Working');
  state.incoming = parseCatalog('homebox-import.csv', 'import_ref,name,location\nhb-001,Blue vase,Living room\nHB-002,Field guide,Study\nHB-002,Duplicate row,Garage\n,Unnumbered print,Archive\nHB-004,Brass compass,Desk');
  state.options = undefined; state.result = undefined; state.step = 'files'; renderWorkspace();
  announce('Example catalogs loaded. Continue to map identifiers.');
}

function updateNetwork(): void {
  const banner = document.querySelector<HTMLElement>('#offline-banner');
  if (banner) banner.hidden = navigator.onLine;
}

function bindGlobal(): void {
  updateNetwork();
  window.addEventListener('online', updateNetwork);
  window.addEventListener('offline', updateNetwork);
}

async function render(): Promise<void> {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/privacy' || path === '/terms') { renderLegal(path.slice(1) as 'privacy' | 'terms'); return; }
  document.title = 'Catalog Reconciler — preflight collection imports';
  app.innerHTML = homeMarkup();
  bindGlobal(); renderWorkspace(false); renderLicense();
  document.querySelector('#load-example')?.addEventListener('click', loadExample);
  const returned = captureReturnedLicense();
  if (returned) { state.license = 'checking'; renderLicense(); }
  if (storedLicense()) {
    state.license = await verifyLicense(returned);
    renderLicense();
    if (state.license === 'unlocked' && returned) announce('Migration kit unlocked. Your license is saved in this browser.');
  }
}

void render();
if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
