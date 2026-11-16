import { DataQueryRequest, DataQueryResponse, DataSourceInstanceSettings, ScopedVars } from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime';
import { cloneDeep } from 'lodash';
import { Observable } from 'rxjs';

import { PiWebAPIDatasource } from './datasource';

// @grafana/runtime needs the Grafana app at runtime; only the datasource base class is used here
jest.mock('@grafana/runtime', () => ({
  DataSourceWithBackend: class {
    constructor(public instanceSettings: unknown) {}
    // like DataSourceWithBackend.query: replaces the template variables of each query, then sends the queries
    query(request: any) {
      const { of } = jest.requireActual('rxjs');
      return of({ data: request.targets.map((q: any) => (this as any).applyTemplateVariables(q, request.scopedVars)) });
    }
    // like DataSourceWithBackend.interpolateVariablesInQueries
    interpolateVariablesInQueries(queries: any[], scopedVars: any) {
      return queries.map((q) => (this as any).applyTemplateVariables(q, scopedVars));
    }
  },
  getTemplateSrv: () => undefined,
}));
import { PIWebAPIDataSourceJsonData, PIWebAPIQuery } from './types';

const variables: Record<string, string | string[]> = {
  $interval: '1h',
  $sample: '5m',
  $attr: 'Level',
  $elem: 'T-101',
  $attrs: ['Level', 'Volume'],
  $sites: ['Site A, North', 'Site B'],
  $tags: ['SINUSOID', 'CDT158', 'BA:TEMP.1'],
  $stream: 'true',
  $factor: '2',
  $pump: 'P-101',
  $category: 'Alarms',
};

// formats the variables like Grafana's TemplateSrv: a multi-value variable uses the given format (glob by default)
const templateSrv = {
  replace: (text?: string, _scopedVars?: ScopedVars, format?: string | Function) =>
    (text ?? '').replace(/\$\w+/g, (name) => {
      const value = variables[name];
      if (value === undefined) {
        return name;
      }
      if (typeof format === 'function') {
        return format(value);
      }
      if (!Array.isArray(value)) {
        return value;
      }
      return format === 'csv' ? value.join(',') : '{' + value.join(',') + '}';
    }),
  getVariables: () => [],
  containsTemplate: () => false,
  updateTimeRange: () => {},
} as unknown as TemplateSrv;

function newDatasource(jsonData: Partial<PIWebAPIDataSourceJsonData> = {}) {
  return new PiWebAPIDatasource(
    {
      jsonData,
      uid: 'pi',
      type: 'gridprotectionalliance-osisoftpi-datasource',
    } as unknown as DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>,
    templateSrv
  );
}

/** Runs query() and returns the queries it sends to the backend. */
function sendQueries(targets: PIWebAPIQuery[]): PIWebAPIQuery[] {
  const request = {
    targets,
    scopedVars: {} as ScopedVars,
    range: { from: new Date(0), to: new Date(3600000) },
    maxDataPoints: 100,
  } as unknown as DataQueryRequest<PIWebAPIQuery>;
  let sent: PIWebAPIQuery[] = [];
  (newDatasource().query(request) as Observable<DataQueryResponse>).subscribe((response) => (sent = response.data));
  return sent;
}

