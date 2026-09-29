import { PIWebAPIQuery, PiWebAPISummary } from './types';

/**
 * Format version of the saved query. Raise it when a change makes queries saved by earlier versions read
 * differently (a field renamed, moved or given another meaning), and in the same change:
 * - add the conversion step to queryMigrations, and to queryMigrations in pkg/plugin/query_version.go
 * - raise queryVersion in pkg/plugin/query_version.go
 * - add an example of the current format to testdata/queries (see CONTRIBUTING.md)
 */
export const QUERY_VERSION = 1;

/** queryMigrations[N] converts a query saved with format version N-1 to version N. */
export const queryMigrations: Record<number, (query: PIWebAPIQuery) => PIWebAPIQuery> = {
  1: migrateLegacySummary,
};

/**
 * Converts a query saved with an earlier format version to the current one. Returns the same query when no
 * conversion changed it, so that opening a panel does not modify the dashboard.
 */
export function migrateQuery(query: PIWebAPIQuery): PIWebAPIQuery {
  let migrated = query;
  for (let version = (query.queryVersion ?? 0) + 1; version <= QUERY_VERSION; version++) {
    migrated = queryMigrations[version](migrated);
  }
  return migrated === query ? query : { ...migrated, queryVersion: QUERY_VERSION };
}

/**
 * Converts the summary settings saved by versions 4.x and 5.0 (issue #194): the summary was enabled by selecting
 * summary types, its duration was `interval`, and `nodata` (Replace Bad Data) was part of the summary. Versions 5.1
 * and 5.2 kept these fields when re-saving the query, with the summary disabled. Returns the query unchanged when
 * it has no legacy fields.
 */
export function migrateLegacySummary(query: PIWebAPIQuery): PIWebAPIQuery {
  const { interval, nodata, ...summary } = (query.summary ?? {}) as PiWebAPISummary & {
    interval?: string;
    nodata?: string;
  };
  if (interval === undefined && nodata === undefined) {
    return query;
  }
  if (interval?.trim() && !summary.duration) {
    summary.duration = interval.trim();
  }
  summary.enable = (summary.types?.length ?? 0) > 0;
  // "Null" is the default the query editor writes when it opens a query, so it does not override the saved value
  const keepNodata = !nodata || (!!query.nodata && query.nodata !== 'Null');
  return { ...query, nodata: keepNodata ? query.nodata : nodata, summary };
}
