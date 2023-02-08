import { curry, each, filter, flatten, forOwn, groupBy, keys, map, uniq } from 'lodash';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  AnnotationEvent,
  toDataFrame,
  MetricFindValue,
} from '@grafana/data';
import { BackendSrv, getBackendSrv, getTemplateSrv, TemplateSrv } from '@grafana/runtime';

import { PIWebAPIQuery, PIWebAPIDataSourceJsonData } from './types';

interface PiwebapiElementPath {
  path: string;
  variable: string;
}

interface PiwebapiInternalRsp {
  data: PiwebapiRsp;
  status: number;
  url: string;
}

interface PiwebapTargetRsp {
  refId: string;
  target: string;
  datapoints: any[];
}

interface PiwebapiRsp {
  Name?: string;
  InstanceType?: string;
  Items?: PiwebapiRsp[];
  WebId?: string;
  HasChildren?: boolean;
  Path?: string;
}

interface PiDataServer {
  name: string | undefined;
  webid: string | undefined;
}

export class PiWebAPIDatasource extends DataSourceApi<PIWebAPIQuery, PIWebAPIDataSourceJsonData> {
  piserver: PiDataServer;
  afserver: PiDataServer;
  afdatabase: PiDataServer;
  piPointConfig: boolean;

  basicAuth?: string;
  withCredentials?: boolean;
  url: string;
  name: string;
  isProxy = false;

  templateSrv: TemplateSrv;
  backendSrv: BackendSrv;

  piwebapiurl?: string;
  webidCache: Map<String, any> = new Map();

  error: any;

  constructor(instanceSettings: DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>) {
    super(instanceSettings);
    this.basicAuth = instanceSettings.basicAuth;
    this.withCredentials = instanceSettings.withCredentials;
    this.url = instanceSettings.url!;
    this.name = instanceSettings.name;
    this.templateSrv = getTemplateSrv();
    this.backendSrv = getBackendSrv();

    this.piwebapiurl = instanceSettings.jsonData.url?.toString();
    this.isProxy = /^http(s)?:\/\//.test(this.url) || instanceSettings.jsonData.access === 'proxy';

    this.piserver = { name: (instanceSettings.jsonData || {}).piserver, webid: undefined };
    this.afserver = { name: (instanceSettings.jsonData || {}).afserver, webid: undefined };
    this.afdatabase = { name: (instanceSettings.jsonData || {}).afdatabase, webid: undefined };
    this.piPointConfig = instanceSettings.jsonData.pipoint || false;

    Promise.all([
      this.getAssetServer(this.afserver.name).then((result: PiwebapiRsp) => (this.afserver.webid = result.WebId)),
      this.getDataServer(this.piserver.name).then((result: PiwebapiRsp) => (this.piserver.webid = result.WebId)),
      this.getDatabase(this.afserver.name ? this.afserver.name + '\\' + this.afdatabase.name : undefined).then(
        (result: PiwebapiRsp) => (this.afdatabase.webid = result.WebId)
      ),
    ]);
  }

  /**
   * Converts a PIWebAPI Event Frame response to a Grafana Annotation
   *
   * @param {any} annotationOptions - Options data from configuration panel.
   * @param {any} endTime - End time of the Event Frame.
   * @param {any} eventFrame - The Event Frame data.
   * @returns - Grafana Annotation
   *
   * @memberOf PiWebApiDatasource
   */
  private eventFrameToAnnotation(
    annotationOptions: any,
    endTime: any,
    eventFrame: any,
    attributeDataItems: any
  ): AnnotationEvent {
    if (annotationOptions.regex && annotationOptions.regex.enable) {
      eventFrame.Name = eventFrame.Name.replace(
        new RegExp(annotationOptions.regex.search),
        annotationOptions.regex.replace
      );
    }

    var attributeText = '';
    if (attributeDataItems) {
      each(attributeDataItems, (attributeData: any) => {
        const attributeValue = attributeData.Value.Value
          ? attributeData.Value.Value.Name || attributeData.Value.Value.Value || attributeData.Value.Value
          : null;
        attributeText += '<br />' + attributeData.Name + ': ' + attributeValue;
      });
    }
    return {
      annotation: annotationOptions,
      title: (endTime ? 'END ' : annotationOptions.showEndTime ? 'START ' : '') + annotationOptions.name,
      time: new Date(endTime ? eventFrame.EndTime : eventFrame.StartTime).getTime(),
      text:
        eventFrame.Name + attributeText + '<br />Start: ' + eventFrame.StartTime + '<br />End: ' + eventFrame.EndTime,
    };
  }

