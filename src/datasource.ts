import { filter, flatten, map, uniqBy } from 'lodash';

import { Observable, of } from 'rxjs';

import {
  DataSourceInstanceSettings,
  MetricFindValue,
  AnnotationQuery,
  ScopedVars,
  AnnotationEvent,
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  SelectableValue,
} from '@grafana/data';
import { getTemplateSrv, TemplateSrv, DataSourceWithBackend } from '@grafana/runtime';

import { migrateQuery } from './queryVersion';
import { isVariableQueryLanguage, parseVariableQuery } from './variableQuery';
import { PiWebAPIVariableSupport } from './variableSupport';
import { PIWebAPIQuery, PIWebAPIDataSourceJsonData, PIWebAPISelectableValue, PiDataServer, PiwebapiRsp } from './types';
import {
  buildQueryString,
  expandVariableValues,
  firstVariableValue,
  formatVariableValue,
  hashCode,
  metricQueryTransform,
  removeServerPrefix,
  removeTime,
} from 'helper';

import { PiWebAPIAnnotationsQueryEditor } from 'query/AnnotationsQueryEditor';

/** The maximum number of PI point searches made for the values of the multi-value variables in a name filter. */
const MAX_POINT_SEARCHES = 10;

export class PiWebAPIDatasource extends DataSourceWithBackend<PIWebAPIQuery, PIWebAPIDataSourceJsonData> {
  piserver: PiDataServer;
  afserver: Pick<PiDataServer, 'name'>;
  afdatabase: Pick<PiDataServer, 'name'>;
  piPointConfig: boolean;
  useUnitConfig: boolean;
  useStreaming: boolean;

  constructor(
    instanceSettings: DataSourceInstanceSettings<PIWebAPIDataSourceJsonData>,
    readonly templateSrv: TemplateSrv = getTemplateSrv()
  ) {
    super(instanceSettings);

    this.piserver = { name: (instanceSettings.jsonData || {}).piserver, webid: undefined };
    this.afserver = { name: (instanceSettings.jsonData || {}).afserver };
    this.afdatabase = { name: (instanceSettings.jsonData || {}).afdatabase };
    this.piPointConfig = instanceSettings.jsonData.pipoint || false;
    this.useUnitConfig = instanceSettings.jsonData.useUnit || false;
    this.useStreaming = instanceSettings.jsonData.useStreaming || false;

    this.variables = new PiWebAPIVariableSupport(this);

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

    // the query editor uses the WebId of the configured PI server; a wrong name only leaves it unset
    this.getDataServer(this.piserver.name)
      .then((result: PiwebapiRsp) => (this.piserver.webid = result.WebId))
      .catch(() => undefined);
  }

