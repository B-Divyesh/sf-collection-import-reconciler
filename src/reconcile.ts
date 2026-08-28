import type { Catalog, CatalogRow } from './catalog';

export type Normalization = 'exact' | 'trim-case' | 'numeric';
export type RowStatus = 'added' | 'changed' | 'unchanged' | 'collision' | 'needs-id' | 'missing';

export interface FieldMap {
  source: string;
  target: string;
  include: boolean;
}

export interface ReconcileOptions {
  currentId: string;
  incomingId: string;
  normalization: Normalization;
  fields: FieldMap[];
}

export interface Change {
  field: string;
  before: string;
  after: string;
  blankOverwrite: boolean;
}

export interface ResultRow {
  id: string;
  displayId: string;
  status: RowStatus;
  reason: string;
  source?: CatalogRow;
  current?: CatalogRow;
  changes: Change[];
}

export interface ReconcileResult {
  rows: ResultRow[];
  exportRows: CatalogRow[];
  counts: Record<RowStatus, number>;
  lostFields: string[];
  normalizedCount: number;
  blankOverwriteCount: number;
}

export function normalizeId(value: string, mode: Normalization): string {
  if (mode === 'exact') return value;
  const trimmed = value.trim();
  if (mode === 'trim-case') return trimmed.toLocaleLowerCase();
  if (/^[+-]?\d+$/.test(trimmed)) {
    const sign = trimmed.startsWith('-') ? '-' : '';
    const digits = trimmed.replace(/^[+-]?0*/, '') || '0';
    return `${sign}${digits}`;
  }
  return trimmed.toLocaleLowerCase();
}

function countIds(catalog: Catalog, field: string, mode: Normalization): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of catalog.rows) {
    const id = normalizeId(row[field] ?? '', mode);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export function reconcile(current: Catalog, incoming: Catalog, options: ReconcileOptions): ReconcileResult {
  const activeMaps = options.fields.filter((field) => field.include && field.target);
  const currentCounts = countIds(current, options.currentId, options.normalization);
  const incomingCounts = countIds(incoming, options.incomingId, options.normalization);
  const currentById = new Map<string, CatalogRow>();
  current.rows.forEach((row) => {
    const id = normalizeId(row[options.currentId] ?? '', options.normalization);
    if (id && currentCounts.get(id) === 1) currentById.set(id, row);
  });

  const seen = new Set<string>();
  const rows: ResultRow[] = [];
  const exportRows: CatalogRow[] = [];
  let normalizedCount = 0;
  let blankOverwriteCount = 0;

  for (const source of incoming.rows) {
    const rawId = source[options.incomingId] ?? '';
    const id = normalizeId(rawId, options.normalization);
    if (id && id !== rawId) normalizedCount += 1;
    if (!id) {
      rows.push({ id, displayId: '(blank)', status: 'needs-id', reason: 'No identifier; the destination might generate one', source, changes: [] });
      continue;
    }
    seen.add(id);
    if ((incomingCounts.get(id) ?? 0) > 1 || (currentCounts.get(id) ?? 0) > 1) {
      const location = (incomingCounts.get(id) ?? 0) > 1 ? 'incoming file' : 'current catalog';
      rows.push({ id, displayId: rawId, status: 'collision', reason: `Identifier appears more than once in the ${location}`, source, changes: [] });
      continue;
    }

    const matched = currentById.get(id);
    if (!matched) {
      rows.push({ id, displayId: rawId, status: 'added', reason: 'New identifier', source, changes: [] });
      exportRows.push(source);
      continue;
    }

    const changes = activeMaps.flatMap(({ source: sourceField, target }) => {
      if (sourceField === options.incomingId && target === options.currentId) return [];
      const before = matched[target] ?? '';
      const after = source[sourceField] ?? '';
      return before === after ? [] : [{ field: target, before, after, blankOverwrite: Boolean(before && !after) }];
    });
    blankOverwriteCount += changes.filter((change) => change.blankOverwrite).length;
    rows.push({
      id,
      displayId: rawId,
      status: changes.length ? 'changed' : 'unchanged',
      reason: changes.length ? `${changes.length} mapped field${changes.length === 1 ? '' : 's'} changed` : 'Mapped fields match',
      source,
      current: matched,
      changes,
    });
    exportRows.push(source);
  }

  for (const currentRow of current.rows) {
    const rawId = currentRow[options.currentId] ?? '';
    const id = normalizeId(rawId, options.normalization);
    if (id && !seen.has(id) && currentCounts.get(id) === 1) {
      rows.push({ id, displayId: rawId, status: 'missing', reason: 'Present now, absent from incoming file; no deletion will be exported', current: currentRow, changes: [] });
    }
  }

  const mappedTargets = new Set(activeMaps.map((field) => field.target));
  mappedTargets.add(options.currentId);
  const lostFields = current.fields.filter((field) => !mappedTargets.has(field));
  const statuses: RowStatus[] = ['added', 'changed', 'unchanged', 'collision', 'needs-id', 'missing'];
  const counts = Object.fromEntries(statuses.map((status) => [status, rows.filter((row) => row.status === status).length])) as Record<RowStatus, number>;
  return { rows, exportRows, counts, lostFields, normalizedCount, blankOverwriteCount };
}
