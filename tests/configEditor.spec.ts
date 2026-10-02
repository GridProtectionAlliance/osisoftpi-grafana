import { test, expect } from '@grafana/plugin-e2e';
import { PIWebAPIDataSourceJsonData } from '../src/types';

test('smoke: should render config editor', async ({ createDataSourceConfigPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await createDataSourceConfigPage({ type: ds.type });
  await expect(page.getByPlaceholder('https://server.name/piwebapi')).toBeVisible();
  await expect(page.getByText('Authentication', { exact: true })).toBeVisible();
  await expect(page.getByText('Advanced HTTP settings')).toBeVisible();
  await expect(page.getByLabel('Max Cache Time')).toBeVisible();
  await expect(page.getByLabel('AF Server')).toBeVisible();
  await expect(page.getByLabel('AF Database')).toBeVisible();
});

test('should render provisioned settings', async ({ gotoDataSourceConfigPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource<PIWebAPIDataSourceJsonData>({ fileName: 'datasources.yml' });
  await gotoDataSourceConfigPage(ds.uid);
  await expect(page.getByLabel('PI Server')).toHaveValue(ds.jsonData.piserver ?? '');
  await expect(page.getByLabel('AF Server')).toHaveValue(ds.jsonData.afserver ?? '');
  await expect(page.getByLabel('AF Database')).toHaveValue(ds.jsonData.afdatabase ?? '');
});

test('"Save & test" should be successful when the PI Web API endpoint responds', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource<PIWebAPIDataSourceJsonData>({ fileName: 'datasources.yml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  // The backend health check only requires an HTTP 200 from the configured URL, so point it at the
  // Grafana server itself. This proves the backend plugin starts and answers on this Grafana version.
  await page.getByPlaceholder('https://server.name/piwebapi').fill('http://localhost:3000/api/health');
  await page.getByLabel('AF Server').fill(ds.jsonData.afserver ?? '');
  await page.getByLabel('AF Database').fill(ds.jsonData.afdatabase ?? '');
  await expect(configPage.saveAndTest()).toBeOK();
  await expect(configPage).toHaveAlert('success', { hasText: 'Data source is working' });
});

test('"Save & test" should fail when the PI Web API endpoint is unreachable', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByPlaceholder('https://server.name/piwebapi').fill('http://localhost:1/piwebapi');
  await expect(configPage.saveAndTest()).not.toBeOK();
  await expect(configPage).toHaveAlert('error', { hasText: 'request error' });
});
