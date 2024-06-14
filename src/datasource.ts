import { filter, map } from 'lodash';

import { Observable, of, firstValueFrom } from 'rxjs';

import {
  DataSourceInstanceSettings,
  MetricFindValue,
  AnnotationQuery,
  ScopedVars,
  AnnotationEvent,
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
} from '@grafana/data';
import { BackendSrv, getBackendSrv, getTemplateSrv, TemplateSrv, DataSourceWithBackend } from '@grafana/runtime';

import { PIWebAPIQuery, PIWebAPIDataSourceJsonData, PiDataServer, PiwebapiInternalRsp, PiwebapiRsp } from './types';
import { metricQueryTransform } from 'helper';

import { PiWebAPIAnnotationsQueryEditor } from 'query/AnnotationsQueryEditor';

export class PiWebAPIDatasource extends DataSourceWithBackend<PIWebAPIQuery, PIWebAPIDataSourceJsonData> {
  piserver: PiDataServer;
  afserver: PiDataServer;
  afdatabase: PiDataServer;
  piPointConfig: boolean;
  newFormatConfig: boolean;
  useUnitConfig: boolean;
  useExperimental: boolean;
  useStreaming: boolean;

  constructor(
    instanceSettings: DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>,
    readonly templateSrv: TemplateSrv = getTemplateSrv(),
    private readonly backendSrv: BackendSrv = getBackendSrv()
  ) {
    super(instanceSettings);

    this.piserver = { name: (instanceSettings.jsonData || {}).piserver, webid: undefined };
    this.afserver = { name: (instanceSettings.jsonData || {}).afserver, webid: undefined };
    this.afdatabase = { name: (instanceSettings.jsonData || {}).afdatabase, webid: undefined };
    this.piPointConfig = instanceSettings.jsonData.pipoint || false;
    this.newFormatConfig = instanceSettings.jsonData.newFormat || false;
    this.useUnitConfig = instanceSettings.jsonData.useUnit || false;
    this.useExperimental = instanceSettings.jsonData.useExperimental || false;
    this.useStreaming = instanceSettings.jsonData.useStreaming || false;

    this.annotations = {
      QueryEditor: PiWebAPIAnnotationsQueryEditor,
      prepareQuery(anno: AnnotationQuery<PIWebAPIQuery>): PIWebAPIQuery | undefined {
        if (anno.target) {
          anno.target.queryType = 'Annotation';
          anno.target.isAnnotation = true;
        }
        return anno.target;
      },
      processEvents: (
        anno: AnnotationQuery<PIWebAPIQuery>,
        data: DataFrame[]
      ): Observable<AnnotationEvent[] | undefined> => {
        return of(this.eventFrameToAnnotation(anno, data));
      },
    };

    Promise.all([
      this.getDataServer(this.piserver.name).then((result: PiwebapiRsp) => (this.piserver.webid = result.WebId)),
      this.getAssetServer(this.afserver.name).then((result: PiwebapiRsp) => (this.afserver.webid = result.WebId)),
      this.getDatabase(
        this.afserver.name && this.afdatabase.name ? this.afserver.name + '\\' + this.afdatabase.name : undefined
      ).then((result: PiwebapiRsp) => (this.afdatabase.webid = result.WebId)),
    ]);
  }

  /**
   * This method overrides the applyTemplateVariables() method from the DataSourceWithBackend class.
   * It is responsible for replacing the template variables in the query configuration prior
   * to sending the query to the backend. Templated variables are not able to be used for alerts
   * or public facing dashboards.
   *
   * @param {PIWebAPIQuery} query - The raw query configuration from the frontend as defined in the query editor.
   * @param {ScopedVars} scopedVars - The template variables that are defined in the query editor and dashboard.
   * @returns - PIWebAPIQuery.
   *
   * @memberOf PiWebApiDatasource
   */
  applyTemplateVariables(query: PIWebAPIQuery, scopedVars: ScopedVars) {
    return {
      ...query,
      target: query.target ? this.templateSrv.replace(query.target, scopedVars) : '',
    };
  }

  /**
   * This method makes the query to the backend.
   *
   * @param {DataQueryRequest<PIWebAPIQuery>}  options
   *
   * @memberOf PiWebApiDatasource
   */
  query(options: DataQueryRequest<PIWebAPIQuery>): Observable<DataQueryResponse> {
    if (options.targets.length === 1 && !!options.targets[0].isAnnotation) {
      return super.query(options);
    }

    const query = this.buildQueryParameters(options);
    if (query.targets.length <= 0) {
      return of({ data: [] });
    }

    return super.query(query);
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
    query.max = query.max ?? 10000;

    if (query.type === 'servers') {
      return ds.afserver?.name
        ? ds
            .getAssetServer(ds.afserver.name)
            .then((result: PiwebapiRsp) => [result])
            .then(metricQueryTransform)
        : ds.getAssetServers().then(metricQueryTransform);
    } else if (query.type === 'databases' && !!query.afServerWebId) {
      return ds.getDatabases(query.afServerWebId, {}).then(metricQueryTransform);
    } else if (query.type === 'databases') {
      return ds
        .getAssetServer(query.path)
        .then((server) => ds.getDatabases(server.WebId ?? '', {}))
        .then(metricQueryTransform);
    } else if (query.type === 'databaseElements') {
      return ds
        .getDatabase(query.path)
        .then((db) =>
          ds.getDatabaseElements(db.WebId ?? '', {
            selectedFields: 'Items.WebId%3BItems.Name%3BItems.Items%3BItems.Path%3BItems.HasChildren',
          })
        )
        .then(metricQueryTransform);
    } else if (query.type === 'elements') {
      return ds
        .getElement(query.path)
        .then((element) =>
          ds.getElements(element.WebId ?? '', {
            selectedFields:
              'Items.Description%3BItems.WebId%3BItems.Name%3BItems.Items%3BItems.Path%3BItems.HasChildren',
            nameFilter: query.filter,
          })
        )
        .then(metricQueryTransform);
    } else if (query.type === 'attributes') {
      return ds
        .getElement(query.path)
        .then((element) =>
          ds.getAttributes(element.WebId ?? '', {
            searchFullHierarchy: 'true',
            selectedFields:
              'Items.Type%3BItems.DefaultUnitsName%3BItems.Description%3BItems.WebId%3BItems.Name%3BItems.Path',
            nameFilter: query.filter,
            maxCount: query.max,
          })
        )
        .then(metricQueryTransform);
    } else if (query.type === 'dataserver') {
      return ds.getDataServers().then(metricQueryTransform);
    } else if (query.type === 'pipoint') {
      return ds.piPointSearch(query.webId, query.pointName).then(metricQueryTransform);
    }
    return Promise.reject('Bad type');
  }

