import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface PIWebAPISelectableValue {
  value?: string;
  type?: string;
  expandable?: boolean;
}

export interface PIWebAPIAnnotationsQuery extends DataQuery {
  target: string;
}

export interface PIWebAPIQuery extends DataQuery {
  target: string;
  elementPath: string;
  attributes: any[];
  segments: any[];
  display: any;
  interpolate: any;
  recordedValues: any;
  digitalStates: any;
  webid: string;
  webids: string[];
  regex: any;
  summary: any;
  expression: string;
  isPiPoint: boolean;
}

export const defaultQuery: Partial<PIWebAPIQuery> = {
  target: ';',
  attributes: [],
  segments: [],
  regex: { enable: false },
  summary: { types: [], basis: 'EventWeighted', interval: '', nodata: 'Null' },
  expression: '',
  interpolate: { enable: false },
  recordedValues: { enable: false },
  digitalStates: { enable: false },
  isPiPoint: false
};

/**
 * These are options configured for each DataSource instance
 */
export interface PIWebAPIDataSourceJsonData extends DataSourceJsonData {
  url?: string;
  access?: string;
  piserver?: string;
  afserver?:string;
  afdatabase?:string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface PIWebAPISecureJsonData {
  apiKey?: string;
}
