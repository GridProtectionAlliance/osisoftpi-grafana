import { each, filter, flatten, forOwn, groupBy, keys, map, uniq, omitBy } from 'lodash';
import { Observable, of } from 'rxjs';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  AnnotationEvent,
  MetricFindValue,
  Labels,
  AnnotationQuery,
  DataFrame,
  TableData,
  toDataFrame,
} from '@grafana/data';
import { BackendSrv, getBackendSrv, getTemplateSrv, TemplateSrv } from '@grafana/runtime';

import {
  PIWebAPIQuery,
  PIWebAPIDataSourceJsonData,
  PiDataServer,
  PiwebapTargetRsp,
  PiwebapiElementPath,
  PiwebapiInternalRsp,
  PiwebapiRsp,
} from './types';
import {
  checkNumber,
  convertTimeSeriesToDataFrame,
  getFinalUrl,
  getLastPath,
  getPath,
  lowerCaseFirstLetter,
  noDataReplace,
  parseRawQuery,
} from 'helper';

import { PiWebAPIAnnotationsQueryEditor } from 'AnnotationsQueryEditor';

export class PiWebAPIDatasource extends DataSourceApi<PIWebAPIQuery, PIWebAPIDataSourceJsonData> {
  piserver: PiDataServer;
  afserver: PiDataServer;
  afdatabase: PiDataServer;
  piPointConfig: boolean;
  newFormatConfig: boolean;

  url: string;
  name: string;
  isProxy = false;

  piwebapiurl?: string;
  webidCache: Map<String, any> = new Map();

  error: any;

