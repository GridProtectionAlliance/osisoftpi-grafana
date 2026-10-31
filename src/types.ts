import { DataQuery } from '@grafana/schema';
import { DataSourceJsonData, SelectableValue } from '@grafana/data';

export interface PiwebapiRsp {
  Name?: string;
  InstanceType?: string;
  Items?: PiwebapiRsp[];
  WebId?: string;
  HasChildren?: boolean;
  Type?: string;
  DefaultUnitsName?: string;
  Description?: string;
  Path?: string;
}

export interface PiDataServer {
  name: string | undefined;
  webid: string | undefined;
}

export interface PIWebAPISelectableValue {
  webId?: string;
  value?: string;
  type?: string;
  expandable?: boolean;
}

export interface PiWebAPIEnable {
  enable: boolean;
}

export interface PiWebAPIRegex extends PiWebAPIEnable {
  search?: string;
  replace?: string
}

export interface PiWebAPIRecordedValue extends PiWebAPIEnable {
  maxNumber?: number;
  boundaryType?: string;
}

export interface PiWebAPIInterpolate extends PiWebAPIEnable {
  interval?: string;
}

export interface PiWebAPISummary extends PiWebAPIEnable {
  types?: Array<SelectableValue<PIWebAPISelectableValue>>;
  basis?: string,
  duration?: string,
  sampleTypeInterval?: boolean,
  sampleInterval?: string
}

export interface PIWebAPIQuery extends DataQuery {
  target: string;
  attributes: Array<SelectableValue<PIWebAPISelectableValue>>;
  segments: Array<SelectableValue<PIWebAPISelectableValue>>;
  useUnit: PiWebAPIEnable;
  regex: PiWebAPIRegex;
  interpolate: PiWebAPIInterpolate;
  recordedValues: PiWebAPIRecordedValue;
  useLastValue: PiWebAPIEnable;
  summary: PiWebAPISummary;
  digitalStates: PiWebAPIEnable;
  isPiPoint: boolean;
  elementPath?: string;
  hideError?: boolean;
  isAnnotation?: boolean;
  display?: any;
  nodata?: string,
  enableStreaming?: any;
  expression?: string;
  rawQuery?: boolean;
  query?: string;
  // annotations items
  // annotations: AF server, database and event frame template
  afServer?: PiwebapiRsp;
  database?: PiwebapiRsp;
  template?: PiwebapiRsp;
  showEndTime?: boolean;
  attribute?: any;
  nameFilter?: string;
  categoryName?: string;
  hashCode?: string;
  // format version of the saved query (see QUERY_VERSION); missing in queries saved before 6.0
  queryVersion?: number;
  // version of the plugin that last saved the query, for information only
  pluginVersion?: string;
}

export const defaultQuery: Partial<PIWebAPIQuery> = {
  target: ';',
  attributes: [],
  segments: [],
  regex: { enable: false },
  nodata: 'Null',
  summary: {
    enable: false,
    types: [],
    basis: 'EventWeighted',
    duration: '',
    sampleTypeInterval: false,
    sampleInterval: ''
  },
  expression: '',
  interpolate: { enable: false },
  useLastValue: { enable: false },
  recordedValues: { enable: false, boundaryType: 'Inside' },
  digitalStates: { enable: false },
  enableStreaming: { enable: false, variable: '' },
  useUnit: { enable: false },
  isPiPoint: false,
};

/**
 * These are options configured for each DataSource instance
 */
export interface PIWebAPIDataSourceJsonData extends DataSourceJsonData {
  piserver?: string;
  afserver?: string;
  afdatabase?: string;
  pipoint?: boolean;
  newFormat?: boolean;
  maxCacheTime?: number;
  useUnit?: boolean;
  useExperimental?: boolean;
  useStreaming?: boolean;
  useResponseCache?: boolean;
}

/** A query variable: `query` is written in the variable query language (see variableQuery.ts). */
export interface PIWebAPIVariableQuery extends DataQuery {
  query: string;
}