  /**
   * This method overrides the applyTemplateVariables() method from the DataSourceWithBackend class.
   * It replaces the template variables in every field of the query before it is sent to the backend. Grafana calls
   * it for each query sent by query(), and also directly (interpolateVariablesInQueries) for queries that do not go
   * through query(): panels with expressions, Explore opened from a panel and alert rules created from a panel.
   * Templated variables are not able to be used for alerts or public facing dashboards.
   * The query is not modified: the result is a copy.
   *
   * @param {PIWebAPIQuery} query - The raw query configuration from the frontend as defined in the query editor.
   * @param {ScopedVars} scopedVars - The template variables that are defined in the query editor and dashboard.
   * @returns - PIWebAPIQuery.
   *
   * @memberOf PiWebApiDatasource
   */
  applyTemplateVariables(query: PIWebAPIQuery, scopedVars: ScopedVars): PIWebAPIQuery {
    const replace = (text: string | undefined, format?: string | Function) =>
      this.templateSrv.replace(text, scopedVars, format);
    const target = query.target ? removeServerPrefix(replace(query.target, formatVariableValue)) : '';

    if (query.isAnnotation) {
      // the name filter and category are PI Web API name filters (glob, as in 4.x); the backend splits the
      // attribute names on commas
      return {
        ...query,
        target,
        nameFilter: query.nameFilter ? replace(query.nameFilter, 'glob') : query.nameFilter,
        categoryName: query.categoryName ? replace(query.categoryName, 'glob') : query.categoryName,
        attribute: query.attribute?.name
          ? { ...query.attribute, name: replace(query.attribute.name, 'csv') }
          : query.attribute,
      };
    }

    // copies a segment or attribute with its template variables replaced, so the saved query keeps the variables
    const replaceSegment = (segment: SelectableValue<PIWebAPISelectableValue>) =>
      segment.value
        ? { ...segment, value: { ...segment.value, value: replace(segment.value.value, formatVariableValue) } }
        : segment;

    const migrated = migrateQuery(query);
    const tar = {
      enableStreaming: (() => {
        const es = migrated.enableStreaming ?? { enable: false };
        if (es.variable && es.variable.trim() !== '') {
          const resolved = replace(es.variable.trim()).toLowerCase();
          return { ...es, enable: resolved === 'true' || resolved === '1' || resolved === 'yes' };
        }
        return es;
      })(),
      target,
      elementPath: replace(migrated.elementPath, formatVariableValue),
      attributes: map(migrated.attributes, replaceSegment),
      segments: map(migrated.segments, replaceSegment),
      isAnnotation: !!migrated.isAnnotation,
      // formatted like the target, so that a multi-value variable gives the same {value1,value2} group
      display: !!migrated.display ? replace(migrated.display, formatVariableValue) : undefined,
      refId: migrated.refId,
      hide: migrated.hide,
      interpolate: !!migrated.interpolate
        ? { ...migrated.interpolate, interval: replace(migrated.interpolate.interval) }
        : { enable: false },
      useLastValue: migrated.useLastValue || { enable: false },
      useUnit: migrated.useUnit || { enable: false },
      recordedValues: migrated.recordedValues || { enable: false },
      digitalStates: migrated.digitalStates || { enable: false },
      regex: migrated.regex || { enable: false },
      expression: migrated.expression ? replace(migrated.expression) : '',
      summary: { ...(migrated.summary || { enable: false, types: [] }) },
      nodata: migrated.nodata,
      isPiPoint: !!migrated.isPiPoint,
      hideError: !!migrated.hideError,
      queryVersion: migrated.queryVersion,
      pluginVersion: migrated.pluginVersion,
      hashCode: '',
    };

    if (tar.summary.enable) {
      tar.summary.duration = !!tar.summary.duration ? replace(tar.summary.duration) : tar.summary.duration;
      tar.summary.sampleTypeInterval = !!tar.summary.sampleTypeInterval;
      tar.summary.sampleInterval = !!tar.summary.sampleInterval
        ? replace(tar.summary.sampleInterval)
        : tar.summary.sampleInterval;
    }

    tar.hashCode = hashCode(removeTime(tar));

    return { ...migrated, ...tar };
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
    if (isVariableQueryLanguage(query)) {
      return this.variableQuery(query, queryOptions);
    }
    const ds = this;
    const querydepth = ['servers', 'databases', 'databaseElements', 'elements'];
    if (typeof query === 'string') {
      query = JSON.parse(query as string);
    }
    if (queryOptions.isPiPoint) {
      query.path = this.templateSrv.replace(query.path, queryOptions, formatVariableValue);
    } else {
      if (query.path === '') {
        query.type = querydepth[0];
      } else {
        query.path = this.templateSrv.replace(query.path, queryOptions, formatVariableValue); // replace variables in the path
        query.path = query.path.split(';')[0]; // if the attribute is in the path, let's remote it
        if (query.type !== 'attributes') {
          query.type = querydepth[Math.max(0, Math.min(query.path.split('\\').length, querydepth.length - 1))];
        }
      }
      // multi-value variables: browse the hierarchy using the first selected value
      query.path = firstVariableValue(query.path);
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
      return ds.getDatabases(query.afServerWebId).then(metricQueryTransform);
    } else if (query.type === 'databases') {
      return ds
        .getAssetServer(query.path)
        .then((server) => ds.getDatabases(server.WebId ?? ''))
        .then(metricQueryTransform);
    } else if (query.type === 'databaseElements') {
      return ds
        .getDatabase(query.path)
        .then((db) =>
          ds.getDatabaseElements(db.WebId ?? '', {
            selectedFields: 'Items.WebId;Items.Name;Items.Items;Items.Path;Items.HasChildren',
          })
        )
        .then(metricQueryTransform);
    } else if (query.type === 'elements') {
      return ds
        .getElement(query.path)
        .then((element) =>
          ds.getElements(element.WebId ?? '', {
            selectedFields: 'Items.Description;Items.WebId;Items.Name;Items.Items;Items.Path;Items.HasChildren',
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
            selectedFields: 'Items.Type;Items.DefaultUnitsName;Items.Description;Items.WebId;Items.Name;Items.Path',
            nameFilter: query.filter,
            maxCount: query.max,
          })
        )
        .then(metricQueryTransform);
    } else if (query.type === 'dataserver') {
      return ds.getDataServers().then(metricQueryTransform);
    } else if (query.type === 'pipoint') {
      return ds.piPointSearch(query.webId, query.pointName, queryOptions).then(metricQueryTransform);
    }
    return Promise.reject('Bad type');
  }

