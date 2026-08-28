export type CatalogRow = Record<string, string>;

export interface Catalog {
  name: string;
  format: 'CSV' | 'JSON';
  fields: string[];
  rows: CatalogRow[];
}

export class CatalogParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogParseError';
  }
}

function readCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (quoted) throw new CatalogParseError('The CSV ends inside a quoted value. Close the quote and try again.');
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
}

function parseCsv(name: string, source: string): Catalog {
  const rows = readCsvRows(source.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new CatalogParseError('This CSV needs a header row and at least one item row.');
  const header = rows[0]?.map((value) => value.trim()) ?? [];
  if (header.some((field) => !field)) throw new CatalogParseError('Every CSV column needs a header. Fill blank headers and try again.');
  const duplicate = header.find((field, index) => header.indexOf(field) !== index);
  if (duplicate) throw new CatalogParseError(`The header “${duplicate}” appears twice. Rename one column and try again.`);

  const data = rows.slice(1).map((values) => Object.fromEntries(header.map((field, index) => [field, values[index] ?? ''])));
  return { name, format: 'CSV', fields: header, rows: data };
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function parseJson(name: string, source: string): Catalog {
  let decoded: unknown;
  try {
    decoded = JSON.parse(source);
  } catch {
    throw new CatalogParseError('This JSON cannot be read. Check for a missing comma or quote and try again.');
  }

  let items: unknown[] | undefined;
  if (Array.isArray(decoded)) items = decoded;
  if (!items && decoded && typeof decoded === 'object') {
    const candidate = Object.values(decoded).find(Array.isArray);
    if (candidate) items = candidate;
  }
  if (!items?.length) throw new CatalogParseError('JSON must contain a non-empty array of catalog items.');
  if (items.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new CatalogParseError('Every JSON item must be an object with named fields.');
  }

  const objects = items as Record<string, unknown>[];
  const fields = [...new Set(objects.flatMap((item) => Object.keys(item)))];
  return {
    name,
    format: 'JSON',
    fields,
    rows: objects.map((item) => Object.fromEntries(fields.map((field) => [field, stringifyValue(item[field])]))),
  };
}

export function parseCatalog(name: string, source: string): Catalog {
  if (!source.trim()) throw new CatalogParseError('This file is empty. Choose a CSV or JSON file with catalog items.');
  const looksJson = name.toLowerCase().endsWith('.json') || /^[\s\uFEFF]*[\[{]/.test(source);
  if (!looksJson && !name.toLowerCase().endsWith('.csv')) {
    throw new CatalogParseError('Choose a .csv or .json file. Other file types are not read.');
  }
  return looksJson ? parseJson(name, source) : parseCsv(name, source);
}

function safeSpreadsheetCell(value: string): string {
  return /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function quoteCsv(value: string): string {
  const safe = safeSpreadsheetCell(value);
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toCsv(fields: string[], rows: CatalogRow[]): string {
  const lines = [fields.map(quoteCsv).join(',')];
  for (const row of rows) lines.push(fields.map((field) => quoteCsv(row[field] ?? '')).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
