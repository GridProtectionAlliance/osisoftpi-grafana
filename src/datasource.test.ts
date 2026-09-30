import { DataQueryRequest, DataSourceInstanceSettings, ScopedVars } from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime';
import { cloneDeep } from 'lodash';

import { PiWebAPIDatasource } from './datasource';

// @grafana/runtime needs the Grafana app at runtime; only the datasource base class is used here
jest.mock('@grafana/runtime', () => ({
  DataSourceWithBackend: class {
    constructor(public instanceSettings: unknown) {}
  },
  getTemplateSrv: () => undefined,
}));
import { PIWebAPIDataSourceJsonData, PIWebAPIQuery } from './types';

const variables: Record<string, string> = { $interval: '1h', $sample: '5m', $attr: 'Level', $elem: 'T-101' };

const templateSrv = {
  replace: (text?: string) => (text ?? '').replace(/\$\w+/g, (name) => variables[name] ?? name),
  getVariables: () => [],
  containsTemplate: () => false,
  updateTimeRange: () => {},
} as unknown as TemplateSrv;

function buildQueryParameters(target: PIWebAPIQuery): PIWebAPIQuery {
  const ds = new PiWebAPIDatasource(
    {
      jsonData: {},
      uid: 'pi',
      type: 'gridprotectionalliance-osisoftpi-datasource',
    } as unknown as DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>,
    templateSrv
  );
  const request = {
    targets: [target],
    scopedVars: {} as ScopedVars,
    range: { from: new Date(0), to: new Date(3600000) },
    maxDataPoints: 100,
  } as unknown as DataQueryRequest<PIWebAPIQuery>;
  return (ds as any).buildQueryParameters(request).targets[0];
}

describe('buildQueryParameters', () => {
  it('replaces template variables without changing the saved query', () => {
    const target = {
      refId: 'A',
      target: 'AF\\DB\\$elem;$attr',
      elementPath: 'AF\\DB\\$elem',
      attributes: [{ label: '$attr', value: { value: '$attr' } }],
      segments: [{ label: '$elem', value: { value: '$elem' } }],
      summary: {
        enable: true,
        basis: 'TimeWeighted',
        duration: '$interval',
        sampleTypeInterval: true,
        sampleInterval: '$sample',
        types: [{ label: 'Average', value: { value: 'Average' } }],
      },
    } as unknown as PIWebAPIQuery;
    const saved = cloneDeep(target);

    const query = buildQueryParameters(target);

    expect(query.target).toBe('AF\\DB\\T-101;Level');
    expect(query.attributes[0].value?.value).toBe('Level');
    expect(query.segments[0].value?.value).toBe('T-101');
    expect(query.summary?.duration).toBe('1h');
    expect(query.summary?.sampleInterval).toBe('5m');
    expect(target).toEqual(saved);
  });
});

describe('applyTemplateVariables', () => {
  it('removes the leading backslashes of a saved UNC-style target', () => {
    const ds = new PiWebAPIDatasource(
      { jsonData: {}, uid: 'pi' } as unknown as DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>,
      templateSrv
    );
    const query = ds.applyTemplateVariables({ refId: 'A', target: '\\\\AF\\DB\\$elem;$attr' } as PIWebAPIQuery, {});
    expect(query.target).toBe('AF\\DB\\T-101;Level');
  });
});

describe('legacy queries (issue GridProtectionAlliance/osisoftpi-grafana#194)', () => {
  it('sends the summary and bad data replacement of a 4.x query in the current format', () => {
    const target = {
      refId: 'A',
      target: 'AF\\DB\\E;Level',
      attributes: [{ label: 'Level', value: { value: 'Level' } }],
      segments: [],
      summary: {
        types: [{ label: 'Average', value: { value: 'Average', expandable: true } }],
        basis: 'TimeWeighted',
        interval: '$interval',
        nodata: 'Previous',
      },
    } as unknown as PIWebAPIQuery;
    const saved = cloneDeep(target);

    const query = buildQueryParameters(target);

    expect(query.summary).toMatchObject({ enable: true, duration: '1h', basis: 'TimeWeighted' });
    expect(query.summary).not.toHaveProperty('interval');
    expect(query.nodata).toBe('Previous');
    expect(target).toEqual(saved);
  });
});

