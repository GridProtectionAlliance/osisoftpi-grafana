import { each, map } from 'lodash';

import { MetricFindValue } from '@grafana/data';

import { PiwebapiRsp } from 'types';

/** Builds a `?key=value&...` query string with every value URL-encoded; empty values are left out. */
export function buildQueryString(params: Record<string, unknown>): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
  return parts.length > 0 ? '?' + parts.join('&') : '';
}

/**
 * Formats a multi-value variable as a `{value1,value2}` group, which the backend expands into one target per value.
 * Commas, braces and `%` inside the values are percent-encoded so they cannot break the group.
 */
export function formatVariableValue(value: unknown): string {
  if (!Array.isArray(value)) {
    return value === undefined || value === null ? '' : String(value);
  }
  if (value.length === 1) {
    return String(value[0]);
  }
  const encoded = value.map((v) =>
    String(v).replace(/%/g, '%25').replace(/,/g, '%2C').replace(/\{/g, '%7B').replace(/\}/g, '%7D')
  );
  return '{' + encoded.join(',') + '}';
}

/**
 * Replaces every `{value1,value2}` group created by formatVariableValue with its first value.
 * Used when browsing the AF hierarchy, which needs a single concrete path.
 */
export function firstVariableValue(path: string): string {
  return path.replace(/\{([^{}]*)\}/g, (_: string, values: string) =>
    values.split(',')[0].replace(/%2C/g, ',').replace(/%7B/g, '{').replace(/%7D/g, '}').replace(/%25/g, '%')
  );
}

/** Removes the leading `\\` of a UNC-style target (`\\AFServer\DB\Element;Attr`): the backend adds it. */
export function removeServerPrefix(target: string): string {
  return target.replace(/^\\+/, '');
}

export function removeTime(s: any): string {
  const temp = Object.assign({}, s);
  delete temp.startTime;
  delete temp.endTime;
  delete temp.scopedVars;
  delete temp.hashCode;
  delete temp.webid;
  return JSON.stringify(temp);
}

export function hashCode(s: string) {
  // Convert the string to bytes
  const bytes = new TextEncoder().encode(s);

  // Encode the bytes to Base64
  const base64 = btoa(String.fromCharCode(...bytes));

  // Concatenate the base64 string and the unique identifier
  const uniqueBase64Id = base64;

  return uniqueBase64Id;
}

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

