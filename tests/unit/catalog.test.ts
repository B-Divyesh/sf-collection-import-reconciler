import { describe, expect, it } from 'vitest';
import { CatalogParseError, parseCatalog, toCsv } from '../../src/catalog';

describe('catalog parsing', () => {
  it('parses quoted CSV values and CRLF rows', () => {
    const catalog = parseCatalog('items.csv', 'id,name,notes\r\n1,"Vase, blue","He said ""keep"""\r\n');
    expect(catalog.fields).toEqual(['id', 'name', 'notes']);
    expect(catalog.rows[0]).toEqual({ id: '1', name: 'Vase, blue', notes: 'He said "keep"' });
  });

  it('accepts a JSON object containing an items array', () => {
    const catalog = parseCatalog('backup.json', JSON.stringify({ items: [{ id: 7, tags: ['rare'] }, { id: 8, name: 'Map' }] }));
    expect(catalog.fields).toEqual(['id', 'tags', 'name']);
    expect(catalog.rows[0]?.tags).toBe('["rare"]');
    expect(catalog.rows[1]?.name).toBe('Map');
  });

  it('reports malformed and ambiguous input clearly', () => {
    expect(() => parseCatalog('empty.csv', '')).toThrow(CatalogParseError);
    expect(() => parseCatalog('bad.csv', 'id,id\n1,2')).toThrow(/appears twice/);
    expect(() => parseCatalog('bad.json', '[{"id": 1}')).toThrow(/cannot be read/);
  });
});

describe('safe CSV output', () => {
  it('neutralizes spreadsheet formulas and quotes commas', () => {
    const csv = toCsv(['id', 'name'], [{ id: '=1+1', name: 'Vase, blue' }, { id: '@SUM(A:A)', name: 'Safe' }]);
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("'@SUM(A:A)");
    expect(csv).toContain('"Vase, blue"');
  });
});
