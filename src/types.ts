import { DataQuery } from '@grafana/schema';
import { DataSourceJsonData, SelectableValue } from '@grafana/data';

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
  attributes?: Array<SelectableValue<PIWebAPISelectableValue>>;
  segments?: any[];
  isPiPoint?: boolean;
  hideError?: boolean;
  isAnnotation?: boolean;
  webid?: string;
  display?: any;
  interpolate?: any;
  recordedValues?: any;
  digitalStates?: any;
  enableStreaming: any;
  useLastValue?: any;
  useUnit?: any;
  regex?: any;
  nodata?: string,
  summary?: {
    enable?: boolean,
    types?: any[],
    basis?: string,
    duration?: string,
    sampleTypeInterval?: boolean,
    sampleInterval?: string
  };
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
