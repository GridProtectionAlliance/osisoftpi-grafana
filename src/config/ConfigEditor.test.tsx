import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DataSourceSettings } from '@grafana/data';

// @grafana/plugin-ui needs the Grafana app at runtime; its HTTP and authentication settings are not tested here
jest.mock('@grafana/plugin-ui', () => ({
  AdvancedHttpSettings: () => null,
  Auth: () => null,
  ConnectionSettings: () => null,
  convertLegacyAuthProps: () => ({}),
}));
import { PIWebAPIConfigEditor } from './ConfigEditor';
import { PIWebAPIDataSourceJsonData } from '../types';

function renderEditor(jsonData: PIWebAPIDataSourceJsonData = {}) {
  const onOptionsChange = jest.fn();
  const options = {
    id: 1,
    uid: 'pi',
    name: 'PI',
    type: 'gridprotectionalliance-osisoftpi-datasource',
    access: 'proxy',
    url: 'https://server.name/piwebapi',
    jsonData,
    secureJsonFields: {},
  } as unknown as DataSourceSettings<PIWebAPIDataSourceJsonData, {}>;
  render(<PIWebAPIConfigEditor options={options} onOptionsChange={onOptionsChange} />);
  return onOptionsChange;
}

describe('PIWebAPIConfigEditor', () => {
  // the backend reads the max cache time as a whole number of hours and fails to load the datasource otherwise
  it.each([
    ['1.5', 2],
    ['3', 3],
    ['-2', 0],
    ['', undefined],
  ])('saves the max cache time %p as %p', (value, saved) => {
    const onOptionsChange = renderEditor({ maxCacheTime: 12 });
    fireEvent.change(screen.getByLabelText('Max Cache Time'), { target: { value } });
    expect(onOptionsChange).toHaveBeenCalledTimes(1);
    expect(onOptionsChange.mock.calls[0][0].jsonData.maxCacheTime).toBe(saved);
  });

  it('shows the max cache time as a whole number of hours', () => {
    renderEditor({ maxCacheTime: 12 });
    const input = screen.getByLabelText('Max Cache Time');
    expect(input).toHaveValue(12);
    expect(input).toHaveAttribute('step', '1');
    expect(input).toHaveAttribute('min', '0');
  });
});
