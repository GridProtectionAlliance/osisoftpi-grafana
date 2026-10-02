import { test, expect } from '@grafana/plugin-e2e';

test('variable editor validates the query language', async ({ variableEditPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(ds.name);
  const query = page.getByLabel('Variable query');
  await expect(query).toBeVisible();
  await expect(page.getByText('Options (PI Web API query parameters)')).toBeVisible();

  await query.fill('elements AFSERVER\\AFDATABASE sortOrder=up');
  await expect(page.getByText('sortOrder must be Ascending or Descending')).toBeVisible();
  await query.fill('elements AFSERVER\\AFDATABASE sortOrder=Descending');
  await expect(page.getByText('sortOrder must be Ascending or Descending')).toHaveCount(0);
});
