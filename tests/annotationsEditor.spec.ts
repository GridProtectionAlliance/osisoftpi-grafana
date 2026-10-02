import { test, expect } from '@grafana/plugin-e2e';

test('smoke: should render annotations editor', async ({ annotationEditPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await annotationEditPage.datasource.set(ds.name);
  await expect(page.getByText('AF Server', { exact: true })).toBeVisible();
  await expect(page.getByText('Database', { exact: true })).toBeVisible();
  await expect(page.getByText('Event Frames', { exact: true })).toBeVisible();
  await expect(page.getByText('Category', { exact: true })).toBeVisible();
  await expect(page.locator('#annotation-event-frames')).toBeVisible();
  await expect(page.locator('#annotation-category')).toBeVisible();
});

test('the AF server and database of the datasource configuration cannot be changed', async ({
  annotationEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await annotationEditPage.datasource.set(ds.name);
  await expect(page.locator('#annotation-af-server')).toHaveValue(ds.jsonData.afserver);
  await expect(page.locator('#annotation-af-server')).toBeDisabled();
  await expect(page.locator('#annotation-database')).toHaveValue(ds.jsonData.afdatabase);
  await expect(page.locator('#annotation-database')).toBeDisabled();
});
