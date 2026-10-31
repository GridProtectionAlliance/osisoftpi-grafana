import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { PiWebAPIAnnotationsQueryEditor } from './AnnotationsQueryEditor';
import { PIWebAPIQuery } from '../types';

// @grafana/runtime needs the Grafana app at runtime; the editor only uses the datasource passed in its props
jest.mock('@grafana/runtime', () => ({
  DataSourceWithBackend: class {},
  getTemplateSrv: () => undefined,
}));

const afServer = { WebId: 'server-id', Name: 'AFSIM', Path: '\\\\AFSIM' };
const mainDb = { WebId: 'main-id', Name: 'MainDB', Path: '\\\\AFSIM\\MainDB' };
const otherDb = { WebId: 'other-id', Name: 'OtherDB', Path: '\\\\AFSIM\\OtherDB' };

const createDatasource = () => ({
  afserver: { name: 'AFSIM' },
  afdatabase: { name: 'MainDB' },
  getAssetServer: jest.fn(() => Promise.resolve(afServer)),
  getAssetServers: jest.fn(() => Promise.resolve([afServer])),
  getDatabase: jest.fn(() => Promise.resolve(mainDb)),
  getDatabases: jest.fn(() => Promise.resolve([mainDb, otherDb])),
  getEventFrameTemplates: jest.fn(() => Promise.resolve([])),
  getElementCategories: jest.fn(() => Promise.resolve([])),
});

// Combobox measures its text on a canvas, which jsdom does not provide
HTMLCanvasElement.prototype.getContext = (() => ({ measureText: () => ({ width: 10 }) })) as any;

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const renderEditor = async (query: Partial<PIWebAPIQuery>) => {
  const onChange = jest.fn();
  const fullQuery = { refId: 'Anno', ...query } as PIWebAPIQuery;
  const props = {
    query: fullQuery,
    datasource: createDatasource(),
    annotation: { name: 'Events', enable: true, iconColor: 'red', target: fullQuery },
    onChange,
    onRunQuery: jest.fn(),
  } as any;
  render(<PiWebAPIAnnotationsQueryEditor {...props} />);
  await settle();
  return { onChange };
};

describe('PiWebAPIAnnotationsQueryEditor with a configured AF server and database', () => {
  it('pre-selects the configured database for an annotation without a database', async () => {
    const { onChange } = await renderEditor({});

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ afServer: afServer, database: mainDb }));
    expect(screen.getByDisplayValue('MainDB')).toBeDisabled();
    expect(screen.queryByText('Use configured database')).not.toBeInTheDocument();
  });

  it('keeps the configured database that is saved', async () => {
    const template = { WebId: 'template-id', Name: 'Pump Trip' };
    const { onChange } = await renderEditor({ afServer, database: mainDb, template, categoryName: 'Disturbance' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('MainDB')).toBeDisabled();
  });

  it('keeps another saved database with its template and category', async () => {
    const template = { WebId: 'template-id', Name: 'Pump Trip' };
    const { onChange } = await renderEditor({ afServer, database: otherDb, template, categoryName: 'Disturbance' });

    expect(onChange).not.toHaveBeenCalled();
    // the database used by the query is shown, and it can be changed
    const database = document.getElementById('annotation-database') as HTMLInputElement;
    expect(database).toHaveValue('OtherDB');
    expect(database).toBeEnabled();
    expect(document.getElementById('annotation-af-server')).toHaveValue('AFSIM');
    expect(screen.getByDisplayValue('Pump Trip')).toBeInTheDocument();
  });

  it('switches another saved database to the configured database', async () => {
    const template = { WebId: 'template-id', Name: 'Pump Trip' };
    const { onChange } = await renderEditor({ afServer, database: otherDb, template, categoryName: 'Disturbance' });

    fireEvent.click(screen.getByText('Use configured database'));
    await settle();

    expect(onChange).toHaveBeenCalledTimes(1);
    const query = onChange.mock.calls[0][0];
    expect(query).toMatchObject({ afServer, database: mainDb, template: undefined, categoryName: undefined });
  });
});