function buildQueryParameters(target: PIWebAPIQuery): PIWebAPIQuery {
  return sendQueries([target])[0];
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

  // expressions, Explore opened from a panel and alert rules created from a panel call interpolateVariablesInQueries
  // and not query()
  it('replaces the template variables of every field when called without query()', () => {
    const target = {
      refId: 'A',
      datasource: { type: 'gridprotectionalliance-osisoftpi-datasource', uid: 'pi' },
      target: 'AF\\DB\\$elem;$attrs',
      elementPath: 'AF\\DB\\$elem',
      attributes: [{ label: '$attrs', value: { value: '$attrs' } }],
      segments: [{ label: '$elem', value: { value: '$elem' } }],
      display: '$elem $attr',
      expression: "'$attr'*$factor",
      interpolate: { enable: true, interval: '$sample' },
      enableStreaming: { enable: false, variable: '$stream' },
      summary: {
        enable: true,
        duration: '$interval',
        sampleTypeInterval: true,
        sampleInterval: '$sample',
        types: [{ label: 'Average', value: { value: 'Average' } }],
      },
    } as unknown as PIWebAPIQuery;
    const saved = cloneDeep(target);

    const [query] = newDatasource().interpolateVariablesInQueries([target], {});

    expect(query).toMatchObject({
      refId: 'A',
      datasource: { uid: 'pi' },
      target: 'AF\\DB\\T-101;{Level,Volume}',
      elementPath: 'AF\\DB\\T-101',
      attributes: [{ label: '$attrs', value: { value: '{Level,Volume}' } }],
      segments: [{ label: '$elem', value: { value: 'T-101' } }],
      display: 'T-101 Level',
      expression: "'Level'*2",
      interpolate: { enable: true, interval: '5m' },
      enableStreaming: { enable: true },
      summary: { duration: '1h', sampleInterval: '5m' },
    });
    expect(query.hashCode).not.toBe('');
    expect(query.hashCode).toBe(buildQueryParameters(cloneDeep(saved)).hashCode);
    expect(target).toEqual(saved);
  });

  it('gives different queries on the same path different hash codes', () => {
    const query = (expression: string) =>
      newDatasource().applyTemplateVariables(
        { refId: 'A', target: 'AF\\DB\\E;Level', expression } as unknown as PIWebAPIQuery,
        {}
      );
    expect(query("'Level'*2").hashCode).not.toBe(query("'Level'*3").hashCode);
  });

  // the backend expands the {a,b} groups into one series per value, so the display name must use the same groups
  it('formats a multi-value variable in the display name like in the target', () => {
    const query = buildQueryParameters({
      refId: 'A',
      target: 'AF\\DB\\$sites;Level',
      attributes: [{ label: 'Level', value: { value: 'Level' } }],
      display: '$sites',
    } as unknown as PIWebAPIQuery);
    expect(query.target).toBe('AF\\DB\\{Site A%2C North,Site B};Level');
    expect(query.display).toBe('{Site A%2C North,Site B}');
  });

  it('replaces the template variables of an annotation query', () => {
    const target = {
      refId: 'Anno',
      isAnnotation: true,
      queryType: 'Annotation',
      database: { Name: 'DB', WebId: 'D1' },
      template: { Name: 'Batch', WebId: 'T1' },
      nameFilter: '$pump*',
      categoryName: '$category',
      attribute: { enable: true, name: '$attrs' },
      showEndTime: true,
    } as unknown as PIWebAPIQuery;
    const saved = cloneDeep(target);

    const [query] = sendQueries([target]);

    expect(query).toEqual({
      ...saved,
      target: '',
      nameFilter: 'P-101*',
      categoryName: 'Alarms',
      attribute: { enable: true, name: 'Level,Volume' },
    });
    expect(target).toEqual(saved);
  });
});

describe('PI point search', () => {
  afterAll(() => delete (PiWebAPIDatasource.prototype as any).getResource);
  const points: Record<string, string[]> = {
    'SINUSOID*': ['SINUSOID', 'SINUSOIDU'],
    'CDT158*': ['CDT158'],
    'BA:TEMP.1*': ['BA:TEMP.1'],
    'T-101*': ['T-101.Level', 'T-101.Volume'],
    SINUSOID: ['SINUSOID'],
  };

  function search(pointName: string) {
    const requests: string[] = [];
    (PiWebAPIDatasource.prototype as any).getResource = (path: string) => {
      requests.push(path);
      const nameFilter = new URLSearchParams(path.split('?')[1]).get('nameFilter') ?? '';
      return Promise.resolve({ Items: (points[nameFilter] ?? []).map((name) => ({ Name: name, WebId: name })) });
    };
    const ds = newDatasource();
    return ds
      .metricFindQuery({ type: 'pipoint', webId: 'P1', pointName }, { isPiPoint: true })
      .then((values) => ({ names: values.map((v) => v.text), requests }));
  }

  it('searches the points of each value of a multi-value variable', async () => {
    const { names, requests } = await search('$tags*');
    expect(names).toEqual(['SINUSOID', 'SINUSOIDU', 'CDT158', 'BA:TEMP.1']);
    expect(requests).toEqual([
      '/dataservers/P1/points?maxCount=100&nameFilter=SINUSOID*',
      '/dataservers/P1/points?maxCount=100&nameFilter=CDT158*',
      '/dataservers/P1/points?maxCount=100&nameFilter=BA%3ATEMP.1*',
    ]);
  });

  it('searches single values and names without variables as they are', async () => {
    expect((await search('$elem*')).names).toEqual(['T-101.Level', 'T-101.Volume']);
    expect((await search('SINUSOID')).names).toEqual(['SINUSOID']);
  });
});

describe('constructor', () => {
  afterAll(() => delete (PiWebAPIDatasource.prototype as any).getResource);

  it('only looks up the WebId of the configured PI server, and ignores a failed lookup', async () => {
    const requests: string[] = [];
    (PiWebAPIDatasource.prototype as any).getResource = (path: string) => {
      requests.push(path);
      return Promise.reject(new Error('Not found'));
    };
    const ds = newDatasource({ piserver: 'PISIM', afserver: 'AFSIM', afdatabase: 'TankControlSim' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requests).toEqual(['/dataservers?name=PISIM']);
    expect(ds.piserver.webid).toBeUndefined();
    expect(ds.afserver.name).toBe('AFSIM');
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
