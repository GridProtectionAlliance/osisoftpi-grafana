import React, { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { PIWebAPIQueryEditor } from './QueryEditor';
import { PIWebAPIQuery } from '../types';

// @grafana/runtime needs the Grafana app at runtime; the editor only uses the datasource passed in its props
jest.mock('@grafana/runtime', () => ({
  DataSourceWithBackend: class {},
  getTemplateSrv: () => undefined,
}));

const variables: Record<string, string> = { '${equip}': 'P-101' };

const createDatasource = (overrides: Record<string, unknown> = {}) => ({
  afserver: { name: 'AFSIM' },
  afdatabase: { name: 'TankControlSim' },
  piserver: { name: 'PISIM', webid: 'pisim-id' },
  piPointConfig: true,
  useUnitConfig: false,
  useStreaming: false,
  meta: { info: { version: '6.0.0' } },
  templateSrv: {
    getVariables: () => [{ name: 'equip' }],
    replace: (text?: string) => (text ?? '').replace(/\$\{\w+\}/g, (name) => variables[name] ?? name),
  },
  metricFindQuery: jest.fn((query: any) => {
    if (query.type === 'attributes') {
      // the first value of ${equip} has no Level attribute
      return Promise.resolve([{ Path: '\\\\AFSIM\\TankControlSim\\SimPlant\\U-100\\P-101|Flow', WebId: 'flow' }]);
    }
    if (query.type === 'pipoint') {
      return Promise.resolve([
        { text: 'P-101.Flow', Path: '\\\\PISIM\\P-101.Flow' },
        { text: 'P-101.FlowRate', Path: '\\\\PISIM\\P-101.FlowRate' },
      ]);
    }
    return Promise.resolve([]);
  }),
  ...overrides,
});

const segment = (value: string) => ({ label: value, value: { value, expandable: true } });
const attribute = (value: string) => ({ label: value, value: { value, expandable: false } });

const afQuery = (): PIWebAPIQuery =>
  ({
    refId: 'A',
    target: 'AFSIM\\TankControlSim\\SimPlant\\U-100\\${equip};Level;Flow',
    segments: ['AFSIM', 'TankControlSim', 'SimPlant', 'U-100', '${equip}'].map(segment),
    attributes: [attribute('Level'), attribute('Flow')],
    isPiPoint: false,
  }) as unknown as PIWebAPIQuery;

const piQuery = (): PIWebAPIQuery =>
  ({
    refId: 'A',
    target: 'PISIM;T-101.Level;P-101.Flow',
    segments: [{ label: 'PISIM', value: { value: 'PISIM', webId: 'pisim-id' } }],
    attributes: [attribute('T-101.Level'), attribute('P-101.Flow')],
    isPiPoint: true,
  }) as unknown as PIWebAPIQuery;

/** Runs the pending lookups of the editor. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const renderEditor = async (query: PIWebAPIQuery, datasource = createDatasource(), data?: unknown) => {
  const ref = createRef<PIWebAPIQueryEditor>();
  const onChange = jest.fn();
  const onRunQuery = jest.fn();
  const props = { query, datasource, onChange, onRunQuery, data } as any;
  const result = render(<PIWebAPIQueryEditor ref={ref} {...props} />);
  const rerender = async (newProps: Record<string, unknown>) => {
    result.rerender(<PIWebAPIQueryEditor ref={ref} {...props} {...newProps} />);
    await settle();
  };
  await settle();
  return { ref, onChange, onRunQuery, datasource, rerender };
};

const lastQuery = (onChange: jest.Mock): PIWebAPIQuery => onChange.mock.calls[onChange.mock.calls.length - 1][0];

describe('PIWebAPIQueryEditor', () => {
  describe('opening the editor', () => {
    it('keeps attributes that the first value of an element variable does not have', async () => {
      const { onChange } = await renderEditor(afQuery());

      expect(onChange).toHaveBeenCalled();
      for (const [query] of onChange.mock.calls) {
        expect(query.attributes.map((a: any) => a.value.value)).toEqual(['Level', 'Flow']);
        expect(query.target).toBe('AFSIM\\TankControlSim\\SimPlant\\U-100\\${equip};Level;Flow');
      }
      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByText('Flow')).toBeInTheDocument();
    });

    it('keeps the attributes when the query is rebuilt from the target with the scoped variables', async () => {
      const { onChange, rerender } = await renderEditor(afQuery());
      expect(onChange).toHaveBeenCalled();
      onChange.mockClear();

      await rerender({ data: { state: 'Done', request: { scopedVars: {} } } });

      expect(onChange).toHaveBeenCalled();
      expect(lastQuery(onChange).target).toBe('AFSIM\\TankControlSim\\SimPlant\\U-100\\${equip};Level;Flow');
    });

    it('shows the error of a failed lookup', async () => {
      const datasource = createDatasource({
        metricFindQuery: jest.fn(() => Promise.reject(new Error('Element not found'))),
      });
      await renderEditor(afQuery(), datasource);

      expect(await screen.findByText('Element not found')).toBeInTheDocument();
    });
  });

  describe('typed text', () => {
    it('stores a typed attribute as a segment value', async () => {
      const { ref, onChange } = await renderEditor(afQuery());
      expect(onChange).toHaveBeenCalled();

      // a Segment sends the typed text as a string value
      onChange.mockClear();
      act(() => ref.current!.onAttributeChange({ label: 'Inlet Flow', value: 'Inlet Flow' as any }, 0));
      await settle();

      expect(lastQuery(onChange).target).toBe('AFSIM\\TankControlSim\\SimPlant\\U-100\\${equip};Inlet Flow;Flow');
      expect(lastQuery(onChange).attributes[0].value).toEqual({ type: undefined, value: 'Inlet Flow' });
    });

    it('stores a typed PI point as a segment value', async () => {
      const { ref, onChange } = await renderEditor(piQuery());

      onChange.mockClear();
      act(() => ref.current!.onPiPointChange({ label: 'P-101', value: 'P-101' as any }, 0));
      await settle();

      expect(onChange).toHaveBeenCalled();
      expect(lastQuery(onChange).target).toBe('PISIM;P-101;P-101.Flow');
    });

    it('removes an attribute with the remove option', async () => {
      const { ref, onChange } = await renderEditor(afQuery());
      expect(onChange).toHaveBeenCalled();

      onChange.mockClear();
      act(() => ref.current!.onAttributeChange({ label: '-REMOVE-', value: { value: '-REMOVE-' } }, 0));
      await settle();

      expect(lastQuery(onChange).target).toBe('AFSIM\\TankControlSim\\SimPlant\\U-100\\${equip};Flow');
    });
  });

  describe('PI points', () => {
    it('offers the typed name first and the remove option last', async () => {
      const { ref } = await renderEditor(piQuery());

      const options = await ref.current!.getAttributeSegmentsPI('P-101.Flow');

      expect(options[0].value?.value).toBe('P-101.Flow');
      expect(options[options.length - 1].label).toBe('-REMOVE-');
      expect(options.filter((o) => o.label === 'P-101.Flow')).toHaveLength(1);
    });

    it('offers the remove option first without typed text', async () => {
      const { ref } = await renderEditor(piQuery());

      const options = await ref.current!.getAttributeSegmentsPI('');

      expect(options[0].label).toBe('-REMOVE-');
    });

    it('changes a PI point without a search that can clear the points', async () => {
      const datasource = createDatasource({
        metricFindQuery: jest.fn(() => Promise.reject(new Error('Internal Server Error'))),
      });
      const { ref, onChange } = await renderEditor(piQuery(), datasource);
      datasource.metricFindQuery.mockClear();

      act(() =>
        ref.current!.onPiPointChange(
          { label: 'P-101.DischargePressure', value: { value: 'P-101.DischargePressure' } },
          1
        )
      );
      await settle();

      expect(onChange).toHaveBeenCalled();
      expect(lastQuery(onChange).target).toBe('PISIM;T-101.Level;P-101.DischargePressure');
      expect(datasource.metricFindQuery).not.toHaveBeenCalled();
    });
  });

  describe('Is Pi Point?', () => {
    it('leaves the raw query mode', async () => {
      const query = { ...afQuery(), rawQuery: true, query: afQuery().target };
      const { onChange } = await renderEditor(query);
      expect(onChange).toHaveBeenCalled();
      onChange.mockClear();

      fireEvent.click(screen.getAllByRole('switch')[0]);
      await settle();

      expect(onChange).toHaveBeenCalled();
      expect(lastQuery(onChange)).toMatchObject({
        isPiPoint: true,
        rawQuery: false,
        query: undefined,
        target: 'PISIM;',
      });
    });

    it('switches from the raw query of a PI point query to the visual editor', async () => {
      const query = { ...piQuery(), rawQuery: true, query: 'PISIM;T-101.Level' };
      const { ref, onChange } = await renderEditor(query);
      onChange.mockClear();
      act(() => ref.current!.textEditorChanged());
      await settle();

      expect(onChange).toHaveBeenCalled();
      expect(lastQuery(onChange)).toMatchObject({ rawQuery: false, query: undefined });
    });
  });
});