  /**
   * Builds the PIWebAPI query parameters.
   *
   * @param {any} options - Grafana query and panel options.
   * @returns - PIWebAPI query parameters.
   *
   * @memberOf PiWebApiDatasource
   */
  private buildQueryParameters(options: DataQueryRequest<PIWebAPIQuery>) {
    options.targets = filter(options.targets, (target) => {
      if (!target || !target.target) {
        return false;
      }
      return !target.target.startsWith('Select AF');
    });

    options.targets = map(options.targets, (target) => {
      const ds = this;
      var tar = {
        target: this.templateSrv.replace(target.elementPath, options.scopedVars),
        elementPath: this.templateSrv.replace(target.elementPath, options.scopedVars),
        elementPathArray: [
          {
            path: this.templateSrv.replace(target.elementPath, options.scopedVars),
            variable: '',
          } as PiwebapiElementPath,
        ],
        attributes: map(target.attributes, (att) =>
          this.templateSrv.replace(att.value?.value || att, options.scopedVars)
        ),
        segments: map(target.segments, (att) => this.templateSrv.replace(att.value?.value, options.scopedVars)),
        display: target.display,
        refId: target.refId,
        hide: target.hide,
        interpolate: target.interpolate || { enable: false },
        recordedValues: target.recordedValues || { enable: false },
        digitalStates: target.digitalStates || { enable: false },
        webid: target.webid,
        webids: target.webids || [],
        regex: target.regex || { enable: false },
        expression: target.expression || '',
        summary: target.summary || { types: [] },
        startTime: options.range.from,
        endTime: options.range.to,
        isPiPoint: target.isPiPoint,
        scopedVars: options.scopedVars,
      };

      if (tar.expression) {
        tar.expression = this.templateSrv.replace(tar.expression, options.scopedVars);
      }

      if (tar.summary.types !== undefined) {
        tar.summary.types = filter(tar.summary.types, (item) => {
          return item !== undefined && item !== null && item !== '';
        });
      }

      // explode All or Multi-selection
      const varsKeys = keys(options.scopedVars);
      this.templateSrv.getVariables().forEach((v: any) => {
        if (ds.isAllSelected(v.current) && varsKeys.indexOf(v.name) < 0) {
          // All selection
          const variables = v.options.filter((o: any) => !o.selected);
          // attributes
          tar.attributes = tar.attributes.map((attr: string) =>
            variables.map((vv: any) =>
              !!v.allValue ? attr.replace(v.allValue, vv.value) : attr.replace(/{[a-zA-z0-9,-_]+}/gi, vv.value)
            )
          );
          tar.attributes = uniq(flatten(tar.attributes));
          // elementPath
          tar.elementPathArray = ds.getElementPath(tar.elementPathArray, variables, v.allValue);
        } else if (Array.isArray(v.current.text) && varsKeys.indexOf(v.name) < 0) {
          // Multi-selection
          const variables = v.options.filter((o: any) => o.selected);
          // attributes
          const query = v.current.value.join(',');
          tar.attributes = tar.attributes.map((attr: string) =>
            variables.map((vv: any) => attr.replace(`{${query}}`, vv.value))
          );
          tar.attributes = uniq(flatten(tar.attributes));
          // elementPath
          tar.elementPathArray = ds.getElementPath(tar.elementPathArray, variables, `{${query}}`);
        }
      });

      return tar;
    });

    return options;
  }

  /**
   * Datasource Implementation. Primary entry point for data source.
   * This takes the panel configuration and queries, sends them to PI Web API and parses the response.
   *
   * @param {any} options - Grafana query and panel options.
   * @returns - Promise of data in the format for Grafana panels.
   *
   * @memberOf PiWebApiDatasource
   */
  async query(options: DataQueryRequest<PIWebAPIQuery>): Promise<DataQueryResponse> {
    var ds = this;
    var query = this.buildQueryParameters(options);
    query.targets = filter(query.targets, (t) => !t.hide);

    if (query.targets.length <= 0) {
      return Promise.resolve({ data: [] });
    } else {
      return Promise.all(ds.getStream(query)).then((targetResponses) => {
        let flattened: PiwebapTargetRsp[] = [];
        each(targetResponses, (tr) => {
          each(tr, (item) => flattened.push(item));
        });
        const response: DataQueryResponse = {
          data: flattened
            .sort((a, b) => {
              return +(a.target > b.target) || +(a.target === b.target) - 1;
            })
            .map((d) => toDataFrame(d)),
        };
        return response;
      });
    }
  }

  /**
   * Datasource Implementation.
   * Used for testing datasource in datasource configuration pange
   *
   * @returns - Success or failure message.
   *
   * @memberOf PiWebApiDatasource
   */
  testDatasource(): Promise<any> {
    return this.backendSrv
      .datasourceRequest({
        url: this.url + '/',
        method: 'GET',
      })
      .then((response: any) => {
        if (response.status === 200) {
          return { status: 'success', message: 'Data source is working', title: 'Success' };
        }
        throw new Error('Failed');
      });
  }