  /**
   * Runs a variable query written in the query language (see variableQuery.ts), e.g.
   * `elements AFSERVER\Database\Plant nameFilter=Pump* searchFullHierarchy=true`.
   * Template variables are replaced in the target and in the option values; multi-value variables use their first
   * value.
   */
  async variableQuery(text: string, queryOptions?: any): Promise<MetricFindValue[]> {
    const query = parseVariableQuery(text);
    const replace = (value: string) =>
      firstVariableValue(this.templateSrv.replace(value, queryOptions?.scopedVars, formatVariableValue));
    const target = query.target !== undefined ? replace(query.target).replace(/^\\+/, '') : undefined;
    const options: Record<string, string> = {};
    for (const [name, value] of Object.entries(query.options)) {
      options[name] = replace(value);
    }
    const found = (item: PiwebapiRsp, what: string, name: string | undefined) => {
      if (!item?.WebId) {
        throw new Error(`${what} not found: ${name}`);
      }
      return item.WebId;
    };

    switch (query.type) {
      case 'servers':
        return metricQueryTransform(await this.getAssetServers());
      case 'dataservers':
        return metricQueryTransform(await this.getDataServers());
      case 'databases': {
        const name = target || this.afserver.name;
        if (!name) {
          throw new Error('Set the AF server, e.g. databases AFSERVER');
        }
        const server = await this.getAssetServer(name);
        return metricQueryTransform(await this.getDatabases(found(server, 'AF server', name)));
      }
      case 'elements': {
        const configured = this.afserver.name && this.afdatabase.name;
        const path = target || (configured ? this.afserver.name + '\\' + this.afdatabase.name : '');
        const depth = path.split('\\').length;
        if (!path || depth < 2) {
          throw new Error('Set the path of a database or element, e.g. elements AFSERVER\\Database\\Element');
        }
        if (depth === 2) {
          const database = await this.getDatabase(path);
          return metricQueryTransform(await this.getDatabaseElements(found(database, 'Database', path), options));
        }
        const element = await this.getElement(path);
        return metricQueryTransform(await this.getElements(found(element, 'Element', path), options));
      }
      case 'attributes': {
        const element = await this.getElement(target!);
        return metricQueryTransform(await this.getAttributes(found(element, 'Element', target), options));
      }
      case 'points': {
        const { server, ...pointOptions } = options;
        const name = server || this.piserver.name;
        if (!name) {
          throw new Error('Set the PI server, e.g. points PIT-* server=PISERVER');
        }
        const dataServer = await this.getDataServer(name);
        const points = await this.restGet(
          '/dataservers/' + found(dataServer, 'PI server', name) + '/points' + buildQueryString(pointOptions)
        );
        return metricQueryTransform(points.Items ?? []);
      }
    }
  }

  /** PRIVATE SECTION */

