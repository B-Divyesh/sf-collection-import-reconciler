import { describe, expect, it } from 'vitest';
import { parseCatalog } from '../../src/catalog';
import { normalizeId, reconcile } from '../../src/reconcile';

const current = parseCatalog('current.csv', 'id,name,location,notes\n001,Blue vase,Hall,Inherited\n002,Book,Study,First edition\n003,Camera,Studio,Working');
const incoming = parseCatalog('incoming.csv', 'ref,title,place\n1,Blue vase,Living room\n002,Book,Study\n002,Duplicate,Garage\n,Print,Archive\n004,Compass,Desk');

describe('identifier normalization', () => {
  it('supports exact, case-folded, and numeric matching', () => {
    expect(normalizeId(' AbC ', 'exact')).toBe(' AbC ');
    expect(normalizeId(' AbC ', 'trim-case')).toBe('abc');
    expect(normalizeId('0012', 'numeric')).toBe('12');
  });
});

describe('reconciliation', () => {
  const result = reconcile(current, incoming, {
    currentId: 'id', incomingId: 'ref', normalization: 'numeric', fields: [
      { source: 'ref', target: 'id', include: true },
      { source: 'title', target: 'name', include: true },
      { source: 'place', target: 'location', include: true },
    ],
  });

  it('classifies changes, collisions, missing records, and blank IDs', () => {
    expect(result.counts.changed).toBe(1);
    expect(result.counts.collision).toBe(2);
    expect(result.counts['needs-id']).toBe(1);
    expect(result.counts.added).toBe(1);
    expect(result.counts.missing).toBe(1);
  });

  it('detects field loss and exports only non-blocked incoming rows', () => {
    expect(result.lostFields).toEqual(['notes']);
    expect(result.exportRows).toHaveLength(2);
    expect(result.exportRows.map((row) => row.ref)).toEqual(['1', '004']);
  });

  it('never exports missing rows as deletions', () => {
    expect(result.rows.find((row) => row.status === 'missing')?.displayId).toBe('003');
    expect(result.exportRows.some((row) => row.ref === '003')).toBe(false);
  });
});