  /**
   * Datasource Implementation.
   * This queries PI Web API for Event Frames and converts them into annotations.
   *
   * @param {any} options - Annotation options, usually the Event Frame Category.
   * @returns - A Grafana annotation.
   *
   * @memberOf PiWebApiDatasource
   */
  annotationQuery(options: any): Promise<AnnotationEvent[]> {
    if (!this.afdatabase.webid) {
      return Promise.resolve([]);
    }

    var categoryName = options.annotation.query.categoryName
      ? this.templateSrv.replace(options.annotation.query.categoryName, options.scopedVars, 'glob')
      : null;
    var nameFilter = options.annotation.query.nameFilter
      ? this.templateSrv.replace(options.annotation.query.nameFilter, options.scopedVars, 'glob')
      : null;
    var templateName = options.annotation.template ? options.annotation.template.Name : null;
    var annotationOptions = {
      name: options.annotation.name,
      datasource: options.annotation.datasource,
      enable: options.annotation.enable,
      iconColor: options.annotation.iconColor,
      showEndTime: options.annotation.showEndTime,
      regex: options.annotation.regex,
      attribute: options.annotation.attribute,
      categoryName: categoryName,
      templateName: templateName,
      nameFilter: nameFilter,
    };

    var filter = [];
    if (!!annotationOptions.categoryName) {
      filter.push('categoryName=' + annotationOptions.categoryName);
    }
    if (!!annotationOptions.nameFilter) {
      filter.push('nameFilter=' + annotationOptions.nameFilter);
    }
    if (!!annotationOptions.templateName) {
      filter.push('templateName=' + annotationOptions.templateName);
    }
    if (!filter.length) {
      return Promise.resolve([]);
    }
    filter.push('startTime=' + options.range.from.toJSON());
    filter.push('endTime=' + options.range.to.toJSON());

    if (annotationOptions.attribute && annotationOptions.attribute.enable) {
      var resourceUrl =
        this.piwebapiurl + '/streamsets/{0}/value?selectedFields=Items.WebId%3BItems.Value%3BItems.Name';
      if (!!annotationOptions.attribute.name) {
        resourceUrl =
          this.piwebapiurl +
          '/streamsets/{0}/value?nameFilter=' +
          annotationOptions.attribute.name +
          '&selectedFields=Items.WebId%3BItems.Value%3BItems.Name';
      }
      var query: any = {};
      query['1'] = {
        Method: 'GET',
        Resource: this.piwebapiurl + '/assetdatabases/' + this.afdatabase.webid + '/eventframes?' + filter.join('&'),
      };
      query['2'] = {
        Method: 'GET',
        RequestTemplate: {
          Resource: resourceUrl,
        },
        Parameters: ['$.1.Content.Items[*].WebId'],
        ParentIds: ['1'],
      };
      return this.restBatch(query).then((result: any) => {
        const data = result.data['1'].Content;
        const valueData = result.data['2'].Content;

        var annotations = map(data.Items, (item: any, index: any) => {
          return curry(this.eventFrameToAnnotation)(
            annotationOptions,
            false,
            item,
            valueData.Items[index].Content.Items
          );
        });

        if (options.annotation.showEndTime) {
          var ends = map(data.Items, (item: any, index: number) => {
            return curry(this.eventFrameToAnnotation)(
              annotationOptions,
              true,
              item,
              valueData.Items[index].Content.Items
            );
          });
          each(ends, (end) => {
            annotations.push(end);
          });
        }

        return annotations;
      });
    } else {
      return this.restGet('/assetdatabases/' + this.afdatabase.webid + '/eventframes?' + filter.join('&')).then(
        (result) => {
          var annotations = map(result.data.Items, curry(this.eventFrameToAnnotation)(annotationOptions, false));
          if (options.annotation.showEndTime) {
            var ends = map(result.data.Items, curry(this.eventFrameToAnnotation)(annotationOptions, true));
            each(ends, (end) => {
              annotations.push(end);
            });
          }
          return annotations;
        }
      );
    }
  }

