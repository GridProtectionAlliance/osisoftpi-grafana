import { test, expect } from '@grafana/plugin-e2e';

test('plugin logos and screenshots are served by Grafana', async ({ readProvisionedDataSource, request }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  const settings = await request.get(`/api/plugins/${ds.type}/settings`);
  await expect(settings).toBeOK();
  const { info } = await settings.json();

  const assets: string[] = [
    info.logos.small,
    info.logos.large,
    ...(info.screenshots ?? []).map((s: { path: string }) => s.path),
  ];
  expect(assets.length).toBeGreaterThan(2);
  for (const asset of assets) {
    expect(asset, 'asset must point to the plugin img folder').toContain(`public/plugins/${ds.type}/img/`);
    const response = await request.get(new URL(asset, 'http://localhost').pathname);
    expect(response.status(), asset).toBe(200);
    expect(response.headers()['content-type'], asset).toMatch(/^image\//);
  }
});