  constructor(
    instanceSettings: DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>,
    readonly templateSrv: TemplateSrv = getTemplateSrv(),
    private readonly backendSrv: BackendSrv = getBackendSrv(),
  ) {
    super(instanceSettings);
  
    this.url = instanceSettings.url!;
    this.name = instanceSettings.name;

    this.piwebapiurl = instanceSettings.jsonData.url?.toString();
    this.isProxy = /^http(s)?:\/\//.test(this.url) || instanceSettings.jsonData.access === 'proxy';

    this.piserver = { name: (instanceSettings.jsonData || {}).piserver, webid: undefined };
    this.afserver = { name: (instanceSettings.jsonData || {}).afserver, webid: undefined };
    this.afdatabase = { name: (instanceSettings.jsonData || {}).afdatabase, webid: undefined };
    this.piPointConfig = instanceSettings.jsonData.pipoint || false;
    this.newFormatConfig = instanceSettings.jsonData.newFormat || false;

    this.annotations = {
      QueryEditor: PiWebAPIAnnotationsQueryEditor,
      prepareQuery(anno: AnnotationQuery<PIWebAPIQuery>): PIWebAPIQuery | undefined {
        if (anno.target) {
          anno.target.isAnnotation = true;
        }
        return anno.target;
      },
      processEvents: (anno: AnnotationQuery<PIWebAPIQuery>, data: DataFrame[]): Observable<AnnotationEvent[] | undefined> => {
        return of(this.eventFrameToAnnotation(anno, data));
      }
    }

    console.info('OSISoft PI Plugin v4.0.0');
    Promise.all([
      this.getDataServer(this.piserver.name).then((result: PiwebapiRsp) => (this.piserver.webid = result.WebId)),
      this.getAssetServer(this.afserver.name).then((result: PiwebapiRsp) => (this.afserver.webid = result.WebId)),
      this.getDatabase(this.afserver.name && this.afdatabase.name ? this.afserver.name + '\\' + this.afdatabase.name : undefined).then(
        (result: PiwebapiRsp) => (this.afdatabase.webid = result.WebId)
      ),
    ]).then(() => console.info('Datasource configured'));
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
    if (options.targets.length === 1 && !!options.targets[0].isAnnotation) {
      return this.processAnnotationQuery(options);
    }
  
    const ds = this;
    const query = this.buildQueryParameters(options);

    if (query.targets.length <= 0) {
      return Promise.resolve({ data: [] });
    } else {
      return Promise.all(ds.getStream(query)).then((targetResponses) => {
        let flattened: PiwebapTargetRsp[] = [];
        each(targetResponses, (tr) => {
          each(tr, (item) => flattened.push(item));
        });
        flattened = flattened.filter((v) => v.datapoints.length > 0);
        // handle no data properly
        if (flattened.length === 0) {
          return { data: [] };
        }
        const response: DataQueryResponse = {
          data: flattened
            .sort((a, b) => {
              return +(a.target > b.target) || +(a.target === b.target) - 1;
            })
            .map((d) => convertTimeSeriesToDataFrame(d)),
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
   * This method does the discovery of the AF Hierarchy and populates the query user interface segments.
   *
   * @param {any} query - Parses the query configuration and builds a PI Web API query.
   * @returns - Segment information.
   *
   * @memberOf PiWebApiDatasource
   */
  metricFindQuery(query: any, queryOptions: any): Promise<MetricFindValue[]> {
    const ds = this;
    const querydepth = ['servers', 'databases', 'databaseElements', 'elements'];
    if (typeof query === 'string') {
      query = JSON.parse(query as string);
    }
    if (queryOptions.isPiPoint) {
      query.path = this.templateSrv.replace(query.path, queryOptions);
    } else {
      if (query.path === '') {
        query.type = querydepth[0];
      } else {
        query.path = this.templateSrv.replace(query.path, queryOptions); // replace variables in the path
        query.path = query.path.split(';')[0]; // if the attribute is in the path, let's remote it
        if (query.type !== 'attributes') {
          query.type = querydepth[Math.max(0, Math.min(query.path.split('\\').length, querydepth.length - 1))];
        }
      }
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
            selectedFields: 'Items.Description%3BItems.WebId%3BItems.Name%3BItems.Items%3BItems.Path%3BItems.HasChildren',
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
            selectedFields: 'Items.Type%3BItems.DefaultUnitsName%3BItems.Description%3BItems.WebId%3BItems.Name%3BItems.Path',
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

  /** PRIVATE SECTION */

  /**
   * Datasource Implementation.
   * This queries PI Web API for Event Frames and converts them into annotations.
   *
   * @param {any} options - Annotation options, usually the Event Frame Category.
   * @returns - A Grafana annotation.
   *
   * @memberOf PiWebApiDatasource
   */
  private processAnnotationQuery(options: DataQueryRequest<PIWebAPIQuery>): Promise<DataQueryResponse> {
    const annotationQuery = options.targets[0];

    const categoryName = annotationQuery.categoryName
      ? this.templateSrv.replace(annotationQuery.categoryName, options.scopedVars, 'glob')
      : null;
    const nameFilter = annotationQuery.nameFilter
      ? this.templateSrv.replace(annotationQuery.nameFilter, options.scopedVars, 'glob')
      : null;
    const templateName = annotationQuery.template ?annotationQuery.template.Name : null;
    const annotationOptions = {
      datasource: annotationQuery.datasource,
      showEndTime: annotationQuery.showEndTime,
      regex: annotationQuery.regex,
      attribute: annotationQuery.attribute,
      categoryName: categoryName,
      templateName: templateName,
      nameFilter: nameFilter,
    };

    const filter = [];
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
      return Promise.resolve({ data: [] });
    }
    filter.push('startTime=' + options.range.from.toISOString());
    filter.push('endTime=' + options.range.to.toISOString());

    if (annotationOptions.attribute && annotationOptions.attribute.enable) {
      let resourceUrl =
        this.piwebapiurl + '/streamsets/{0}/value?selectedFields=Items.WebId%3BItems.Value%3BItems.Name';
      if (!!annotationOptions.attribute.name) {
        resourceUrl =
          this.piwebapiurl +
          '/streamsets/{0}/value?nameFilter=' +
          annotationOptions.attribute.name +
          '&selectedFields=Items.WebId%3BItems.Value%3BItems.Name';
      }
      const query: any = {};
      query['1'] = {
        Method: 'GET',
        Resource: this.piwebapiurl + '/assetdatabases/' + annotationQuery.database?.WebId + '/eventframes?' + filter.join('&'),
      };
      query['2'] = {
        Method: 'GET',
        RequestTemplate: {
          Resource: resourceUrl,
        },
        Parameters: ['$.1.Content.Items[*].WebId'],
        ParentIds: ['1'],
      };
      return this.restBatch(query).then((result) => {
        const data = result.data['1'].Content;
        const valueData = result.data['2'].Content;
        const response: TableData[] = data.Items!.map((item: any, index: number) => {
          const columns = [{ text: 'StartTime' }, { text: 'EndTime' }];
          const rows = [item.StartTime, item.EndTime];
          valueData.Items[index].Content.Items.forEach((it: any) => {
            columns.push({ text: it.Name });
            rows.push(String(it.Value.Value ? it.Value.Value.Name || it.Value.Value.Value || it.Value.Value : ''));
          });
          return {
            name: item.Name,
            columns,
            rows: [
              rows,
            ],
          };
        });

        return {
          data: response.map((r) => toDataFrame(r)),
        };
      });
    } else {
      return this.restGet('/assetdatabases/' + annotationQuery.database?.WebId + '/eventframes?' + filter.join('&')).then(
        (result) => {
          const response: TableData[] = result.data.Items!.map((item: any) => (
            {
              name: item.Name,
              columns: [{ text: 'StartTime' }, { text: 'EndTime' }],
              rows: [
                [item.StartTime, item.EndTime],
              ],
            }
          ));

          return {
            data: response.map((r) => toDataFrame(r)),
          };
        }
      );
    }
  }

  /**
   * Converts a PIWebAPI Event Frame response to a Grafana Annotation
   *
   * @param {any} annon - The annotation object.
   * @param {any} data - The dataframe recrords. 
   * @returns - Grafana Annotation
   *
   * @memberOf PiWebApiDatasource
   */
  private eventFrameToAnnotation(annon: AnnotationQuery<PIWebAPIQuery>, data: DataFrame[]): AnnotationEvent[] {
    const annotationOptions = annon.target!;
    const events: AnnotationEvent[] = [];
    data.forEach((d: DataFrame) => {
      let attributeText = '';
      const endTime = d.fields.find((f) => f.name === 'EndTime')?.values.get(0);
      const startTime = d.fields.find((f) => f.name === 'StartTime')?.values.get(0);
      const attributeDataItems = d.fields.filter((f) => ['StartTime', 'EndTime'].indexOf(f.name) < 0); 
      if (attributeDataItems) {
        each(attributeDataItems, (attributeData) => {
          attributeText += '<br />' + attributeData.name + ': ' + attributeData.values.get(0);
        });
      }
      let name = d.name!;
      if (annotationOptions.regex && annotationOptions.regex.enable) {
        name = name.replace(
          new RegExp(annotationOptions.regex.search),
          annotationOptions.regex.replace
        );
      }
      events.push({
        id: annotationOptions.database?.WebId,
        annotation: annon,
        title: `Name: ${annon.name}`,
        time: new Date(startTime).getTime(),
        timeEnd: !!annotationOptions.showEndTime ? new Date(endTime).getTime() : undefined,
        text: `Tag: ${name}` + attributeText + '<br />Start: ' +
          new Date(startTime).toLocaleString('pt-BR')  + '<br />End: ' +
          new Date(endTime).toLocaleString('pt-BR'),
        tags: ['OSISoft PI'],
      });
    });
    return events;
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
      if (!target || !target.target || !!target.hide) {
        return false;
      }
      return !target.target.startsWith('Select AF');
    });

    options.targets = map(options.targets, (target) => {
      if (!!target.rawQuery && !!target.target) {
        const { attributes, elementPath } = parseRawQuery(this.templateSrv.replace(target.target, options.scopedVars));
        target.attributes = attributes;
        target.elementPath = elementPath;
      }
      const ds = this;
      const tar = {
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
        isAnnotation: !!target.isAnnotation,
        segments: map(target.segments, (att) => this.templateSrv.replace(att.value?.value, options.scopedVars)),
        display: target.display,
        refId: target.refId,
        hide: target.hide,
        interpolate: target.interpolate || { enable: false },
        useLastValue: target.useLastValue || { enable: false },
        recordedValues: target.recordedValues || { enable: false },
        digitalStates: target.digitalStates || { enable: false },
        webid: target.webid ?? '',
        webids: target.webids || [],
        regex: target.regex || { enable: false },
        expression: target.expression || '',
        summary: target.summary || { types: [] },
        startTime: options.range.from,
        endTime: options.range.to,
        isPiPoint: !!target.isPiPoint,
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
   * Resolve PIWebAPI response 'value' data to value - timestamp pairs.
   *
   * @param {any} value - A list of PIWebAPI values.
   * @param {any} target - The target Grafana metric.
   * @param {boolean} isSummary - Boolean for tracking if data is of summary class.
   * @returns - An array of Grafana value, timestamp pairs.
   *
   */
  private parsePiPointValueData(value: any, target: any, isSummary: boolean) {
    const datapoints: any[] = [];
    if (Array.isArray(value)) {
      each(value, (item) => {
        this.piPointValue(isSummary ? item.Value : item, target, isSummary, datapoints);
      });
    } else {
      this.piPointValue(value, target, isSummary, datapoints);
    }
    return datapoints;
  }

  /**
   * Resolve PIWebAPI response 'value' data to value - timestamp pairs.
   *
   * @param {any} value - PI Point value.
   * @param {any} target - The target grafana metric.
   * @param {boolean} isSummary - Boolean for tracking if data is of summary class.
   * @param {any[]} datapoints - Array with Grafana datapoints.
   *
   */
  private piPointValue(value: any, target: any, isSummary: boolean, datapoints: any[]) {
    // @ts-ignore
    const { grafanaDataPoint, previousValue, drop } = noDataReplace(
      value,
      target.summary.nodata,
      this.parsePiPointValue(value, target, isSummary)
    );
    if (!drop) {
      datapoints.push(grafanaDataPoint);
    }
  }

  /**
   * Convert a PI Point value to use Grafana value/timestamp.
   *
   * @param {any} value - PI Point value.
   * @param {any} target - The target grafana metric.
   * @param {boolean} isSummary - Boolean for tracking if data is of summary class.
   * @returns - Grafana value pair.
   *
   */
  private parsePiPointValue(value: any, target: any, isSummary: boolean) {
    let num = !isSummary && typeof value.Value === 'object' ? value.Value?.Value : value.Value;

    if (!value.Good || !!target.digitalStates?.enable) {
      num = (!isSummary && typeof value.Value === 'object' ? value.Value?.Name : value.Name) ?? '';
      return [checkNumber(num) ? Number(num) : num.trim(), new Date(value.Timestamp).getTime()];
    }

    return [checkNumber(num) ? Number(num) : num.trim(), new Date(value.Timestamp).getTime()];
  }

  /**
   * Convert the Pi web api response object to the Grafana Labels object.
   *
   * @param {PiwebapiRsp} webid - Pi web api response object.
   * @returns The converted Labels object.
   */
  private toTags(webid: PiwebapiRsp, isPiPoint: boolean): Labels {
    const omitArray = ['Path', 'WebId', 'Id', 'ServerTime', 'ServerVersion'];
    const obj = omitBy(webid, (value: any, key: string) => !value || !value.length || omitArray.indexOf(key) >= 0);
    obj.Element = isPiPoint ? this.piserver.name : getLastPath(webid.Path ?? '');
    const sorted = Object.keys(obj)
      .sort()
      .reduce((accumulator: any, key: string) => {
        accumulator[lowerCaseFirstLetter(key)] = obj[key];
        return accumulator;
      }, {});
    return sorted as Labels;
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
  private processResults(content: any, target: any, name: any, noTemplate: boolean, webid: PiwebapiRsp): PiwebapTargetRsp[] {
    const api = this;
    const isSummary: boolean = target.summary && target.summary.types && target.summary.types.length > 0;
    if (!target.isPiPoint && !target.display) {
      if (this.newFormatConfig) {
        name = (noTemplate ? getLastPath(content.Path) : getPath(target.elementPathArray, content.Path)) + '|' + name;
      } else {
        name = noTemplate ? name : getPath(target.elementPathArray, content.Path) + '|' + name;
      }
    }
    if (target.regex && target.regex.enable && target.regex.search.length && target.regex.replace.length) {
      name = name.replace(new RegExp(target.regex.search), target.regex.replace);
    }
    if (isSummary) {
      const innerResults: PiwebapTargetRsp[] = [];
      const groups = groupBy(content.Items, (item: any) => item.Type);
      forOwn(groups, (value, key) => {
        innerResults.push({
          refId: target.refId,
          target: name + '[' + key + ']',
          meta: {
            path: webid.Path,
            pathSeparator: '\\'
          },
          tags: this.newFormatConfig ? api.toTags(webid, target.isPiPoint) : {},
          datapoints: api.parsePiPointValueData(value, target, isSummary),
          path: webid.Path,
          unit: webid.DefaultUnitsName,
        });
      });
      return innerResults;
    }
    const results: PiwebapTargetRsp[] = [
      {
        refId: target.refId,
        target: name,
        meta: {
          path: webid.Path,
          pathSeparator: '\\'
        },
        tags: this.newFormatConfig ? api.toTags(webid, target.isPiPoint) : {},
        datapoints: api.parsePiPointValueData(content.Items || content.Value, target, isSummary),
        path: webid.Path,
        unit: webid.DefaultUnitsName,
      },
    ];
    return results;
  }

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
   * Gets historical data from a PI Web API stream source.
   *
   * @param {any} query - Grafana query.
   * @returns - Metric data.
   *
   * @memberOf PiWebApiDatasource
   */
  private getStream(query: any): Array<Promise<PiwebapTargetRsp[]>> {
    const ds = this;
    const results: Array<Promise<PiwebapTargetRsp[]>> = [];

    each(query.targets, (target) => {
      // pi point config disabled
      if (target.isPiPoint && !ds.piPointConfig) {
        console.error('Trying to call Pi Point server with Pi Point config disabled');
        return;
      }
      target.attributes = filter(target.attributes || [], (attribute) => {
        return 1 && attribute;
      });
      let url = '';
      const isSummary = target.summary && target.summary.types && target.summary.types.length > 0;
      const isInterpolated = target.interpolate && target.interpolate.enable;
      // perhaps add a check to see if interpolate override time < query.interval
      const intervalTime = target.interpolate.interval ? target.interpolate.interval : query.interval;
      const timeRange = '?startTime=' + query.range.from.toJSON() + '&endTime=' + query.range.to.toJSON();
      const targetName = target.expression || target.elementPath;
      const displayName = target.display ? this.templateSrv.replace(target.display, query.scopedVars) : null;
      if (target.expression) {
        url += '/calculation';
        if (isSummary) {
          url += '/summary' + timeRange + (isInterpolated ? '&sampleType=Interval&sampleInterval=' + intervalTime : '');
        } else if (isInterpolated) {
          url += '/intervals' + timeRange + '&sampleInterval=' + intervalTime;
        } else {
          url += '/recorded' + timeRange;
        }
        url += '&expression=' + encodeURIComponent(target.expression.replace(/\${intervalTime}/g, intervalTime));
        if (target.attributes.length > 0) {
          results.push(ds.createBatchGetWebId(target, url, displayName));
        } else {
          results.push(
            ds.restGetWebId(target.elementPath, false).then((webidresponse: PiwebapiRsp) => {
              return ds
                .restPost(url + webidresponse.WebId)
                .then((response: any) => ds.processResults(response.data, target, displayName || targetName, false, webidresponse))
                .catch((err: any) => (ds.error = err));
            })
          );
        }
      } else {
        url += '/streamsets';
        if (isSummary) {
          url += '/summary' + timeRange + '&intervals=' + query.maxDataPoints + this.getSummaryUrl(target.summary);
        } else if (isInterpolated) {
          url += '/interpolated' + timeRange + '&interval=' + intervalTime;
        } else if (target.recordedValues && target.recordedValues.enable) {
          const maxNumber =
            target.recordedValues.maxNumber && !isNaN(target.recordedValues.maxNumber)
              ? target.recordedValues.maxNumber
              : query.maxDataPoints;
          url += '/recorded' + timeRange + '&maxCount=' + maxNumber;
        } else if (target.useLastValue?.enable) {
          url += '/value?time=' + query.range.to.toJSON();
        } else {
          url += '/plot' + timeRange + '&intervals=' + query.maxDataPoints;
        }
        results.push(ds.createBatchGetWebId(target, url, displayName));
      }
    });

    return results;
  }

  /**
   * Process batch response to metric data.
   *
   * @param {any} response - The batch response.
   * @param {any} target - Grafana query target.
   * @param {string} displayName - The display name.
   * @returns - Process metric data.
   */
  private handleBatchResponse(response: any, target: any, displayName: string | null): Promise<PiwebapTargetRsp[]> {
    const targetName = target.expression || target.elementPath;
    const noTemplate = target.elementPathArray.length === 1 && target.elementPath === target.elementPathArray[0].path;
    let index = 1;
    const targetResults: PiwebapTargetRsp[] = [];
    for (const _ of target.attributes) {
      const dataKey = `Req${index + 1000}`;
      const path = response.config.data[dataKey].Headers 
        ? response.config.data[dataKey].Headers['Asset-Path']
        : null;
      const data = response.data[dataKey];
      if (data.Status >= 400) {
        continue;
      }

      let webid: PiwebapiRsp;
      if (!!path) {
        webid = this.webidCache.get(path);
      } else {
        const respData = response.data[`Req${index}`].Content;
        webid = {
          Path: respData.Path!,
          Type: respData.Type || respData.PointType,
          DefaultUnitsName: respData.DefaultUnitsName || respData.EngineeringUnits,
          Description: respData.Description || respData.Descriptor,
          WebId: respData.WebId,
          Name: respData.Name,
        }
        this.webidCache.set(webid.Path!, webid);
      }

      if (target.expression) {
        each(
          this.processResults(data.Content, target, displayName || webid.Name || targetName, noTemplate, webid),
          (targetResult) => targetResults.push(targetResult)
        );
      } else {
        each(data.Content.Items, (item) => {  
          each(
            this.processResults(item, target, displayName || item.Name || targetName, noTemplate, webid),
            (targetResult) => targetResults.push(targetResult)
          );
        });
      }
      index++;
    }
    return Promise.resolve(targetResults);
  }

  /**
   * Creates a batch query pair.
   *
   * @param {boolean} isPiPoint - is Pi point flag.
   * @param {string} elementPath - the PI element path or PI Data server name.
   * @param {string} attribute - the attribute or PI point name.
   * @param {any} query - the batch query to build.
   * @param {number} index - the current query index.
   * @param {boolean} replace - is pi point and calculation.
   * @param {string} url - the base url to call. 
   */
  private createQueryPair(
    isPiPoint: boolean,
    elementPath: string,
    attribute: string,
    query: any,
    index: number,
    replace: boolean,
    url: string,
  ) {
    let path = '';
    let assetPath = '';
    if (isPiPoint) {
      assetPath = '\\\\' + elementPath + '\\' + attribute;
      path = '/points?selectedFields=Descriptor%3BPointType%3BEngineeringUnits%3BWebId%3BName%3BPath&path=' + assetPath;
    } else {
      assetPath = '\\\\' + elementPath + '|' + attribute;
      path = '/attributes?selectedFields=Type%3BDefaultUnitsName%3BDescription%3BWebId%3BName%3BPath&path=' + assetPath;
    }

    const data = this.webidCache.get(assetPath);
    if (!!data) {
      query[`Req${index + 1000}`] = {
        Method: 'GET',
        Resource: this.piwebapiurl + getFinalUrl(replace, { Name: attribute }, url) + '&webId=' +
          (replace ? this.piserver.webid: data.WebId),
        Headers: {
          'Asset-Path': assetPath
        }
      };
    } else {
      query[`Req${index}`] = {
        Method: 'GET',
        Resource: this.piwebapiurl + path,
      };
      query[`Req${index + 1000}`] = {
        Method: 'GET',
        ParentIds: [ 
          `Req${index}`
        ],
        Parameters: [
          `$.Req${index}.Content.WebId`
        ],
        Resource: this.piwebapiurl + getFinalUrl(replace, { Name: attribute }, url) + 
          (replace ? '&webId=' + this.piserver.webid: '&webId={0}'),
      };
    }
  }

  /**
   * Get metric data using Batch.
   *
   * @param {any} target - Grafana query target.
   * @param {string} url The base URL for the query.
   * @param {string} displayName - The display name.
   * @returns - Metric data.
   */
  private createBatchGetWebId(target: any, url: string, displayName: string | null): Promise<PiwebapTargetRsp[]> {
    const noTemplate = target.elementPathArray.length === 1 && target.elementPath === target.elementPathArray[0].path;
    const replace = target.isPiPoint && !!target.expression;
    const query: any = {};
    let index = 1;
    for (const attribute of target.attributes) {
      if (noTemplate) {
        this.createQueryPair(target.isPiPoint, target.elementPath, attribute, query, index, replace, url);
        index++;
      } else {
        target.elementPathArray.forEach((elementPath: PiwebapiElementPath) => {
          this.createQueryPair(target.isPiPoint, elementPath.path, attribute, query, index, replace, url);
          index++;
        });
      }
    }
    return this.restBatch(query).then((response: any) => this.handleBatchResponse(response, target, displayName));
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
    const ds = this;

    // check cache
    const cachedWebId = ds.webidCache.get(assetPath);
    if (cachedWebId) {
      return Promise.resolve({
        ...cachedWebId,
      });
    }

    // no cache hit, query server
    let path = '';
    if (isPiPoint) {
      path = '/points?selectedFields=Descriptor%3BPointType%3BEngineeringUnits%3BWebId%3BName%3BPath&path=\\\\' + assetPath.replace('|', '\\');
    } else {
      path =
        (assetPath.indexOf('|') >= 0
          ? '/attributes?selectedFields=Type%3BDefaultUnitsName%3BDescription%3BWebId%3BName%3BPath&path=\\\\'
          : '/elements?selectedFields=Description%3BWebId%3BName%3BPath&path=\\\\') + assetPath;
    }

    return this.backendSrv
      .datasourceRequest({
        url: this.url + path,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      .then((response: any) => {
        const data = {
          Path: assetPath,
          Type: response.data.Type || response.data.PointType,
          DefaultUnitsName: response.data.DefaultUnitsName || response.data.EngineeringUnits,
          Description: response.data.Description || response.data.Descriptor,
          WebId: response.data.WebId,
          Name: response.data.Name,
        }
        ds.webidCache.set(assetPath, data);
        return {
          ...data,
        };
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
  getAssetServer(name: string | undefined): Promise<PiwebapiRsp> {
    if (!name) {
      return Promise.resolve({});
    }
    return this.restGet('/assetservers?path=\\\\' + name).then((response) => response.data);
  }
  getDatabase(path: string | undefined): Promise<PiwebapiRsp> {
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
    let querystring =
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
    let querystring =
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
    let querystring =
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
    return this.restGet('/dataservers/' + serverId + '/points?maxCount=50&nameFilter=' + filter2).then((results) => {
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
    const ds = this;
    const isAf = target.target.indexOf('\\') >= 0;
    const isAttribute = target.target.indexOf('|') >= 0;
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
