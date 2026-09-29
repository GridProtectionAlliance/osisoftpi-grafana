import { test, expect } from '@grafana/plugin-e2e';

test('smoke: should render annotations editor', async ({ annotationEditPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await annotationEditPage.datasource.set(ds.name);
  await expect(page.getByText('Database', { exact: true })).toBeVisible();
  await expect(page.getByText('Event Frames', { exact: true })).toBeVisible();
  await expect(page.locator('#annotation-database')).toBeVisible();
  await expect(page.locator('#annotation-event-frames')).toBeVisible();
});
