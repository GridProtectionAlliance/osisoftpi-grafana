import { DataQuery } from '@grafana/schema';
import { DataSourceJsonData, SelectableValue } from '@grafana/data';
import internal from 'stream';

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

export interface PIWebAPIAnnotationsQuery extends DataQuery {
  target: string;
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
  webid?: string;
  display?: any;
  nodata?: string,
  enableStreaming?: any;
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
  hashCode?: string;
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
  maxCacheTime?: number;
  useUnit?: boolean;
  useExperimental?: boolean;
  useStreaming?: boolean;
  useResponseCache?: boolean;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface PIWebAPISecureJsonData {
  apiKey?: string;
}
