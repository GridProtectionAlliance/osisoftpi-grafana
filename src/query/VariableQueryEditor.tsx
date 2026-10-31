import React, { useState } from 'react';

import { GrafanaTheme2, QueryEditorProps } from '@grafana/data';
import { Field, TextArea, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import type { PiWebAPIDatasource } from 'datasource';
import { PIWebAPIDataSourceJsonData, PIWebAPIQuery, PIWebAPIVariableQuery } from 'types';
import { isVariableQueryLanguage, parseVariableQuery, VARIABLE_QUERY_OPTIONS } from 'variableQuery';

type Props = QueryEditorProps<PiWebAPIDatasource, PIWebAPIQuery, PIWebAPIDataSourceJsonData, PIWebAPIVariableQuery>;

/** The text of a variable query: dashboards saved before 6.0 store it as a string (JSON or text). */
export function variableQueryText(query: PIWebAPIVariableQuery | string | undefined): string {
  if (typeof query === 'string') {
    return query;
  }
  return query?.query ?? '';
}

const EXAMPLES: Array<[string, string]> = [
  ['points PIT-*', 'PI points of the PI server set in the datasource whose name starts with PIT-'],
  ['points server=PISRV nameFilter=*.PV maxCount=100', 'PI points of another PI server'],
  ['elements AFSERVER\\Database', 'root elements of a database'],
  [
    'elements AFSERVER\\Database\\Plant searchFullHierarchy=true templateName=Pump sortOrder=Descending',
    'all elements below Plant created from the Pump template, sorted by name from Z to A',
  ],
  ['elements AFSERVER\\Database categoryName="Rotating Equipment" nameFilter=P-*', 'root elements with a category'],
  ['elements AFSERVER\\Database\\$site startIndex=0 maxCount=20', 'the first 20 child elements of the selected site'],
  ['attributes AFSERVER\\Database\\Plant\\T-101 valueType=Double', 'attributes of an element with a value type'],
  ['databases AFSERVER', 'databases of an AF server'],
  ['servers', 'AF servers (dataservers: PI servers)'],
];

const TARGETS: Record<string, string> = {
  points: '[name filter]',
  elements: '[AF server\\database[\\element...]]',
  attributes: '<AF server\\database\\element...>',
  databases: '[AF server]',
};

export function PiWebAPIVariableQueryEditor({ query, onChange }: Props) {
  const styles = useStyles2(getStyles);
  const [value, setValue] = useState<string>(variableQueryText(query));

  let error: string | undefined;
  if (isVariableQueryLanguage(value)) {
    try {
      parseVariableQuery(value);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div className={styles.editor}>
      <Field
        label="Query"
        description='<type> [target] [option=value ...]. Quote values with spaces ("Rotating Equipment"). Template variables can be used.'
        invalid={!!error}
        error={error}
      >
        <TextArea
          aria-label="Variable query"
          rows={2}
          value={value}
          placeholder="elements AFSERVER\Database\Element nameFilter=*"
          onChange={(e) => setValue(e.currentTarget.value)}
          onBlur={() => onChange({ ...(typeof query === 'string' ? {} : query), refId: 'A', query: value.trim() })}
        />
      </Field>

      <div className={styles.help}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Target</th>
              <th>Options (PI Web API query parameters)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(VARIABLE_QUERY_OPTIONS).map(([type, options]) => (
              <tr key={type}>
                <td>
                  <code>{type}</code>
                </td>
                <td className={styles.nowrap}>{TARGETS[type] ?? ''}</td>
                <td>{options.join(', ') || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.examples}>Examples</div>
        <ul className={styles.list}>
          {EXAMPLES.map(([example, description]) => (
            <li key={example}>
              <code>{example}</code> {description}
            </li>
          ))}
        </ul>
        <div>
          Without a target, <code>elements</code> and <code>databases</code> use the AF server and database, and{' '}
          <code>points</code> the PI server, set in the datasource. Queries saved as JSON (
          <code>{'{"path": "AFSERVER\\\\Database\\\\Element"}'}</code>) keep working.
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  editor: css({ maxWidth: 1000 }),
  help: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    marginBottom: theme.spacing(2),
  }),
  table: css({
    marginBottom: theme.spacing(1),
    'th, td': { padding: theme.spacing(0.25, 1, 0.25, 0), verticalAlign: 'top', textAlign: 'left' },
  }),
  nowrap: css({ whiteSpace: 'nowrap' }),
  examples: css({ fontWeight: theme.typography.fontWeightMedium }),
  list: css({ paddingLeft: theme.spacing(2), marginBottom: theme.spacing(1) }),
});
