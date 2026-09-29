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

  it('returns a current query unchanged', () => {
    const query = { refId: 'A', target: 'AF\\DB\\E;Level', queryVersion: QUERY_VERSION } as PIWebAPIQuery;
    expect(migrateQuery(query)).toBe(query);
  });
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

  it('enables the summary of a 4.x query re-saved by 5.1 or 5.2', () => {
    const query = legacy({
      enable: false,
      duration: '',
      types: [average],
      basis: 'EventWeighted',
      interval: '30m',
      nodata: 'Drop',
    });
    const migrated = migrateLegacySummary(query);
    expect(migrated.summary).toEqual({ enable: true, duration: '30m', types: [average], basis: 'EventWeighted' });
    expect(migrated.nodata).toBe('Drop');
  });

  it('keeps the summary disabled without summary types and keeps a newer bad data replacement', () => {
    const migrated = migrateLegacySummary(legacy({ types: [], interval: '', nodata: 'Zero' }, { nodata: 'Previous' }));
    expect(migrated.summary).toEqual({ types: [], enable: false });
    expect(migrated.nodata).toBe('Previous');
  });

  it('replaces the Null bad data replacement written by the query editor', () => {
    const migrated = migrateLegacySummary(legacy({ types: [], interval: '', nodata: 'Previous' }, { nodata: 'Null' }));
    expect(migrated.nodata).toBe('Previous');
  });

  it('returns current queries unchanged', () => {
    const query = legacy({ enable: false, duration: '1h', types: [average] }, { nodata: 'Null' });
    expect(migrateLegacySummary(query)).toBe(query);
    const migrated = migrateLegacySummary(legacy({ types: [average], interval: '1h' }));
    expect(migrateLegacySummary(migrated)).toBe(migrated);
  });
});