describe('variableQuery', () => {
  afterAll(() => delete (PiWebAPIDatasource.prototype as any).getResource);
  // PI Web API responses by request path (without the query string)
  const responses: Record<string, unknown> = {
    '/assetservers': { WebId: 'S1', Name: 'AFSIM' },
    '/assetservers/S1/assetdatabases': { Items: [{ Name: 'TankControlSim' }] },
    '/assetdatabases': { WebId: 'D1' },
    '/assetdatabases/D1/elements': { Items: [{ Name: 'P-101' }, { Name: 'T-101' }] },
    '/elements': { WebId: 'E1' },
    '/elements/E1/elements': { Items: [{ Name: 'T-101' }] },
    '/elements/E1/attributes': { Items: [{ Name: 'Level' }] },
    '/dataservers': { WebId: 'P1' },
    '/dataservers/P1/points': { Items: [{ Name: 'PIT-100' }, { Name: 'PIT-200' }] },
  };

  function datasource(jsonData: Partial<PIWebAPIDataSourceJsonData> = {}) {
    const requests: string[] = [];
    (PiWebAPIDatasource.prototype as any).getResource = (path: string) => {
      requests.push(path);
      return Promise.resolve(responses[path.split('?')[0]] ?? {});
    };
    const ds = new PiWebAPIDatasource(
      { jsonData, uid: 'pi' } as unknown as DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>,
      templateSrv
    );
    requests.length = 0; // the constructor looks up the configured servers
    return { ds, requests };
  }

  it('searches the elements of a database with the query options', async () => {
    const { ds, requests } = datasource();
    const values = await ds.metricFindQuery(
      'elements \\\\AFSIM\\TankControlSim nameFilter=P* searchFullHierarchy=true sortOrder=Descending maxCount=5',
      {}
    );
    expect(values.map((v) => v.text)).toEqual(['P-101', 'T-101']);
    expect(requests).toEqual([
      '/assetdatabases?path=%5C%5CAFSIM%5CTankControlSim',
      '/assetdatabases/D1/elements?nameFilter=P*&searchFullHierarchy=true&sortOrder=Descending&maxCount=5',
    ]);
  });

  it('searches the child elements and attributes of an element, with template variables', async () => {
    const { ds, requests } = datasource();
    expect((await ds.metricFindQuery('elements AFSIM\\DB\\$elem templateName=Tank', {})).map((v) => v.text)).toEqual([
      'T-101',
    ]);
    expect((await ds.metricFindQuery('attributes AFSIM\\DB\\$elem nameFilter=$attr', {})).map((v) => v.text)).toEqual([
      'Level',
    ]);
    expect(requests).toEqual([
      '/elements?path=%5C%5CAFSIM%5CDB%5CT-101',
      '/elements/E1/elements?templateName=Tank',
      '/elements?path=%5C%5CAFSIM%5CDB%5CT-101',
      '/elements/E1/attributes?nameFilter=Level',
    ]);
  });

  it('searches PI points on the configured or given PI server', async () => {
    const { ds, requests } = datasource({ piserver: 'PISIM' });
    expect((await ds.metricFindQuery('points PIT-*', {})).map((v) => v.text)).toEqual(['PIT-100', 'PIT-200']);
    await ds.metricFindQuery('points server=OTHER nameFilter=* startIndex=10', {});
    expect(requests).toEqual([
      '/dataservers?name=PISIM',
      '/dataservers/P1/points?nameFilter=PIT-*',
      '/dataservers?name=OTHER',
      '/dataservers/P1/points?nameFilter=*&startIndex=10',
    ]);
  });

  it('uses the configured AF server and database by default', async () => {
    const { ds, requests } = datasource({ afserver: 'AFSIM', afdatabase: 'TankControlSim' });
    expect((await ds.metricFindQuery('databases', {})).map((v) => v.text)).toEqual(['TankControlSim']);
    await ds.metricFindQuery('elements', {});
    expect(requests).toEqual([
      '/assetservers?path=%5C%5CAFSIM',
      '/assetservers/S1/assetdatabases',
      '/assetdatabases?path=%5C%5CAFSIM%5CTankControlSim',
      '/assetdatabases/D1/elements',
    ]);
  });

  it('reports what was not found or is missing', async () => {
    const { ds } = datasource();
    (ds as any).getResource = () => Promise.resolve({});
    await expect(ds.metricFindQuery('attributes AFSIM\\DB\\Missing', {})).rejects.toThrow(
      'Element not found: AFSIM\\DB\\Missing'
    );
    await expect(ds.metricFindQuery('points PIT-*', {})).rejects.toThrow('Set the PI server');
    await expect(ds.metricFindQuery('elements AFSIM', {})).rejects.toThrow('Set the path of a database or element');
  });
});
