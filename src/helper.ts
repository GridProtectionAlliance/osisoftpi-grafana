import { each, map } from 'lodash';

import {
  AnnotationQuery,
  DataFrame,
  FieldConfig,
  TimeSeries,
  FieldType,
  TimeSeriesValue,
  TIME_SERIES_VALUE_FIELD_NAME,
  TIME_SERIES_TIME_FIELD_NAME,
  ArrayVector,
  TableData,
  MetricFindValue,
  Field,
  toDataFrame,
} from '@grafana/data';

import { PiwebapiElementPath, PiwebapiRsp, PIWebAPIQuery } from 'types';

export function parseRawQuery(tr: string): any {
  const splitAttributes = tr.split(';');
  const splitElements = splitAttributes[0].split('\\');

  // remove element hierarchy from attribute collection
  splitAttributes.splice(0, 1);

  let attributes: any[] = [];
  if (splitElements.length > 1 || (splitElements.length === 1 && splitElements[0] !== '')) {
    const elementPath: string = splitElements.join('\\');
    each(splitAttributes, function (item, index) {
      if (item !== '') {
        attributes.push({
          label: item,
          value: {
            value: item,
            expandable: false,
          },
        });
      }
    });

    return { attributes, elementPath };
  }

  return { attributes, elementPath: null };
}

export function lowerCaseFirstLetter(string: string): string {
  return string.charAt(0).toLocaleLowerCase() + string.slice(1);
}

export function convertTimeSeriesToDataFrame(timeSeries: TimeSeries): DataFrame {
  const times: number[] = [];
  const values: TimeSeriesValue[] = [];

  // Sometimes the points are sent as datapoints
  const points = timeSeries.datapoints;
  for (const point of points) {
    values.push(point[0]);
    times.push(point[1] as number);
  }

  const fields = [
    {
      name: TIME_SERIES_TIME_FIELD_NAME,
      type: FieldType.time,
      config: {},
      values: new ArrayVector<number>(times),
    },
    {
      name: timeSeries.target ?? TIME_SERIES_VALUE_FIELD_NAME,
      type: FieldType.number,
      config: {
        unit: timeSeries.unit,
      },
      values: new ArrayVector<TimeSeriesValue>(values),
      labels: timeSeries.tags,
    },
  ];

  if (timeSeries.title) {
    (fields[1].config as FieldConfig).displayNameFromDS = timeSeries.title;
  }

  return {
    name: '',
    refId: timeSeries.refId,
    meta: timeSeries.meta,
    fields,
    length: values.length,
  };
}

/**
 * Builds the Grafana metric segment for use on the query user interface.
 *
 * @param {any} response - response from PI Web API.
 * @returns - Grafana metric segment.
 *
 * @memberOf PiWebApiDatasource
 */
export function metricQueryTransform(response: PiwebapiRsp[]): MetricFindValue[] {
  return map(response, (item) => {
    return {
      text: item.Name,
      expandable:
        item.HasChildren === undefined || item.HasChildren === true || (item.Path ?? '').split('\\').length <= 3,
      HasChildren: item.HasChildren,
      Items: item.Items ?? [],
      Path: item.Path,
      WebId: item.WebId,
    } as MetricFindValue;
  });
}

/**
 * Check if all items are selected.
 *
 * @param {any} current the current variable selection
 * @return {boolean} true if all value is selected, false otherwise
 */
export function isAllSelected(current: any): boolean {
  if (!current) {
    return false;
  }
  if (Array.isArray(current.text)) {
    return current.text.indexOf('All') >= 0;
  }
  return current.text === 'All';
}

export function processAnnotationQuery(annon: AnnotationQuery<PIWebAPIQuery>,data: DataFrame[]): DataFrame[] {
  let processedFrames: DataFrame[] = [];
  
  data.forEach((d: DataFrame) => {
    d.fields.forEach((f: Field) => {

      // check if the label has been set, if it hasn't been set then the eventframe annotation is not valid. 
      if (!f.labels) { 
        return 
      }

      if (!('eventframe' in f.labels)) {
        return;
      }

      let attribute = 'attribute' in f.labels

      // Check whether f.values is an array or not to allow for each.
      // Check whether f.values is an array or not to allow for each.
      if (Array.isArray(f.values)) {
        console.log(f.values)
        f.values.forEach((value: any) => {

          if (attribute) {
            let annotation = value['1'].Content
            let valueData:  any[] = []
            for (let i = 2; i in value; i++) {
              valueData.push(value[i].Content.Items)
            }

            const processedFrame = convertToTableData(annotation.Items!, valueData).map((r) => {
              return toDataFrame(r)});
            processedFrames = processedFrames.concat(processedFrame);
          } else {
            let annotation = value['1'].Content
            const processedFrame = convertToTableData(annotation.Items!).map((r) => {
              return toDataFrame(r)});
            processedFrames = processedFrames.concat(processedFrame);
          }
        });
      } 
    });
  });
  return processedFrames;
}

