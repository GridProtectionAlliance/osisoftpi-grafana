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

function getValue(annotation: any, key: string) {
  if (!annotation || !annotation[key]) {
    return;
  }
  return { label: annotation[key].Name, value: annotation[key] };
}

export const PiWebAPIAnnotationsQueryEditor = memo(function PiWebAPIAnnotationQueryEditor(props: Props) {
  const { datasource, annotation, onAnnotationChange } = props;
  const [afWebId, setAfWebId] = useState<string>('');
  const [databases, setDatabases] = useState<Array<SelectableValue<PiwebapiRsp>>>([]);
  const [templates, setTemplates] = useState<Array<SelectableValue<PiwebapiRsp>>>([]);

  // this should never happen, but we want to keep typescript happy
  if (annotation === undefined || onAnnotationChange === undefined) {
    return null;
  }
  
  const getEventFrames = (): Promise<Array<SelectableValue<PiwebapiRsp>>> => {
    if (templates.length > 0) {
      return Promise.resolve(templates);
    }
    return datasource.getEventFrameTemplates(annotation.database?.WebId).then((templ: PiwebapiRsp[]) => {
      const templatesMap: Array<SelectableValue<PiwebapiRsp>> = templ.map((d) => {
        return { label: d.Name, value: d };
      });
      setTemplates(templatesMap);
      return templatesMap;
    });
  }
  
  const getDatabases = (): Promise<Array<SelectableValue<PiwebapiRsp>>> => {
    if (databases.length > 0) {
      return Promise.resolve(databases);
    }
    return datasource.getDatabases(afWebId).then((dbs: PiwebapiRsp[]) => {
      const databasesMap: Array<SelectableValue<PiwebapiRsp>> = dbs.map((d) => {
        return { label: d.Name, value: d };
      });
      setDatabases(databasesMap);
      return databasesMap;
    });
  }

  datasource.getAssetServer(datasource.afserver.name).then((result) => {
    setAfWebId(result.WebId!);
  });

  return (
    <>
      <div className="gf-form-group">
        <InlineFieldRow>
          <InlineField label="Database" labelWidth={LABEL_WIDTH} grow={true}>
            <AsyncSelect
              key={afWebId ?? 'database-key'}
              loadOptions={getDatabases}
              loadingMessage={'Loading'}
              value={getValue(annotation, 'database')}
              onChange={(e) => onAnnotationChange({ ...annotation, database: e.value })}
              defaultOptions
            />
          </InlineField>
          <InlineField label="Event Frames" labelWidth={LABEL_WIDTH} grow={true}>
            <AsyncSelect
              key={getValue(annotation, 'database')?.label ?? 'default-template-key'}
              loadOptions={getEventFrames}
              loadingMessage={'Loading'}
              value={getValue(annotation, 'template')}
              onChange={(e) => onAnnotationChange({ ...annotation, template: e.value })}
              defaultOptions
            />
          </InlineField>
          <InlineField label="Show Start and End Time" labelWidth={LABEL_WIDTH} grow={true}>
            <InlineSwitch
              value={annotation.showEndTime}
              onChange={(e) => onAnnotationChange!({
                ...annotation!,
                regex: { ...annotation.regex, showEndTime: e.currentTarget.checked },
              })}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Category name" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={annotation.query?.categoryName}
              onChange={(e) => onAnnotationChange!({
                ...annotation!,
                query: { ...annotation.query, categoryName: e.currentTarget.value },
              })}
              placeholder='Enter category name'
            />
          </InlineField>
          <InlineField label="Name Filter" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={annotation.query?.nameFilter}
              onChange={(e) => onAnnotationChange!({
                ...annotation!,
                query: { ...annotation.query, nameFilter: e.currentTarget.value },
              })}
              placeholder='Enter name filter'
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Enable Name Regex Replacement" labelWidth={LABEL_WIDTH} grow={false}>
            <InlineSwitch
              value={annotation.regex?.enable}
              onChange={(e) => onAnnotationChange!({
                ...annotation!,
                regex: { ...annotation.regex, enable: e.currentTarget.checked },
              })}
            />
          </InlineField>
          <InlineField label="Name Filter" labelWidth={SMALL_LABEL_WIDTH} grow={false}>
            <Input
              type="text"
              value={annotation.regex?.search}
              onChange={(e) => onAnnotationChange!({
                ...annotation!,
                regex: { ...annotation.regex, search: e.currentTarget.value },
              })}
              placeholder='(.*)'
              width={MIN_INPUT_WIDTH}
            />
          </InlineField>
          <InlineField label="Replace" labelWidth={SMALL_LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={annotation?.regex?.replace}
              onChange={(e) => onAnnotationChange!({
                ...annotation!,
                regex: { ...annotation!.regex, replace: e.currentTarget.value },
              })}
              placeholder='$1'
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Enable Attribute Usage" labelWidth={LABEL_WIDTH} grow={false}>
            <InlineSwitch
              value={annotation.attribute?.enable}
              onChange={(e) => onAnnotationChange!({
                ...annotation!,
                attribute: { ...annotation.attribute, enable: e.currentTarget.checked },
              })}
            />
          </InlineField>
          <InlineField label="Attribute Name" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={annotation.attribute?.name}
              onChange={(e) => onAnnotationChange!({
                ...annotation!,
                attribute: { ...annotation.attribute, name: e.currentTarget.value },
              })}
              placeholder='Enter name'
            />
          </InlineField>
        </InlineFieldRow>
      </div>
    </>
  );
});
