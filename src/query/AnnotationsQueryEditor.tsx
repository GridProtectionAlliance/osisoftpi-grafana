import React, { memo, useEffect, useRef, useState } from 'react';

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

/** Only the fields used by the annotation query are saved. */
const summary = (item: PiwebapiRsp): PiwebapiRsp => ({ WebId: item.WebId, Name: item.Name, Path: item.Path });

/** The AF server of a database path, e.g. `\\AFSERVER\Database` -> `AFSERVER`. */
const serverOfPath = (path?: string) => (path ?? '').replace(/^\\+/, '').split('\\')[0] || undefined;

export const PiWebAPIAnnotationsQueryEditor = memo(function PiWebAPIAnnotationQueryEditor(props: Props) {
  const { query, datasource, annotation, onChange, onRunQuery } = props;

  // AF server and database set in the datasource configuration: pre-selected and cannot be changed
  const configServer = datasource.afserver.name;
  const configDatabase = configServer ? datasource.afdatabase.name : undefined;

  const [server, setServer] = useState<PiwebapiRsp>(query.afServer ?? {});
  // Combobox values must be scalars, so options are keyed by WebId and the full PI Web API object is looked up here.
  const loadedItems = useRef<Record<string, PiwebapiRsp>>({});
  const latestQuery = useRef(query);
  latestQuery.current = query;

  useEffect(() => {
    const serverName = configServer ?? query.afServer?.Name ?? serverOfPath(query.database?.Path);
    if (!serverName) {
      return;
    }
    datasource.getAssetServer(serverName).then((found) => {
      if (!found.WebId) {
        return;
      }
      setServer(found);
      const current = latestQuery.current;
      if (!configDatabase) {
        if (current.afServer?.WebId !== found.WebId) {
          onChange({ ...current, afServer: summary(found) });
        }
        return;
      }
      datasource.getDatabase(configServer + '\\' + configDatabase).then((database) => {
        const sameDatabase = !!database.WebId && current.database?.WebId === database.WebId;
        if (database.WebId && (!sameDatabase || current.afServer?.WebId !== found.WebId)) {
          // a template or category of another database does not apply
          const keep = sameDatabase ? {} : { template: undefined, categoryName: undefined };
          onChange({ ...current, ...keep, afServer: summary(found), database: summary(database) });
        }
      });
    });
    // only when the editor opens: later changes come from the dropdowns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasource]);

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
        return { label: item.Name, value: item.WebId!, description: item.Description };
      });
  };

  const getServers = (filter: string) => datasource.getAssetServers().then((items) => toOptions(items, filter));
  const getDatabases = (filter: string) =>
    datasource.getDatabases(server.WebId ?? '').then((items) => toOptions(items, filter));
  const getEventFrames = (filter: string) =>
    datasource.getEventFrameTemplates(query.database?.WebId ?? '').then((items) => toOptions(items, filter));
  const getCategories = (filter: string): Promise<Array<ComboboxOption<string>>> =>
    datasource
      .getElementCategories(query.database?.WebId ?? '')
      .then((items) => toOptions(items, filter).map((option) => ({ ...option, value: option.label! })));

  const option = (item?: PiwebapiRsp): ComboboxOption<string> | null =>
    item?.WebId ? { label: item.Name, value: item.WebId } : null;

  return (
    <>
      <div className="gf-form-group">
        <InlineFieldRow>
          <InlineField
            label="AF Server"
            labelWidth={LABEL_WIDTH}
            grow={true}
            tooltip={configServer ? 'Set in the datasource configuration.' : undefined}
            // InlineField sets the disabled state of its input
            disabled={!!configServer}
          >
            {configServer ? (
              <Input id="annotation-af-server" value={configServer} />
            ) : (
              <Combobox
                id="annotation-af-server"
                options={getServers}
                value={option(server)}
                placeholder="Select AF server"
                onChange={(selected) => {
                  const item = loadedItems.current[selected.value];
                  setServer(item);
                  onChange({
                    ...query,
                    afServer: summary(item),
                    database: undefined,
                    template: undefined,
                    categoryName: undefined,
                  });
                }}
              />
            )}
          </InlineField>
          <InlineField
            label="Database"
            labelWidth={LABEL_WIDTH}
            grow={true}
            tooltip={configDatabase ? 'Set in the datasource configuration.' : undefined}
            disabled={!!configDatabase || !server.WebId}
          >
            {configDatabase ? (
              <Input id="annotation-database" value={configDatabase} />
            ) : (
              <Combobox
                key={server.WebId ?? 'database-key'}
                id="annotation-database"
                options={getDatabases}
                value={option(query.database)}
                placeholder="Select database"
                onChange={(selected) => {
                  const item = loadedItems.current[selected.value];
                  onChange({ ...query, database: summary(item), template: undefined, categoryName: undefined });
                }}
              />
            )}
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Event Frames" labelWidth={LABEL_WIDTH} grow={true} disabled={!query.database?.WebId}>
            <Combobox
              key={query.database?.WebId ?? 'default-template-key'}
              id="annotation-event-frames"
              options={getEventFrames}
              value={option(query.template)}
              placeholder="Select event frame template"
              onChange={(selected) => onChange({ ...query, template: summary(loadedItems.current[selected.value]) })}
            />
          </InlineField>
          <InlineField
            label="Category"
            labelWidth={LABEL_WIDTH}
            grow={true}
            tooltip="Only event frames with this category. Categories of event frames are element categories of the database."
            disabled={!query.database?.WebId}
          >
            <Combobox
              key={query.database?.WebId ?? 'default-category-key'}
              id="annotation-category"
              options={getCategories}
              value={query.categoryName ? { label: query.categoryName, value: query.categoryName } : null}
              placeholder="Any category"
              isClearable
              createCustomValue
              onChange={(selected) => {
                onChange({ ...query, categoryName: selected?.value ?? '' });
                onRunQuery();
              }}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Name Filter" labelWidth={LABEL_WIDTH} grow={true}>
            <Input
              type="text"
              value={query.nameFilter}
              onBlur={() => onRunQuery()}
              onChange={(e) => onChange({ ...query, nameFilter: e.currentTarget.value })}
              placeholder="Enter name filter, e.g. *Trip*"
            />
          </InlineField>
          <InlineField label="Show Start and End Time" labelWidth={LABEL_WIDTH}>
            <InlineSwitch
              value={!!query.showEndTime}
              onChange={(e) => onChange({ ...query, showEndTime: e.currentTarget.checked })}
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
          <InlineField label="Search" labelWidth={SMALL_LABEL_WIDTH} grow={false}>
            <Input
              type="text"
              value={query.regex?.search}
              onBlur={() => onRunQuery()}
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
              onBlur={() => onRunQuery()}
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
              onBlur={() => onRunQuery()}
              onChange={(e) =>
                onChange({
                  ...query!,
                  attribute: { ...query.attribute, name: e.currentTarget.value },
                })
              }
              placeholder="Enter names, separated by commas"
            />
          </InlineField>
        </InlineFieldRow>
      </div>
    </>
  );
});
