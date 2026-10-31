import { test, expect } from '@grafana/plugin-e2e';

test('smoke: should render query editor', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  const row = panelEditPage.getQueryEditorRow('A');
  await expect(row.getByText('AF Elements')).toBeVisible();
  await expect(row.getByText('Attributes')).toBeVisible();
  await expect(row.getByText('AFSERVER')).toBeVisible();
  await expect(row.getByText('AFDATABASE')).toBeVisible();
});

test('should switch to PI point mode', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  const row = panelEditPage.getQueryEditorRow('A');
  await expect(row.getByText('AF Elements')).toBeVisible();
  // The switch has no accessible name before Grafana 13, so locate it next to its label.
  const piPointSwitch = row.getByText('Is Pi Point?').locator('..').getByRole('switch');
  await piPointSwitch.click({ force: true });
  await expect(piPointSwitch).toBeChecked();
  await expect(row.getByText('PI Server', { exact: true })).toBeVisible();
  await expect(row.getByText('AF Elements')).toHaveCount(0);
});
