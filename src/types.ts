import { DataQuery, DataSourceJsonData, Labels, QueryResultMeta, TimeSeriesPoints } from '@grafana/data';

export interface PiwebapiElementPath {
  path: string;
  variable: string;
}

export interface PiwebapiInternalRsp {
  data: PiwebapiRsp;
  status: number;
  url: string;
}

export interface PiwebapTargetRsp {
  refId: string;
  target: string;
  tags: Labels;
  datapoints: TimeSeriesPoints;
  path?: string;
  meta?: QueryResultMeta;
  unit?: string;
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
  useUnit: { enable: false },
  isPiPoint: false,
};


// AnnotationItemSecurity is only needed for generating a new interface. In practice this can be ignored, by the frontend.
interface AnnotationItemSecurity {
  CanAnnotate: boolean;
  CanDelete: boolean;
  CanExecute: boolean;
  CanRead: boolean;
  CanReadData: boolean;
  CanSubscribe: boolean;
  CanSubscribeOthers: boolean;
  CanWrite: boolean;
  CanWriteData: boolean;
  HasAdmin: boolean;
  Rights: string[];
}

// AnnotationItemLinks is only needed for generating a new interface. In practice this can be ignored, by the frontend.
interface AnnotationItemLinks {
  Self: string;
  Attributes: string;
  EventFrames: string;
  Database: string;
  ReferencedElements: string;
  Template: string;
  Categories: string;
  InterpolatedData: string;
  RecordedData: string;
  PlotData: string;
  SummaryData: string;
  Value: string;
  EndValue: string;
  Security: string;
  SecurityEntries: string;
}

export interface AnnotationItem {
  WebID: string;
  ID: string;
  Name: string;
  Description: string;
  Path: string;
  TemplateName: string;
  HasChildren: boolean;
  CategoryNames: string[];
  ExtendedProperties: object;
  StartTime: string;
  EndTime: string;
  Severity: string;
  AcknowledgedBy: string;
  AcknowledgedDate: string;
  CanBeAcknowledged: boolean;
  IsAcknowledged: boolean;
  IsAnnotated: boolean;
  IsLocked: boolean;
  AreValuesCaptured: boolean;
  RefElementWebIds: string[];
  Security: AnnotationItemSecurity;
  Links: AnnotationItemLinks;
}



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
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface PIWebAPISecureJsonData {
  apiKey?: string;
}