export function convertToTableData(items: any[], valueData?: any[]): TableData[] {
  console.log("items",items)
  const response: TableData[] = items.map((item: any, index: number) => {
    console.log("item",item)
    const columns = [{ text: 'StartTime' }, { text: 'EndTime' }];
    const rows = [item.StartTime, item.EndTime];
    if (valueData) {
      for (let attributeIndex = 0; attributeIndex < valueData.length; attributeIndex++) {
          let attributeData = valueData[attributeIndex]
          let eventframeAributeData = attributeData[index].Content.Items
          eventframeAributeData.forEach((attribute: any) => {
            columns.push({ text: attribute.Name });
            rows.push(String(attribute.Value.Value ? attribute.Value.Value.Name || attribute.Value.Value.Value || attribute.Value.Value : ''));
          });
      }
    }

    return {
      name: item.Name,
      columns,
      rows: [rows],
    };
  });
  console.log("response",response)
  return response;
}

/**
 * Resolve PIWebAPI response 'value' data to value - timestamp pairs.
 *
 * @param {any} item - 'Item' object from PIWebAPI
 * @param {any} noDataReplacementMode - String state of how to replace 'No Data'
 * @param {any} grafanaDataPoint - Single Grafana value pair (value, timestamp).
 * @returns grafanaDataPoint - Single Grafana value pair (value, timestamp).
 * @returns perviousValue - {any} Grafana value (value only).
 *
 */
export function noDataReplace(
  item: any,
  noDataReplacementMode: any,
  grafanaDataPoint: any[]
): {
  grafanaDataPoint: any[];
  previousValue: any;
  drop: boolean;
} {
  let previousValue = null;
  let drop = false;
  if (!item.Good || item.Value === 'No Data' || (item.Value?.Name && item.Value?.Name === 'No Data')) {
    if (noDataReplacementMode === 'Drop') {
      drop = true;
    } else if (noDataReplacementMode === '0') {
      grafanaDataPoint[0] = 0;
    } else if (noDataReplacementMode === 'Keep') {
      // Do nothing keep
    } else if (noDataReplacementMode === 'Null') {
      grafanaDataPoint[0] = null;
    } else if (noDataReplacementMode === 'Previous' && previousValue !== null) {
      grafanaDataPoint[0] = previousValue;
    }
  } else {
    previousValue = item.Value;
  }
  return { grafanaDataPoint, previousValue, drop };
}

/**
 * Check if the value is a number.
 *
 * @param {any} number the value to check
 * @returns {boolean} true if the value is a number, false otherwise
 */
export function checkNumber(number: any): boolean {
  return typeof number === 'number' && !Number.isNaN(number) && Number.isFinite(number);
}

/**
 * Returns the last item of the element path.
 *
 * @param {string} path element path
 * @returns {string} last item of the element path
 */
export function getLastPath(path: string): string {
  let splitPath = path.split('|');
  if (splitPath.length === 0) {
    return '';
  }
  splitPath = splitPath[0].split('\\');
  return splitPath.length === 0 ? '' : splitPath.pop() ?? '';
}

/**
 * Returns the last item of the element path plus variable.
 *
 * @param {PiwebapiElementPath[]} elementPathArray array of element paths
 * @param {string} path element path
 * @returns {string} last item of the element path
 */
export function getPath(elementPathArray: PiwebapiElementPath[], path: string): string {
  if (!path || elementPathArray.length === 0) {
    return '';
  }
  const splitStr = getLastPath(path);
  const foundElement = elementPathArray.find((e) => path.indexOf(e.path) >= 0)?.variable;
  return foundElement ? foundElement + '|' + splitStr : splitStr;
}

/**
 * Replace calculation dot in expression with PI point name.
 *
 * @param {boolean} replace - is pi point and calculation.
 * @param {PiwebapiRsp} webid - Pi web api response object.
 * @param {string} url - original url.
 * @returns Modified url
 */
export function getFinalUrl(replace: boolean, webid: PiwebapiRsp, url: string) {
  const newUrl = replace ? url.replace(/'\.'/g, `'${webid.Name}'`) : url;
  return newUrl;
}
