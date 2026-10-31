import { DataFrame, DataQueryRequest, DataSourceInstanceSettings, dateTime, StreamingFrameAction } from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime';

import { PiWebAPIDatasource } from './datasource';
import { PIWebAPIDataSourceJsonData, PIWebAPIQuery } from './types';

// @grafana/runtime needs the Grafana app at runtime; only the datasource base class is used here
jest.mock('@grafana/runtime', () => ({
  DataSourceWithBackend: class {
    constructor(public instanceSettings: unknown) {}
  },
  getTemplateSrv: () => undefined,
}));

function streamOptions(to: string, rows: number, maxDataPoints: number) {
  const ds = new PiWebAPIDatasource(
    { jsonData: {}, uid: 'pi' } as unknown as DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>,
    {} as TemplateSrv
  );
  const now = Date.now();
  const request = {
    maxDataPoints,
    range: { from: dateTime(now - 6 * 3600000), to: dateTime(now) },
    rangeRaw: { from: 'now-6h', to },
  } as unknown as DataQueryRequest<PIWebAPIQuery>;
  return ds.streamOptionsProvider(request, { length: rows, fields: [] } as DataFrame);
}

describe('streamOptionsProvider', () => {
  it('keeps every row of the query result in the live buffer', () => {
    // plot queries return more rows than maxDataPoints: the buffer used to keep only the last maxDataPoints rows
    const options = streamOptions('now', 1079, 389);
    expect(options.maxLength).toBeGreaterThanOrEqual(1079 + 389);
    expect(options.action).toBe(StreamingFrameAction.Append);
    expect(options.maxDelta).toBe(6 * 3600000);
  });

  it('keeps room for live values when the result has fewer rows than maxDataPoints', () => {
    expect(streamOptions('now', 10, 500).maxLength).toBe(1000);
  });

  it('does not limit the buffer by time for a range that does not end now', () => {
    expect(streamOptions('now-30m', 10, 100).maxDelta).toBeUndefined();
  });
});
