import { DataQueryRequest, DataSourceInstanceSettings } from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { PiWebAPIDatasource } from './datasource';
import { PIWebAPIDataSourceJsonData, PIWebAPIVariableQuery } from './types';

// @grafana/runtime needs the Grafana app at runtime; only the datasource base class is used here
jest.mock('@grafana/runtime', () => ({
  DataSourceWithBackend: class {
    constructor(public instanceSettings: unknown) {}
  },
  getTemplateSrv: () => undefined,
}));

const templateSrv = {
  replace: (text?: string) => (text ?? '').replace(/\$unit/g, 'U-100'),
} as unknown as TemplateSrv;

// PI Web API responses by request path (without the query string)
const responses: Record<string, unknown> = {
  '/assetservers': { Items: [{ Name: 'AFSIM', WebId: 'S1' }] },
  '/assetdatabases': { WebId: 'D1' },
  '/assetdatabases/D1/elements': { Items: [{ Name: 'SimPlant' }] },
  '/elements': { WebId: 'E1' },
  '/elements/E1/elements': { Items: [{ Name: 'LIC-101' }, { Name: 'T-101' }] },
  '/elements/E1/attributes': { Items: [{ Name: 'Level' }] },
  '/dataservers': { Items: [{ Name: 'PISIM' }] },
};

function setup() {
  const requests: string[] = [];
  (PiWebAPIDatasource.prototype as any).getResource = (path: string) => {
    requests.push(path);
    return Promise.resolve(responses[path.split('?')[0]] ?? {});
  };
  const ds = new PiWebAPIDatasource(
    { jsonData: {}, uid: 'pi' } as unknown as DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>,
    templateSrv
  );
  const run = async (query: PIWebAPIVariableQuery | string) => {
    requests.length = 0;
    const request = { targets: [query], scopedVars: {} } as unknown as DataQueryRequest<PIWebAPIVariableQuery>;
    const response = await lastValueFrom((ds.variables as any).query(request));
    return (response as any).data.map((v: { text: string }) => v.text);
  };
  return { run, requests };
}

afterAll(() => delete (PiWebAPIDatasource.prototype as any).getResource);

// Dashboards saved before 6.0 store the variable query as a JSON string; after editing it in the new editor, the
// same text is saved in the `query` field of an object.
describe('variable queries saved before 6.0', () => {
  it.each([
    ['string', (json: string) => json],
    ['object', (json: string) => ({ refId: 'A', query: json })],
  ])('keep working when saved as a %s', async (_, saved) => {
    const { run, requests } = setup();

    expect(await run(saved('{"path": ""}'))).toEqual(['AFSIM']);

    expect(await run(saved('{"path": "AFSIM\\\\TankControlSim"}'))).toEqual(['SimPlant']);
    expect(requests[0]).toBe('/assetdatabases?path=%5C%5CAFSIM%5CTankControlSim');

    expect(await run(saved('{"path": "AFSIM\\\\TankControlSim\\\\SimPlant\\\\$unit"}'))).toEqual(['LIC-101', 'T-101']);
    expect(requests).toEqual([
      '/elements?path=%5C%5CAFSIM%5CTankControlSim%5CSimPlant%5CU-100',
      expect.stringMatching(/^\/elements\/E1\/elements\?.*nameFilter=\*/),
    ]);

    await run(saved('{"path": "AFSIM\\\\TankControlSim\\\\SimPlant\\\\U-100", "filter": "L*"}'));
    expect(requests[1]).toMatch(/nameFilter=L\*/);

    expect(
      await run(saved('{"path": "AFSIM\\\\TankControlSim\\\\SimPlant\\\\U-100", "type": "attributes", "max": 50}'))
    ).toEqual(['Level']);
    expect(requests[1]).toMatch(/^\/elements\/E1\/attributes\?.*maxCount=50/);
  });

  it('runs queries of the query language saved as a string or an object', async () => {
    const { run } = setup();
    expect(await run('elements AFSIM\\TankControlSim\\SimPlant\\$unit')).toEqual(['LIC-101', 'T-101']);
    expect(await run({ refId: 'A', query: 'dataservers' })).toEqual(['PISIM']);
  });
});
