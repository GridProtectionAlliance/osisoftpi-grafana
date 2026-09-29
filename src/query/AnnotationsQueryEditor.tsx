import React, { memo, useRef, useState } from 'react';

import { AnnotationQuery, QueryEditorProps } from '@grafana/data';
import { Combobox, ComboboxOption, InlineField, InlineFieldRow, InlineSwitch, Input } from '@grafana/ui';

import { PiWebAPIDatasource } from 'datasource';
import { PIWebAPIDataSourceJsonData, PIWebAPIQuery, PiwebapiRsp } from 'types';

const SMALL_LABEL_WIDTH = 20;
const LABEL_WIDTH = 30;
const MIN_INPUT_WIDTH = 50;

type PiWebAPIQueryEditorProps = QueryEditorProps<PiWebAPIDatasource, PIWebAPIQuery, PIWebAPIDataSourceJsonData>;

type Props = PiWebAPIQueryEditorProps & {
  annotation?: AnnotationQuery<PIWebAPIQuery>;
  onAnnotationChange?: (annotation: AnnotationQuery<PIWebAPIQuery>) => void;
};

export const PiWebAPIAnnotationsQueryEditor = memo(function PiWebAPIAnnotationQueryEditor(props: Props) {
  const { query, datasource, annotation, onChange, onRunQuery } = props;

  const [afWebId, setAfWebId] = useState<string>('');
  const [database, setDatabase] = useState<PiwebapiRsp>(annotation?.target?.database ?? {});
  // Combobox values must be scalars, so options are keyed by WebId and the full PI Web API object is looked up here.
  const loadedItems = useRef<Record<string, PiwebapiRsp>>({});

  // this should never happen, but we want to keep typescript happy
  if (annotation === undefined) {
    return null;
  }

  const toOptions = (items: PiwebapiRsp[], filter: string): Array<ComboboxOption<string>> => {
    const search = filter.toLowerCase();
    return items
      .filter((item) => !!item.WebId && (item.Name ?? '').toLowerCase().includes(search))
      .map((item) => {
        loadedItems.current[item.WebId!] = item;
        return { label: item.Name, value: item.WebId! };
      });
  };

  const getEventFrames = (filter: string): Promise<Array<ComboboxOption<string>>> => {
    return datasource.getEventFrameTemplates(database?.WebId!).then((templ: PiwebapiRsp[]) => toOptions(templ, filter));
  };

  const getDatabases = (filter: string): Promise<Array<ComboboxOption<string>>> => {
    return datasource.getDatabases(afWebId).then((dbs: PiwebapiRsp[]) => toOptions(dbs, filter));
  };

  const getValue = (key: 'database' | 'template'): ComboboxOption<string> | null => {
    const item = annotation.target?.[key];
    if (!item?.WebId) {
      return null;
    }
    return { label: item.Name, value: item.WebId };
  };

  datasource.getAssetServer(datasource.afserver.name).then((result) => {
    setAfWebId(result.WebId!);
  });

  return (
    <>
      <div className="gf-form-group">
        <InlineFieldRow>
          <InlineField label="Database" labelWidth={LABEL_WIDTH} grow={true}>
            <Combobox
              key={afWebId ?? 'database-key'}
              id="annotation-database"
              options={getDatabases}
              value={getValue('database')}
              onChange={(option) => {
                const selected = loadedItems.current[option.value];
                setDatabase(selected);
                onChange({ ...query, database: selected, template: undefined });
              }}
            />
          </InlineField>
          <InlineField label="Event Frames" labelWidth={LABEL_WIDTH} grow={true}>
            <Combobox
              key={database?.WebId ?? 'default-template-key'}
              id="annotation-event-frames"
              options={getEventFrames}
              value={getValue('template')}
              onChange={(option) => onChange({ ...query, template: loadedItems.current[option.value] })}
            />
          </InlineField>
          <InlineField label="Show Start and End Time" labelWidth={LABEL_WIDTH} grow={true}>
            <InlineSwitch
              value={!!query.showEndTime}
              onChange={(e) => onChange({ ...query, showEndTime: e.currentTarget.checked })}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Category name" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={query.categoryName}
              onBlur={(e) => onRunQuery()}
              onChange={(e) => onChange({ ...query, categoryName: e.currentTarget.value })}
              placeholder="Enter category name"
            />
          </InlineField>
          <InlineField label="Name Filter" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={query.nameFilter}
              onBlur={(e) => onRunQuery()}
              onChange={(e) => onChange({ ...query, nameFilter: e.currentTarget.value })}
              placeholder="Enter name filter"
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Enable Name Regex Replacement" labelWidth={LABEL_WIDTH} grow={false}>
            <InlineSwitch
              value={query.regex?.enable}
              onChange={(e) =>
                onChange({
                  ...query,
                  regex: { ...query.regex, enable: e.currentTarget.checked },
                })
              }
            />
          </InlineField>
          <InlineField label="Name Filter" labelWidth={SMALL_LABEL_WIDTH} grow={false}>
            <Input
              type="text"
              value={query.regex?.search}
              onBlur={(e) => onRunQuery()}
              onChange={(e) =>
                onChange({
                  ...query,
                  regex: { ...query.regex, search: e.currentTarget.value },
                })
              }
              placeholder="(.*)"
              width={MIN_INPUT_WIDTH}
            />
          </InlineField>
          <InlineField label="Replace" labelWidth={SMALL_LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={query?.regex?.replace}
              onBlur={(e) => onRunQuery()}
              onChange={(e) =>
                onChange({
                  ...query,
                  regex: { ...query.regex, replace: e.currentTarget.value },
                })
              }
              placeholder="$1"
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Enable Attribute Usage" labelWidth={LABEL_WIDTH} grow={false}>
            <InlineSwitch
              value={query.attribute?.enable}
              onChange={(e) =>
                onChange({
                  ...query!,
                  attribute: { ...query.attribute, enable: e.currentTarget.checked },
                })
              }
            />
          </InlineField>
          <InlineField label="Attribute Name" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={query.attribute?.name}
              onBlur={(e) => onRunQuery()}
              onChange={(e) =>
                onChange({
                  ...query!,
                  attribute: { ...query.attribute, name: e.currentTarget.value },
                })
              }
              placeholder="Enter name"
            />
          </InlineField>
        </InlineFieldRow>
      </div>
    </>
  );
});
