import { DataQuery } from '@grafana/schema';
import { DataSourceJsonData } from '@grafana/data';

export interface PiwebapiElementPath {
  path: string;
  variable: string;
}

export interface PiwebapiInternalRsp {
  data: PiwebapiRsp;
  status: number;
  url: string;
}

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

export interface PIWebAPIAnnotationsQuery extends DataQuery {
  target: string;
}

export interface PIWebAPIQuery extends DataQuery {
  target?: string;
  elementPath?: string;
  attributes?: any[];
  segments?: any[];
  isPiPoint?: boolean;
  isAnnotation?: boolean;
  webid?: string;
  webids?: string[];
  display?: any;
  interpolate?: any;
  recordedValues?: any;
  digitalStates?: any;
  enableStreaming: any;
  useLastValue?: any;
  useUnit?: any;
  regex?: any;
  summary?: any;
  expression?: string;
  rawQuery?: boolean;
  query?: string;
  // annotations items
  database?: PiwebapiRsp;
  template?: PiwebapiRsp;
  showEndTime?: boolean;
  attribute?: any;
  nameFilter?: string;
  categoryName?: string;
}

export const defaultQuery: Partial<PIWebAPIQuery> = {
  target: ';',
  attributes: [],
  segments: [],
  regex: { enable: false },
  summary: { types: [], basis: 'EventWeighted', interval: '', nodata: 'Null' },
  expression: '',
  interpolate: { enable: false },
  useLastValue: { enable: false },
  recordedValues: { enable: false },
  digitalStates: { enable: false },
  enableStreaming: { enable: false },
  useUnit: { enable: false },
  isPiPoint: false,
};

/**
 * These are options configured for each DataSource instance
 */
export interface PIWebAPIDataSourceJsonData extends DataSourceJsonData {
  url?: string;
  access?: string;
  piserver?: string;
  afserver?: string;
  afdatabase?: string;
  pipoint?: boolean;
  newFormat?: boolean;
  useUnit?: boolean;
  useExperimental?: boolean;
  useStreaming?: boolean;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface PIWebAPISecureJsonData {
  apiKey?: string;
}
