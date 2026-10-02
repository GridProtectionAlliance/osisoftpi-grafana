import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { migrateLegacySummary, migrateQuery, queryMigrations, QUERY_VERSION } from './queryVersion';
import { PIWebAPIQuery } from './types';

const examplesDir = join(__dirname, '..', 'testdata', 'queries');

interface Example {
  name: string;
  saved: PIWebAPIQuery;
  expected: Partial<PIWebAPIQuery>;
}

describe('query format version', () => {
  it('has a conversion step for every version', () => {
    for (let version = 1; version <= QUERY_VERSION; version++) {
      expect(queryMigrations[version]).toBeInstanceOf(Function);
    }
  });

  // the same examples are converted by the backend (pkg/plugin/query_version_test.go)
  const files = readdirSync(examplesDir).filter((f) => f.endsWith('.json'));
  it('has an example of every format version', () => {
    for (let version = 0; version <= QUERY_VERSION; version++) {
      expect(files).toContain(`v${version}.json`);
    }
  });

  for (const file of files) {
    const examples: Example[] = JSON.parse(readFileSync(join(examplesDir, file), 'utf8'));
    for (const example of examples) {
      it(`converts ${file}: ${example.name}`, () => {
        const migrated = migrateQuery(example.saved);
        expect(migrated).toMatchObject(example.expected);
        expect(migrateQuery(migrated)).toBe(migrated);
      });
    }
  }
});

describe('migrateLegacySummary', () => {
  const average = { label: 'Average', value: { value: 'Average', expandable: true } };
  const legacy = (summary: object, extra: object = {}) =>
    ({ refId: 'A', target: 'AF\\DB\\E;Level', summary, ...extra }) as unknown as PIWebAPIQuery;

  it('enables the summary of a 4.x query with summary types, with its interval and bad data replacement', () => {
    const query = legacy({ types: [average], basis: 'TimeWeighted', interval: ' 1h ', nodata: 'Previous' });
    expect(migrateLegacySummary(query)).toEqual({
      refId: 'A',
      target: 'AF\\DB\\E;Level',
      nodata: 'Previous',
      summary: { types: [average], basis: 'TimeWeighted', duration: '1h', enable: true },
    });
  });

  // the examples in testdata/queries are checked with toMatchObject, which does not see an extra empty duration
  it('keeps the summary disabled without summary types and does not create an empty duration', () => {
    const migrated = migrateLegacySummary(legacy({ types: [], interval: '', nodata: 'Zero' }, { nodata: 'Previous' }));
    expect(migrated.summary).toEqual({ types: [], enable: false });
    expect(migrated.nodata).toBe('Previous');
  });

  it('returns current queries unchanged', () => {
    const query = legacy({ enable: false, duration: '1h', types: [average] }, { nodata: 'Null' });
    expect(migrateLegacySummary(query)).toBe(query);
    const migrated = migrateLegacySummary(legacy({ types: [average], interval: '1h' }));
    expect(migrateLegacySummary(migrated)).toBe(migrated);
  });
});