  /**
   * Removes the queries that cannot be run and limits the number of data points. The template variables are
   * replaced afterwards by applyTemplateVariables, which DataSourceWithBackend.query calls for each query.
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
        if (annotationOptions.regex?.enable && annotationOptions.regex.search && annotationOptions.regex.replace) {
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
      map[field.name] = Array.from(field.values);
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
  private restGet(path: string): Promise<PiwebapiRsp> {
    return this.getResource(`${path}`).then((response: any) => {
      return response as PiwebapiRsp;
    });
  }

  // Get a list of all data (PI) servers
  private getDataServers(): Promise<PiwebapiRsp[]> {
    return this.restGet('/dataservers').then((response) => response.Items ?? []);
  }
  private getDataServer(name: string | undefined): Promise<PiwebapiRsp> {
    if (!name) {
      return Promise.resolve({});
    }
    return this.restGet('/dataservers' + buildQueryString({ name })).then((response) => response);
  }
  // Get a list of all asset (AF) servers
  getAssetServers(): Promise<PiwebapiRsp[]> {
    return this.restGet('/assetservers').then((response) => response.Items ?? []);
  }
  getAssetServer(name: string | undefined): Promise<PiwebapiRsp> {
    if (!name) {
      return Promise.resolve({});
    }
    return this.restGet('/assetservers' + buildQueryString({ path: '\\\\' + name })).then((response) => response);
  }
  getDatabase(path: string | undefined): Promise<PiwebapiRsp> {
    if (!path) {
      return Promise.resolve({});
    }
    return this.restGet('/assetdatabases' + buildQueryString({ path: '\\\\' + path })).then((response) => response);
  }
  getDatabases(serverId: string): Promise<PiwebapiRsp[]> {
    if (!serverId) {
      return Promise.resolve([]);
    }
    return this.restGet('/assetservers/' + serverId + '/assetdatabases').then((response) => response.Items ?? []);
  }
  getElement(path: string): Promise<PiwebapiRsp> {
    if (!path) {
      return Promise.resolve({});
    }
    return this.restGet('/elements' + buildQueryString({ path: '\\\\' + path })).then((response) => response);
  }
  /** The categories of the database, used for its elements and event frames (e.g. eventframes/{webId}/categories). */
  getElementCategories(databaseId: string): Promise<PiwebapiRsp[]> {
    if (!databaseId) {
      return Promise.resolve([]);
    }
    const fields = buildQueryString({ selectedFields: 'Items.Name;Items.WebId;Items.Description' });
    return this.restGet('/assetdatabases/' + databaseId + '/elementcategories' + fields).then(
      (response) => response.Items ?? []
    );
  }
  getEventFrameTemplates(databaseId: string): Promise<PiwebapiRsp[]> {
    if (!databaseId) {
      return Promise.resolve([]);
    }
    return this.restGet(
      '/assetdatabases/' +
        databaseId +
        '/elementtemplates' +
        buildQueryString({ selectedFields: 'Items.InstanceType;Items.Name;Items.WebId' })
    ).then((response) => {
      return filter(response.Items ?? [], (item) => item.InstanceType === 'EventFrame');
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
    const querystring = buildQueryString(options ?? {});

    return this.restGet('/elements/' + elementId + '/attributes' + querystring).then(
      (response) => response.Items ?? []
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
    const querystring = buildQueryString(options ?? {});

    return this.restGet('/assetdatabases/' + databaseId + '/elements' + querystring).then(
      (response) => response.Items ?? []
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
    const querystring = buildQueryString(options ?? {});

    return this.restGet('/elements/' + elementId + '/elements' + querystring).then((response) => response.Items ?? []);
  }

  /**
   * Retrieve a list of points on a specified Data Server.
   * A multi-value variable in the name filter is searched value by value (at most MAX_POINT_SEARCHES searches) and
   * the points found are merged.
   *
   * @param {string} serverId - The ID of the server. See WebID for more information.
   * @param {string} nameFilter - A query string for filtering by point name. The default is no filter. *, ?, [ab], [!ab]
   * @param {ScopedVars} scopedVars - The template variables of the panel.
   */
  private piPointSearch(serverId: string, nameFilter: string, scopedVars?: ScopedVars): Promise<PiwebapiRsp[]> {
    const nameFilters = expandVariableValues(
      this.templateSrv.replace(nameFilter, scopedVars, formatVariableValue),
      MAX_POINT_SEARCHES
    );
    const searches = nameFilters.map((name) =>
      this.restGet('/dataservers/' + serverId + '/points' + buildQueryString({ maxCount: 100, nameFilter: name })).then(
        (results) => results?.Items ?? []
      )
    );
    return Promise.all(searches).then((results) => uniqBy(flatten(results), (item) => item.WebId ?? item.Name));
  }
}
