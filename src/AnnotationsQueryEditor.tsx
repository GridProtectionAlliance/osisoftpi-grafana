  import React, { memo, useState } from 'react';

import { AnnotationQuery, QueryEditorProps, SelectableValue } from '@grafana/data';
import { AsyncSelect, InlineField, InlineFieldRow, InlineSwitch, Input } from '@grafana/ui';

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
  const { query, datasource, annotation, onAnnotationChange, onChange, onRunQuery } = props;

  // this should never happen, but we want to keep typescript happy
  if (annotation === undefined || onAnnotationChange === undefined) {
    return null;
  }
  
  const [afWebId, setAfWebId] = useState<string>('');
  const [database, setDatabase] = useState<PiwebapiRsp>(annotation.target?.database ?? {});

  const getEventFrames = (): Promise<Array<SelectableValue<PiwebapiRsp>>> => {
    console.log('get event frames', database);
    return datasource.getEventFrameTemplates(database?.WebId!).then((templ: PiwebapiRsp[]) => {
      const templatesMap: Array<SelectableValue<PiwebapiRsp>> = templ.map((d) => {
        return { label: d.Name, value: d };
      });
      return templatesMap;
    });
  }
  
  const getDatabases = (): Promise<Array<SelectableValue<PiwebapiRsp>>> => {
    console.log('get databases', afWebId);
    return datasource.getDatabases(afWebId).then((dbs: PiwebapiRsp[]) => {
      const databasesMap: Array<SelectableValue<PiwebapiRsp>> = dbs.map((d) => {
        return { label: d.Name, value: d };
      });
      return databasesMap;
    });
  }

  datasource.getAssetServer(datasource.afserver.name).then((result) => {
    setAfWebId(result.WebId!);
  });

  const getValue = (key: string) => {
    const query: any = annotation.target as any;
    if (!query || !query[key]) {
      return;
    }
    return { label: query[key].Name, value: query[key] };
  }

  const onChangeQuery = (query: PIWebAPIQuery) => {
    onChange(query);
  };

  return (
    <>
      <div className="gf-form-group">
        <InlineFieldRow>
          <InlineField label="Database" labelWidth={LABEL_WIDTH} grow={true}>
            <AsyncSelect
              key={afWebId ?? 'database-key'}
              loadOptions={getDatabases}
              loadingMessage={'Loading'}
              value={getValue('database')}
              onChange={(e) => {
                setDatabase(e.value);
                onChange({ ...query, database: e.value, template: undefined });
              }}
              defaultOptions
            />
          </InlineField>
          <InlineField label="Event Frames" labelWidth={LABEL_WIDTH} grow={true}>
            <AsyncSelect
              key={database?.WebId ?? 'default-template-key'}
              loadOptions={getEventFrames}
              loadingMessage={'Loading'}
              value={getValue('template')}
              onChange={(e) => onChangeQuery({ ...query, template: e.value })}
              defaultOptions
            />
          </InlineField>
          <InlineField label="Show Start and End Time" labelWidth={LABEL_WIDTH} grow={true}>
            <InlineSwitch
              value={!!query.showEndTime}
              onChange={(e) => onChange({
                ...query,
                showEndTime: e.currentTarget.checked,
              })}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Category name" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={query.categoryName}
              onBlur={(e) => onRunQuery()}
              onChange={(e) => onChange({
                ...query,
                categoryName: e.currentTarget.value ,
              })}
              placeholder='Enter category name'
            />
          </InlineField>
          <InlineField label="Name Filter" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={query.nameFilter}
              onBlur={(e) => onRunQuery()}
              onChange={(e) => onChange({
                ...query,
                nameFilter: e.currentTarget.value,
              })}
              placeholder='Enter name filter'
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Enable Name Regex Replacement" labelWidth={LABEL_WIDTH} grow={false}>
            <InlineSwitch
              value={query.regex?.enable}
              onChange={(e) => onChange({
                ...query,
                regex: { ...query.regex, enable: e.currentTarget.checked },
              })}
            />
          </InlineField>
          <InlineField label="Name Filter" labelWidth={SMALL_LABEL_WIDTH} grow={false}>
            <Input
              type="text"
              value={query.regex?.search}
              onBlur={(e) => onRunQuery()}
              onChange={(e) => onChange({
                ...query,
                regex: { ...query.regex, search: e.currentTarget.value },
              })}
              placeholder='(.*)'
              width={MIN_INPUT_WIDTH}
            />
          </InlineField>
          <InlineField label="Replace" labelWidth={SMALL_LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={query?.regex?.replace}
              onBlur={(e) => onRunQuery()}
              onChange={(e) => onChange({
                ...query,
                regex: { ...query.regex, replace: e.currentTarget.value },
              })}
              placeholder='$1'
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Enable Attribute Usage" labelWidth={LABEL_WIDTH} grow={false}>
            <InlineSwitch
              value={query.attribute?.enable}
              onChange={(e) => onChange({
                ...query!,
                attribute: { ...query.attribute, enable: e.currentTarget.checked },
              })}
            />
          </InlineField>
          <InlineField label="Attribute Name" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={query.attribute?.name}
              onBlur={(e) => onRunQuery()}
              onChange={(e) => onChange({
                ...query!,
                attribute: { ...query.attribute, name: e.currentTarget.value },
              })}
              placeholder='Enter name'
            />
          </InlineField>
        </InlineFieldRow>
      </div>
    </>
  );
});