  /** PRIVATE SECTION */

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
      if (!target || !target.target || target.attributes?.length === 0 || target.target === ';' || !!target.hide) {
        return false;
      }
      return !target.target.startsWith('Select AF');
    });

    if (options.maxDataPoints) {
      options.maxDataPoints = options.maxDataPoints > 30000 ? 30000 : options.maxDataPoints;
    }
    options.targets = map(options.targets, (target) => {
      const tar = {
        enableStreaming: target.enableStreaming,
        target: this.templateSrv.replace(target.target, options.scopedVars),
        elementPath: this.templateSrv.replace(target.elementPath, options.scopedVars),
        attributes: map(target.attributes, (att) => {
          if (att.value) {
            this.templateSrv.replace(att.value.value, options.scopedVars);
          }
          return att;
        }),
        segments: map(target.segments, (att) => {
          if (att.value) {
            this.templateSrv.replace(att.value.value, options.scopedVars);
          }
          return att;
        }),
        isAnnotation: !!target.isAnnotation,
        display: !!target.display ? this.templateSrv.replace(target.display, options.scopedVars) : undefined,
        refId: target.refId,
        hide: target.hide,
        interpolate: !!target.interpolate
          ? {
              ...target.interpolate,
              interval: this.templateSrv.replace(target.interpolate.interval, options.scopedVars),
            }
          : { enable: false },
        useLastValue: target.useLastValue || { enable: false },
        useUnit: target.useUnit || { enable: false },
        recordedValues: target.recordedValues || { enable: false },
        digitalStates: target.digitalStates || { enable: false },
        webid: target.webid ?? '',
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
        tar.summary.interval = !!tar.summary.interval
          ? this.templateSrv.replace(tar.summary.interval, options.scopedVars)
          : tar.summary.interval;
      }

      return tar;
    });

    return options;
  }

  /**
   * Localize the eventFrame dataFrame records to Grafana Annotations.
   * @param {any} annon - The annotation object.
   * @param {any} data - The dataframe recrords.
   * @returns - Grafana Annotation
   *
   * @memberOf PiWebApiDatasource
   */
  private eventFrameToAnnotation(annon: AnnotationQuery<PIWebAPIQuery>, data: DataFrame[]): AnnotationEvent[] {
    const annotationOptions = annon.target!;
    const events: AnnotationEvent[] = [];
    const currentLocale = Intl.DateTimeFormat().resolvedOptions().locale;

    data.forEach((d: DataFrame) => {
      let values = this.transformDataFrameToMap(d);
      for (let i = 0; i < values['time'].length; i++) {
        // replace Dataframe name using Regex
        let title = values['title'][i];
        if (annotationOptions.regex && annotationOptions.regex.enable) {
          title = title.replace(new RegExp(annotationOptions.regex.search), annotationOptions.regex.replace);
        }

        // test if timeEnd is negative and if so, set it to null
        if (values['timeEnd'][i] < 0) {
          values['timeEnd'][i] = null;
        }

        // format the text and localize the dates to browser locale
        let text = 'Tag: ' + title;
        if (annotationOptions.attribute && annotationOptions.attribute.enable) {
          text += values['attributeText'][i];
        }
        text += '<br />Start: ' + new Date(values['time'][i]).toLocaleString(currentLocale) + '<br />End: ';

        if (values['timeEnd'][i]) {
          text += new Date(values['timeEnd'][i]).toLocaleString(currentLocale);
        } else {
          text += 'Eventframe is open';
        }

        const event: AnnotationEvent = {
          time: values['time'][i],
          timeEnd: !!annotationOptions.showEndTime ? values['timeEnd'][i] : undefined,
          title: title,
          id: values['id'][i],
          text: text,
          tags: ['OSISoft PI'],
        };

        events.push(event);
      }
    });
    return events;
  }

  /**
   *
   */
  private transformDataFrameToMap(dataFrame: DataFrame): Record<string, any[]> {
    const map: Record<string, any[]> = {};

    dataFrame.fields.forEach((field) => {
      map[field.name] = field.values.toArray();
    });

    return map;
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
    const observable = this.backendSrv.fetch({
      url: `/api/datasources/${this.id}/resources${path}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    return firstValueFrom(observable).then((response: any) => {
      return response as PiwebapiInternalRsp;
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
}