  /**
   * Builds the Grafana metric segment for use on the query user interface.
   *
   * @param {any} response - response from PI Web API.
   * @returns - Grafana metric segment.
   *
   * @memberOf PiWebApiDatasource
   */
  private metricQueryTransform(response: PiwebapiRsp[]): MetricFindValue[] {
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
   * This method does the discovery of the AF Hierarchy and populates the query user interface segments.
   *
   * @param {any} query - Parses the query configuration and builds a PI Web API query.
   * @returns - Segment information.
   *
   * @memberOf PiWebApiDatasource
   */
  metricFindQuery(query: any, queryOptions: any): Promise<MetricFindValue[]> {
    var ds = this;
    var querydepth = ['servers', 'databases', 'databaseElements', 'elements'];
    if (typeof query === 'string') {
      query = JSON.parse(query as string);
    }
    if (queryOptions.isPiPoint) {
      query.path = this.templateSrv.replace(query.path, queryOptions);
    } else {
      if (query.path === '') {
        query.type = querydepth[0];
      } else if (query.type !== 'attributes') {
        query.type = querydepth[Math.max(0, Math.min(query.path.split('\\').length, querydepth.length - 1))];
      }
      query.path = this.templateSrv.replace(query.path, queryOptions);
      query.path = query.path.replace(/\{([^\\])*\}/gi, (r: string) => r.substring(1, r.length - 2).split(',')[0]);
    }

    query.filter = query.filter ?? '*';

    if (query.type === 'servers') {
      return ds.afserver?.name
        ? ds
            .getAssetServer(ds.afserver.name)
            .then((result: PiwebapiRsp) => [result])
            .then(ds.metricQueryTransform)
        : ds.getAssetServers().then(ds.metricQueryTransform);
    } else if (query.type === 'databases') {
      return ds
        .getAssetServer(query.path)
        .then((server) => ds.getDatabases(server.WebId ?? '', {}))
        .then(ds.metricQueryTransform);
    } else if (query.type === 'databaseElements') {
      return ds
        .getDatabase(query.path)
        .then((db) =>
          ds.getDatabaseElements(db.WebId ?? '', {
            selectedFields: 'Items.WebId%3BItems.Name%3BItems.Items%3BItems.Path%3BItems.HasChildren',
          })
        )
        .then(ds.metricQueryTransform);
    } else if (query.type === 'elements') {
      return ds
        .getElement(query.path)
        .then((element) =>
          ds.getElements(element.WebId ?? '', {
            selectedFields: 'Items.WebId%3BItems.Name%3BItems.Items%3BItems.Path%3BItems.HasChildren',
            nameFilter: query.filter,
          })
        )
        .then(ds.metricQueryTransform);
    } else if (query.type === 'attributes') {
      return ds
        .getElement(query.path)
        .then((element) =>
          ds.getAttributes(element.WebId ?? '', {
            searchFullHierarchy: 'true',
            selectedFields: 'Items.WebId%3BItems.Name%3BItems.Path',
            nameFilter: query.filter,
          })
        )
        .then(ds.metricQueryTransform);
    } else if (query.type === 'dataserver') {
      return ds.getDataServers().then(ds.metricQueryTransform);
    } else if (query.type === 'pipoint') {
      return ds.piPointSearch(query.webId, query.pointName).then(ds.metricQueryTransform);
    }
    return Promise.reject('Bad type');
  }

  /**
   * Gets the url of summary data from the query configuration.
   *
   * @param {any} summary - Query summary configuration.
   * @returns - URL append string.
   *
   * @memberOf PiWebApiDatasource
   */
  getSummaryUrl(summary: any) {
    if (summary.interval.trim() === '') {
      return (
        '&summaryType=' +
        summary.types.map((s: any) => s.value?.value).join('&summaryType=') +
        '&calculationBasis=' +
        summary.basis
      );
    }
    return (
      '&summaryType=' +
      summary.types.map((s: any) => s.value?.value).join('&summaryType=') +
      '&calculationBasis=' +
      summary.basis +
      '&summaryDuration=' +
      summary.interval.trim()
    );
  }

  /**
   * Resolve PIWebAPI response 'value' data to value - timestamp pairs.
   *
   * @param {any} value - A list of PIWebAPI values.
   * @param {any} target - The target Grafana metric.
   * @param {any} isSummary - Boolean for tracking if data is of summary class.
   * @returns - An array of Grafana value, timestamp pairs.
   *
   */
  parsePiPointValueList(value: any[], target: any, isSummary: boolean) {
    var api = this;
    var datapoints: any[] = [];
    each(value, (item) => {
      // @ts-ignore
      var { grafanaDataPoint, previousValue, drop } = this.noDataReplace(
        isSummary ? item.Value : item,
        target.summary.nodata,
        api.parsePiPointValue(isSummary ? item.Value : item, target, isSummary)
      );
      if (!drop) {
        datapoints.push(grafanaDataPoint);
      }
    });
    return datapoints;
  }

  /**
   * Convert a PI Point value to use Grafana value/timestamp.
   *
   * @param {any} value - PI Point value.
   * @param {any} isSummary - Boolean for tracking if data is of summary class.
   * @param {any} target - The target grafana metric.
   * @returns - Grafana value pair.
   *
   */
  parsePiPointValue(value: any, target: any, isSummary: boolean) {
    let num = !isSummary && typeof value.Value === 'object' ? value.Value?.Value : value.Value;

    if (!value.Good || !!target.digitalStates?.enable) {
      num = (!isSummary && typeof value.Value === 'object' ? value.Value?.Name : value.Name) ?? '';
      return [this.checkNumber(num) ? Number(num) : num.trim(), new Date(value.Timestamp).getTime()];
    }

    return [this.checkNumber(num) ? Number(num) : num.trim(), new Date(value.Timestamp).getTime()];
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
  noDataReplace(
    item: any,
    noDataReplacementMode: any,
    grafanaDataPoint: any[]
  ): {
    grafanaDataPoint: any[];
    previousValue: any;
    drop: boolean;
  } {
    var previousValue = null;
    var drop = false;
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
   * Process the response from PI Web API for a single item.
   *
   * @param {any} content - Web response data.
   * @param {any} target - The target grafana metric.
   * @param {any} name - The target metric name.
   * @returns - Parsed metric in target/datapoint json format.
   *
   * @memberOf PiWebApiDatasource
   */
  processResults(content: any, target: any, name: any, noTemplate: boolean): PiwebapTargetRsp[] {
    const api = this;
    const isSummary: boolean = target.summary && target.summary.types && target.summary.types.length > 0;
    name = noTemplate ? name : this.getPath(target.elementPathArray, content.Path) + '|' + name;
    if (target.regex && target.regex.enable && target.regex.search.length && target.regex.replace.length) {
      name = name.replace(new RegExp(target.regex.search), target.regex.replace);
    }
    if (isSummary) {
      var innerResults: any[] = [];
      var groups = groupBy(content.Items, (item: any) => item.Type);
      forOwn(groups, (value, key) => {
        innerResults.push({
          refId: target.refId,
          target: name + '[' + key + ']',
          datapoints: api.parsePiPointValueList(value, target, isSummary),
        });
      });
      return innerResults;
    }
    return [
      {
        refId: target.refId,
        target: name,
        datapoints: api.parsePiPointValueList(content.Items, target, isSummary),
      },
    ];
  }

  /** PRIVATE SECTION */

  /**
   * Check if all items are selected.
   *
   * @param {any} current the current variable selection
   * @return {boolean} true if all value is selected, false otherwise
   */
  private isAllSelected(current: any): boolean {
    if (!current) {
      return false;
    }
    if (Array.isArray(current.text)) {
      return current.text.indexOf('All') >= 0;
    }
    return current.text === 'All';
  }

  /**
   * Check if the value is a number.
   *
   * @param {any} number the value to check
   * @returns {boolean} true if the value is a number, false otherwise
   */
  private checkNumber(number: any): boolean {
    return typeof number === 'number' && !Number.isNaN(number) && Number.isFinite(number);
  }

  /**
   * Returns a new element path list based on the panel variables.
   *
   * @param {string} elementPathArray array of element paths
   * @param {string} variables the list of variable values
   * @param {string} allValue the all value value for the variable
   * @returns {PiwebapiElementPath[]} new element path list
   */
  private getElementPath(
    elementPathArray: PiwebapiElementPath[],
    variables: any[],
    allValue: string
  ): PiwebapiElementPath[] {
    // elementPath
    let newElementPathArray: PiwebapiElementPath[] = [];
    elementPathArray.forEach((elem: PiwebapiElementPath) => {
      if ((!!allValue && elem.path.indexOf(allValue) >= 0) || (!allValue && elem.path.match(/{[a-zA-z0-9,-_]+}/gi))) {
        const temp: PiwebapiElementPath[] = variables.map((vv: any) => {
          return {
            path: !!allValue
              ? elem.path.replace(allValue, vv.value)
              : elem.path.replace(/{[a-zA-z0-9,-_]+}/gi, vv.value),
            variable: vv.value,
          } as PiwebapiElementPath;
        });
        newElementPathArray = newElementPathArray.concat(temp);
      }
    });
    if (newElementPathArray.length) {
      return uniq(flatten(newElementPathArray));
    }
    return elementPathArray;
  }

  /**
   * Returns the last item of the element path.
   *
   * @param {string} path element path
   * @returns {string} last item of the element path
   */
  private getPath(elementPathArray: PiwebapiElementPath[], path: string): string {
    let splitPath = path.split('|');
    if (splitPath.length === 0) {
      return '';
    }
    if (elementPathArray.length === 0) {
      return '';
    }
    splitPath = splitPath[0].split('\\');
    const splitStr = splitPath.length === 0 ? '' : splitPath.pop() ?? '';
    const foundElement = elementPathArray.find((e) => path.indexOf(e.path) >= 0)?.variable;
    return foundElement ? foundElement + '|' + splitStr : splitStr;
  }

  /**
   * Gets historical data from a PI Web API stream source.
   *
   * @param {any} query - Grafana query.
   * @returns - Metric data.
   *
   * @memberOf PiWebApiDatasource
   */
  private getStream(query: any): Array<Promise<PiwebapTargetRsp[]>> {
    const ds = this;
    var results: Array<Promise<PiwebapTargetRsp[]>> = [];

    each(query.targets, (target) => {
      target.attributes = filter(target.attributes || [], (attribute) => {
        return 1 && attribute;
      });
      var url = '';
      var isSummary = target.summary && target.summary.types && target.summary.types.length > 0;
      var isInterpolated = target.interpolate && target.interpolate.enable;
      // perhaps add a check to see if interpolate override time < query.interval
      var intervalTime = target.interpolate.interval ? target.interpolate.interval : query.interval;
      var timeRange = '?startTime=' + query.range.from.toJSON() + '&endTime=' + query.range.to.toJSON();
      var targetName = target.expression || target.elementPath;
      var displayName = target.display ? this.templateSrv.replace(target.display, query.scopedVars) : null;
      if (target.expression) {
        url += '/calculation';
        if (isSummary) {
          url += '/summary' + timeRange + (isInterpolated ? '&sampleType=Interval&sampleInterval=' + intervalTime : '');
        } else {
          url += '/intervals' + timeRange + '&sampleInterval=' + intervalTime;
        }
        url += '&expression=' + encodeURIComponent(target.expression);
        if (target.attributes.length > 0) {
          results.push(ds.internalStream(query, target, url));
        } else {
          results.push(
            ds.restGetWebId(target.elementPath, this.piPointConfig && target.isPiPoint).then((webidresponse: any) => {
              return ds
                .restPost(url + webidresponse.WebId)
                .then((response: any) => ds.processResults(response.data, target, displayName || targetName, false))
                .catch((err: any) => (ds.error = err));
            })
          );
        }
      } else {
        url += '/streamsets';
        if (isSummary) {
          url += '/summary' + timeRange + '&intervals=' + query.maxDataPoints + this.getSummaryUrl(target.summary);
        } else if (target.interpolate && target.interpolate.enable) {
          url += '/interpolated' + timeRange + '&interval=' + intervalTime;
        } else if (target.recordedValues && target.recordedValues.enable) {
          const maxNumber =
            target.recordedValues.maxNumber && !isNaN(target.recordedValues.maxNumber)
              ? target.recordedValues.maxNumber
              : 1000;
          url += '/recorded' + timeRange + '&maxCount=' + maxNumber;
        } else {
          url += '/plot' + timeRange + '&intervals=' + query.maxDataPoints;
        }

        results.push(ds.internalStream(query, target, url));
      }
    });

    return results;
  }

  /**
   * Return the data points from the provided Grafana query.
   *
   * @param {any} query - Grafana query.
   * @param {any} target - Grafana query target.
   * @param {string} url - The base URL for the query.
   * @returns - Metric data.
   *
   * @memberOf PiWebApiDatasource
   */
  private internalStream(query: any, target: any, url: string): Promise<PiwebapTargetRsp[]> {
    const ds = this;
    const targetName = target.expression || target.elementPath;
    const displayName = target.display ? this.templateSrv.replace(target.display, query.scopedVars) : null;
    const noTemplate = target.elementPathArray.length === 1 && target.elementPath === target.elementPathArray[0].path;
    let promises: Promise<PiwebapiRsp[]>;

    if (noTemplate) {
      if (target.attributes.length > 1 && !target.isPiPoint) {
        promises = ds
          .restGetWebId(target.elementPath, this.piPointConfig && target.isPiPoint)
          .then((datarsp) =>
            ds.getAttributes(datarsp.WebId!, {
              searchFullHierarchy: 'true',
              nameFilter: '*',
            })
          )
          .then((datarspa) =>
            datarspa.filter(
              (d) =>
                target.attributes.indexOf(d.Name) >= 0 ||
                target.attributes.indexOf(d.Path?.split('|').splice(1).join('|')) >= 0
            )
          );
      } else {
        promises = Promise.all(
          map(target.attributes, (attribute: string) =>
            ds.restGetWebId(target.elementPath + '|' + attribute, this.piPointConfig && target.isPiPoint)
          )
        );
      }
    } else {
      if (target.attributes.length > 1 && !target.isPiPoint) {
        promises = Promise.all(
          target.elementPathArray.map((elementPath: PiwebapiElementPath) => {
            return ds
              .restGetWebId(elementPath.path, this.piPointConfig && target.isPiPoint)
              .then((datarsp) =>
                ds.getAttributes(datarsp.WebId!, {
                  searchFullHierarchy: 'true',
                  nameFilter: '*',
                })
              )
              .then((datarspa) =>
                datarspa.filter(
                  (d) =>
                    target.attributes.indexOf(d.Name) >= 0 ||
                    target.attributes.indexOf(d.Path?.split('|').splice(1).join('|')) >= 0
                )
              );
          })
        );
      } else {
        promises = Promise.all(
          flatten(
            map(target.attributes, (attribute: string) => {
              return target.elementPathArray.map((elementPath: PiwebapiElementPath) =>
                ds.restGetWebId(elementPath.path + '|' + attribute, this.piPointConfig && target.isPiPoint)
              );
            })
          )
        );
      }
    }

    return promises.then((webidresponse) => {
      const query: any = {};
      each(flatten(webidresponse), (webid, index) => {
        query[index + 1] = {
          Method: 'GET',
          Resource: ds.piwebapiurl + url + '&webid=' + webid.WebId,
        };
      });

      return ds
        .restBatch(query)
        .then((response: any) => {
          const targetResults: any[] = [];
          each(response.data, (value, key) => {
            if (target.expression) {
              const attribute = webidresponse[parseInt(key, 10) - 1].Name;
              each(
                ds.processResults(value.Content, target, displayName || attribute || targetName, noTemplate),
                (targetResult) => targetResults.push(targetResult)
              );
            } else {
              each(value.Content.Items, (item) => {
                each(
                  ds.processResults(item, target, displayName || item.Name || targetName, noTemplate),
                  (targetResult) => targetResults.push(targetResult)
                );
              });
            }
          });
          return targetResults;
        })
        .catch((err: any) => (ds.error = err));
    });
  }

  /**
   * Abstraction for calling the PI Web API REST endpoint
   *
   * @param {any} path - the path to append to the base server URL.
   * @returns - The full URL.
   *
   * @memberOf PiWebApiDatasource
   */
  private restGet(path: string): Promise<PiwebapiInternalRsp> {
    return this.backendSrv
      .datasourceRequest({
        url: this.url + path,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      .then((response: any) => {
        return response as PiwebapiInternalRsp;
      });
  }

  /**
   * Resolve a Grafana query into a PI Web API webid. Uses client side cache when possible to reduce lookups.
   *
   * @param {string} assetPath - The AF Path or the Pi Point Path (\\ServerName\piPointName) to the asset.
   * @param {boolean} isPiPoint - Flag indicating it's a PI Point
   * @returns - URL query parameters.
   *
   * @memberOf PiWebApiDatasource
   */
  private restGetWebId(assetPath: string, isPiPoint: boolean): Promise<PiwebapiRsp> {
    var ds = this;

    // check cache
    var cachedWebId = ds.webidCache.get(assetPath);
    if (cachedWebId) {
      return Promise.resolve({ Path: assetPath, WebId: cachedWebId.WebId, Name: cachedWebId.Name });
    }

    let path = '';
    if (isPiPoint) {
      path = '/points?selectedFields=WebId%3BName%3BPath&path=\\\\' + assetPath.replace('|', '\\');
    } else {
      // no cache hit, query server
      path =
        (assetPath.indexOf('|') >= 0
          ? '/attributes?selectedFields=WebId%3BName%3BPath&path=\\\\'
          : '/elements?selectedFields=WebId%3BName%3BPath&path=\\\\') + assetPath;
    }

    return this.backendSrv
      .datasourceRequest({
        url: this.url + path,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      .then((response: any) => {
        ds.webidCache.set(assetPath, response.data);
        return { Path: assetPath, WebId: response.data.WebId, Name: response.data.Name };
      });
  }

  /**
   * Execute a batch query on the PI Web API.
   *
   * @param {any} batch - Batch JSON query data.
   * @returns - Batch response.
   *
   * @memberOf PiWebApiDatasource
   */
  private restBatch(batch: any) {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/batch',
      data: batch,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'message/http',
      },
    });
  }

  /**
   * Execute a POST on the PI Web API.
   *
   * @param {string} path - The full url of the POST.
   * @returns - POST response data.
   *
   * @memberOf PiWebApiDatasource
   */
  private restPost(path: string) {
    return this.backendSrv.datasourceRequest({
      url: this.url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'message/http',
        'X-PIWEBAPI-HTTP-METHOD': 'GET',
        'X-PIWEBAPI-RESOURCE-ADDRESS': path,
      },
    });
  }

  // Get a list of all data (PI) servers
  private getDataServers(): Promise<PiwebapiRsp[]> {
    return this.restGet('/dataservers').then((response) => response.data.Items ?? []);
  }
  private getDataServer(name: string | undefined): Promise<PiwebapiRsp> {
    if (!name) {
      return Promise.resolve({});
    }
    return this.restGet('/dataservers?name=' + name).then((response) => response.data);
  }
  // Get a list of all asset (AF) servers
  private getAssetServers(): Promise<PiwebapiRsp[]> {
    return this.restGet('/assetservers').then((response) => response.data.Items ?? []);
  }
  private getAssetServer(name: string | undefined): Promise<PiwebapiRsp> {
    if (!name) {
      return Promise.resolve({});
    }
    return this.restGet('/assetservers?path=\\\\' + name).then((response) => response.data);
  }
  private getDatabase(path: string | undefined): Promise<PiwebapiRsp> {
    if (!path) {
      return Promise.resolve({});
    }
    return this.restGet('/assetdatabases?path=\\\\' + path).then((response) => response.data);
  }
  getDatabases(serverId: string, options?: any): Promise<PiwebapiRsp[]> {
    if (!serverId) {
      return Promise.resolve([]);
    }
    return this.restGet('/assetservers/' + serverId + '/assetdatabases').then((response) => response.data.Items ?? []);
  }
  getElement(path: string): Promise<PiwebapiRsp> {
    if (!path) {
      return Promise.resolve({});
    }
    return this.restGet('/elements?path=\\\\' + path).then((response) => response.data);
  }
  getEventFrameTemplates(databaseId: string): Promise<PiwebapiRsp[]> {
    if (!databaseId) {
      return Promise.resolve([]);
    }
    return this.restGet(
      '/assetdatabases/' + databaseId + '/elementtemplates?selectedFields=Items.InstanceType%3BItems.Name%3BItems.WebId'
    ).then((response) => {
      return filter(response.data.Items ?? [], (item) => item.InstanceType === 'EventFrame');
    });
  }
  getElementTemplates(databaseId: string): Promise<PiwebapiRsp[]> {
    if (!databaseId) {
      return Promise.resolve([]);
    }
    return this.restGet(
      '/assetdatabases/' + databaseId + '/elementtemplates?selectedFields=Items.InstanceType%3BItems.Name%3BItems.WebId'
    ).then((response) => {
      return filter(response.data.Items ?? [], (item) => item.InstanceType === 'Element');
    });
  }

  /**
   * @description
   * Get the child attributes of the current resource.
   * GET attributes/{webId}/attributes
   * @param {string} elementId - The ID of the parent resource. See WebID for more information.
   * @param {Object} options - Query Options
   * @param {string} options.nameFilter - The name query string used for finding attributes. The default is no filter. See Query String for more information.
   * @param {string} options.categoryName - Specify that returned attributes must have this category. The default is no category filter.
   * @param {string} options.templateName - Specify that returned attributes must be members of this template. The default is no template filter.
   * @param {string} options.valueType - Specify that returned attributes' value type must be the given value type. The default is no value type filter.
   * @param {string} options.searchFullHierarchy - Specifies if the search should include attributes nested further than the immediate attributes of the searchRoot. The default is 'false'.
   * @param {string} options.sortField - The field or property of the object used to sort the returned collection. The default is 'Name'.
   * @param {string} options.sortOrder - The order that the returned collection is sorted. The default is 'Ascending'.
   * @param {string} options.startIndex - The starting index (zero based) of the items to be returned. The default is 0.
   * @param {string} options.showExcluded - Specified if the search should include attributes with the Excluded property set. The default is 'false'.
   * @param {string} options.showHidden - Specified if the search should include attributes with the Hidden property set. The default is 'false'.
   * @param {string} options.maxCount - The maximum number of objects to be returned per call (page size). The default is 1000.
   * @param {string} options.selectedFields - List of fields to be returned in the response, separated by semicolons (;). If this parameter is not specified, all available fields will be returned. See Selected Fields for more information.
   */
  private getAttributes(elementId: string, options: any): Promise<PiwebapiRsp[]> {
    var querystring =
      '?' +
      map(options, (value, key) => {
        return key + '=' + value;
      }).join('&');

    if (querystring === '?') {
      querystring = '';
    }

    return this.restGet('/elements/' + elementId + '/attributes' + querystring).then(
      (response) => response.data.Items ?? []
    );
  }

  /**
   * @description
   * Retrieve elements based on the specified conditions. By default, this method selects immediate children of the current resource.
   * Users can search for the elements based on specific search parameters. If no parameters are specified in the search, the default values for each parameter will be used and will return the elements that match the default search.
   * GET assetdatabases/{webId}/elements
   * @param {string} databaseId - The ID of the parent resource. See WebID for more information.
   * @param {Object} options - Query Options
   * @param {string} options.webId - The ID of the resource to use as the root of the search. See WebID for more information.
   * @param {string} options.nameFilter - The name query string used for finding objects. The default is no filter. See Query String for more information.
   * @param {string} options.categoryName - Specify that returned elements must have this category. The default is no category filter.
   * @param {string} options.templateName - Specify that returned elements must have this template or a template derived from this template. The default is no template filter.
   * @param {string} options.elementType - Specify that returned elements must have this type. The default type is 'Any'. See Element Type for more information.
   * @param {string} options.searchFullHierarchy - Specifies if the search should include objects nested further than the immediate children of the searchRoot. The default is 'false'.
   * @param {string} options.sortField - The field or property of the object used to sort the returned collection. The default is 'Name'.
   * @param {string} options.sortOrder - The order that the returned collection is sorted. The default is 'Ascending'.
   * @param {number} options.startIndex - The starting index (zero based) of the items to be returned. The default is 0.
   * @param {number} options.maxCount - The maximum number of objects to be returned per call (page size). The default is 1000.
   * @param {string} options.selectedFields -  List of fields to be returned in the response, separated by semicolons (;). If this parameter is not specified, all available fields will be returned. See Selected Fields for more information.
   */
  private getDatabaseElements(databaseId: string, options: any): Promise<PiwebapiRsp[]> {
    var querystring =
      '?' +
      map(options, (value, key) => {
        return key + '=' + value;
      }).join('&');

    if (querystring === '?') {
      querystring = '';
    }

    return this.restGet('/assetdatabases/' + databaseId + '/elements' + querystring).then(
      (response) => response.data.Items ?? []
    );
  }

  /**
   * @description
   * Retrieve elements based on the specified conditions. By default, this method selects immediate children of the current resource.
   * Users can search for the elements based on specific search parameters. If no parameters are specified in the search, the default values for each parameter will be used and will return the elements that match the default search.
   * GET elements/{webId}/elements
   * @param {string} databaseId - The ID of the resource to use as the root of the search. See WebID for more information.
   * @param {Object} options - Query Options
   * @param {string} options.webId - The ID of the resource to use as the root of the search. See WebID for more information.
   * @param {string} options.nameFilter - The name query string used for finding objects. The default is no filter. See Query String for more information.
   * @param {string} options.categoryName - Specify that returned elements must have this category. The default is no category filter.
   * @param {string} options.templateName - Specify that returned elements must have this template or a template derived from this template. The default is no template filter.
   * @param {string} options.elementType - Specify that returned elements must have this type. The default type is 'Any'. See Element Type for more information.
   * @param {string} options.searchFullHierarchy - Specifies if the search should include objects nested further than the immediate children of the searchRoot. The default is 'false'.
   * @param {string} options.sortField - The field or property of the object used to sort the returned collection. The default is 'Name'.
   * @param {string} options.sortOrder - The order that the returned collection is sorted. The default is 'Ascending'.
   * @param {number} options.startIndex - The starting index (zero based) of the items to be returned. The default is 0.
   * @param {number} options.maxCount - The maximum number of objects to be returned per call (page size). The default is 1000.
   * @param {string} options.selectedFields -  List of fields to be returned in the response, separated by semicolons (;). If this parameter is not specified, all available fields will be returned. See Selected Fields for more information.
   */
  private getElements(elementId: string, options: any): Promise<PiwebapiRsp[]> {
    var querystring =
      '?' +
      map(options, (value, key) => {
        return key + '=' + value;
      }).join('&');

    if (querystring === '?') {
      querystring = '';
    }

    return this.restGet('/elements/' + elementId + '/elements' + querystring).then(
      (response) => response.data.Items ?? []
    );
  }

  /**
   * Retrieve a list of points on a specified Data Server.
   *
   * @param {string} serverId - The ID of the server. See WebID for more information.
   * @param {string} nameFilter - A query string for filtering by point name. The default is no filter. *, ?, [ab], [!ab]
   */
  private piPointSearch(serverId: string, nameFilter: string): Promise<PiwebapiRsp[]> {
    let filter1 = this.templateSrv.replace(nameFilter);
    let filter2 = `${filter1}`;
    let doFilter = false;
    if (filter1 !== nameFilter) {
      const regex = /\{(\w|,)+\}/gs;
      let m;
      while ((m = regex.exec(filter1)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
          if (groupIndex === 0) {
            filter1 = filter1.replace(match, match.replace('{', '(').replace('}', ')').replace(',', '|'));
            filter2 = filter2.replace(match, '*');
            doFilter = true;
          }
        });
      }
    }
    return this.restGet('/dataservers/' + serverId + '/points?maxCount=20&nameFilter=' + filter2).then((results) => {
      if (!!results && !!results.data?.Items) {
        return doFilter ? results.data.Items.filter((item) => item.Name?.match(filter1)) : results.data.Items;
      }
      return [];
    });
  }

  /**
   * Get the PI Web API webid or PI Point.
   *
   * @param {any} target - AF Path or Point name.
   * @returns - webid.
   *
   * @memberOf PiWebApiDatasource
   */
  getWebId(target: any) {
    var ds = this;
    var isAf = target.target.indexOf('\\') >= 0;
    var isAttribute = target.target.indexOf('|') >= 0;
    if (!isAf && target.target.indexOf('.') === -1) {
      return Promise.resolve([{ WebId: target.target, Name: target.display || target.target }]);
    }

    if (!isAf) {
      // pi point lookup
      return ds.piPointSearch(this.piserver.webid!, target.target).then((results) => {
        if (results === undefined || results.length === 0) {
          return [{ WebId: target.target, Name: target.display || target.target }];
        }
        return results;
      });
    } else if (isAf && isAttribute) {
      // af attribute lookup
      return ds.restGet('/attributes?path=\\\\' + target.target).then((results) => {
        if (results.data === undefined || results.status !== 200) {
          return [{ WebId: target.target, Name: target.display || target.target }];
        }
        // rewrite name if specified
        results.data.Name = target.display || results.data.Name;
        return [results.data];
      });
    } else {
      // af element lookup
      return ds.restGet('/elements?path=\\\\' + target.target).then((results) => {
        if (results.data === undefined || results.status !== 200) {
          return [{ WebId: target.target, Name: target.display || target.target }];
        }
        // rewrite name if specified
        results.data.Name = target.display || results.data.Name;
        return [results.data];
      });
    }
  }
}
