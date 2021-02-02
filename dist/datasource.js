'use strict';

System.register(['angular', 'lodash'], function (_export, _context) {
  "use strict";

  var angular, _, _typeof, _createClass, PiWebApiDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_angular) {
      angular = _angular.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('PiWebApiDatasource', PiWebApiDatasource = function () {
        /**
         * Creates an instance of PiWebApiDatasource.
         * 
         * @param {any} instanceSettings - Settings from admin page.
         * @param {any} backendSrv - Grafana backend web communications.
         * @param {any} templateSrv - Grafana template server.
         * @param {any} $q - Angular async/promise helper.
         * @param {any} $cacheFactory - A cache for PI Web API webids for element paths.
         * 
         * @memberOf PiWebApiDatasource
         */
        function PiWebApiDatasource(instanceSettings, backendSrv, templateSrv, $q, $cacheFactory) {
          var _this = this;

          _classCallCheck(this, PiWebApiDatasource);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
          this.webidCache = $cacheFactory.get('piWebApiIds') || $cacheFactory('piWebApiIds');

          this.type = instanceSettings.type;
          this.url = instanceSettings.url.toString();
          this.piwebapiurl = instanceSettings.jsonData.url.toString();
          this.isProxy = /^http(s)?:\/\//.test(this.url) || instanceSettings.jsonData.access === 'proxy';

          this.name = instanceSettings.name;
          this.piserver = { name: (instanceSettings.jsonData || {}).piserver, webid: null };
          this.afserver = { name: (instanceSettings.jsonData || {}).afserver, webid: null };
          this.afdatabase = { name: (instanceSettings.jsonData || {}).afdatabase, webid: null };

          this.getAssetServer(this.afserver.name).then(function (result) {
            _this.afserver.webid = result.WebId;
          });
          this.getDataServer(this.piserver.name).then(function (result) {
            _this.piserver.webid = result.WebId;
          });
          this.getDatabase(this.afserver.name + '\\' + this.afdatabase.name).then(function (result) {
            _this.afdatabase.webid = result.WebId;
          });
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


        _createClass(PiWebApiDatasource, [{
          key: 'eventFrameToAnnotation',
          value: function eventFrameToAnnotation(annotationOptions, endTime, eventFrame, attributeDataItems) {
            if (annotationOptions.regex && annotationOptions.regex.enable) {
              eventFrame.Name = eventFrame.Name.replace(new RegExp(annotationOptions.regex.search), annotationOptions.regex.replace);
            }

            var attributeText = '';
            if (attributeDataItems) {
              _.each(attributeDataItems, function (attributeData) {
                var attributeValue = attributeData.Value.Value ? attributeData.Value.Value.Name || attributeData.Value.Value.Value || attributeData.Value.Value : null;
                attributeText += '<br />' + attributeData.Name + ': ' + attributeValue;
              });
            }
            return {
              annotation: annotationOptions,
              title: (endTime ? 'END ' : annotationOptions.showEndTime ? 'START ' : '') + annotationOptions.name,
              time: new Date(endTime ? eventFrame.EndTime : eventFrame.StartTime).getTime(),
              text: eventFrame.Name + attributeText + '<br />Start: ' + eventFrame.StartTime + '<br />End: ' + eventFrame.EndTime
              // tags: eventFrame.CategoryNames.join()
            };
          }
        }, {
          key: 'buildQueryParameters',
          value: function buildQueryParameters(options) {
            var _this2 = this;

            options.targets = _.filter(options.targets, function (target) {
              return !target.target.startsWith('Select AF');
            });

            options.targets = _.map(options.targets, function (target) {
              var tar = {
                target: _this2.templateSrv.replace(target.elementPath, options.scopedVars),
                elementPath: _this2.templateSrv.replace(target.elementPath, options.scopedVars),
                attributes: _.map(target.attributes, function (att) {
                  return _this2.templateSrv.replace(att);
                }),
                display: target.display,
                refId: target.refId,
                hide: target.hide,
                interpolate: target.interpolate || { enable: false },
                recordedValues: target.recordedValues || { enable: false },
                webid: target.webid,
                webids: target.webids || [],
                regex: target.regex || { enable: false },
                expression: target.expression || '',
                summary: target.summary || { types: [] },
                startTime: options.range.from.toJSON(),
                endTime: options.range.to.toJSON(),
                isPiPoint: target.isPiPoint
              };

              if (tar.expression) {
                tar.expression = _this2.templateSrv.replace(tar.expression);
              }

              if (tar.summary.types !== undefined) {
                tar.summary.types = _.filter(tar.summary.types, function (item) {
                  return item !== undefined && item !== null && item !== '';
                });
              }

              return tar;
            });

            return options;
          }
        }, {
          key: 'query',
          value: function query(options) {
            var ds = this;

            var query = this.buildQueryParameters(options);
            query.targets = _.filter(query.targets, function (t) {
              return !t.hide;
            });

            if (query.targets.length <= 0) {
              return this.$q.when({ data: [] });
            } else {
              return ds.$q.all(ds.getStream(query)).then(function (targetResponses) {
                var flattened = [];
                _.each(targetResponses, function (tr) {
                  _.each(tr, function (item) {
                    flattened.push(item);
                  });
                });
                return { data: flattened.sort(function (a, b) {
                    return +(a.target > b.target) || +(a.target === b.target) - 1;
                  }) };
              });
            }
          }
        }, {
          key: 'targetContainsTemplate',
          value: function targetContainsTemplate(target) {
            return this.templateSrv.variableExists(target.target);
          }
        }, {
          key: 'testDatasource',
          value: function testDatasource() {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/',
              method: 'GET'
            }).then(function (response) {
              if (response.status === 200) {
                return { status: 'success', message: 'Data source is working', title: 'Success' };
              }
            });
          }
        }, {
          key: 'annotationQuery',
          value: function annotationQuery(options) {
            var _this3 = this;

            if (!this.afdatabase.webid) {
              return this.$q.when([]);
            }

            var categoryName = options.annotation.query.categoryName ? this.templateSrv.replace(options.annotation.query.categoryName, {}, 'glob') : null;
            var nameFilter = options.annotation.query.nameFilter ? this.templateSrv.replace(options.annotation.query.nameFilter, {}, 'glob') : null;
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
              nameFilter: nameFilter
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
              return this.$q.when([]);
            }
            filter.push('startTime=' + options.range.from.toJSON());
            filter.push('endTime=' + options.range.to.toJSON());

            if (annotationOptions.attribute && annotationOptions.attribute.enable) {
              var resourceUrl = this.piwebapiurl + '/streamsets/{0}/value?selectedFields=Items.WebId;Items.Value;Items.Name';
              if (!!annotationOptions.attribute.name) {
                resourceUrl = this.piwebapiurl + '/streamsets/{0}/value?nameFilter=' + annotationOptions.attribute.name + '&selectedFields=Items.WebId;Items.Value;Items.Name';
              }
              var query = {};
              query["1"] = {
                'Method': 'GET',
                'Resource': this.piwebapiurl + '/assetdatabases/' + this.afdatabase.webid + '/eventframes?' + filter.join('&')
              }, query["2"] = {
                'Method': 'GET',
                'RequestTemplate': {
                  'Resource': resourceUrl
                },
                'Parameters': ['$.1.Content.Items[*].WebId'],
                'ParentIds': ['1']
              };
              return this.restBatch(query).then(function (result) {
                var data = result.data["1"].Content;
                var valueData = result.data["2"].Content;

                var annotations = _.map(data.Items, function (item, index) {
                  return _.curry(_this3.eventFrameToAnnotation)(annotationOptions, false, item, valueData.Items[index].Content.Items);
                });

                if (options.annotation.showEndTime) {
                  var ends = _.map(data.Items, function (item, index) {
                    return _.curry(_this3.eventFrameToAnnotation)(annotationOptions, true, item, valueData.Items[index].Content.Items);
                  });
                  _.each(ends, function (end) {
                    annotations.push(end);
                  });
                }

                return annotations;
              });
            } else {
              return this.restGet('/assetdatabases/' + this.afdatabase.webid + '/eventframes?' + filter.join('&')).then(function (result) {
                var annotations = _.map(result.data.Items, _.curry(_this3.eventFrameToAnnotation)(annotationOptions, false));

                if (options.annotation.showEndTime) {
                  var ends = _.map(result.data.Items, _.curry(_this3.eventFrameToAnnotation)(annotationOptions, true));
                  _.each(ends, function (end) {
                    annotations.push(end);
                  });
                }

                return annotations;
              });
            }
          }
        }, {
          key: 'metricQueryTransform',
          value: function metricQueryTransform(response) {
            return _.map(response, function (item) {
              return {
                text: item.Name,
                expandable: item.HasChildren === undefined || item.HasChildren === true || item.Path.split('\\').length <= 3,
                Path: item.Path,
                WebId: item.WebId
              };
            });
          }
        }, {
          key: 'metricFindQuery',
          value: function metricFindQuery(query, isPiPoint) {
            query = angular.fromJson(query);

            var ds = this;
            var querydepth = ['servers', 'databases', 'databaseElements', 'elements'];
            if (query.path === '') {
              query.type = querydepth[0];
            } else if (query.type !== 'attributes') {
              query.type = querydepth[Math.max(0, Math.min(query.path.split('\\').length, querydepth.length - 1))];
            }
            if (isPiPoint) {
              query.type = 'dataserver';
            }

            query.path = this.templateSrv.replace(query.path);

            if (query.type === 'servers') {
              return ds.getAssetServers().then(ds.metricQueryTransform);
            } else if (query.type === 'databases') {
              return ds.getAssetServer(query.path).then(function (server) {
                return ds.getDatabases(server.WebId, {}).then(ds.metricQueryTransform);
              });
            } else if (query.type === 'databaseElements') {
              return ds.getDatabase(query.path).then(function (db) {
                return ds.getDatabaseElements(db.WebId, { selectedFields: 'Items.WebId;Items.Name;Items.Path;Item.HasChildren' }).then(ds.metricQueryTransform);
              });
            } else if (query.type === 'elements') {
              return ds.getElement(query.path).then(function (element) {
                return ds.getElements(element.WebId, { selectedFields: 'Items.WebId;Items.Name;Items.Path;Item.HasChildren' }).then(ds.metricQueryTransform);
              });
            } else if (query.type === 'attributes') {
              return ds.getElement(query.path).then(function (element) {
                return ds.getAttributes(element.WebId, { searchFullHierarchy: 'true', selectedFields: 'Items.WebId;Items.Name;Items.Path' }).then(ds.metricQueryTransform);
              });
            } else if (query.type === 'dataserver') {
              return ds.getDataServers().then(ds.metricQueryTransform);
            }
          }
        }, {
          key: 'getSummaryUrl',
          value: function getSummaryUrl(summary) {
            if (summary.interval == "") {
              return '&summaryType=' + summary.types.join('&summaryType=') + '&calculationBasis=' + summary.basis;
            }
            return '&summaryType=' + summary.types.join('&summaryType=') + '&calculationBasis=' + summary.basis + '&summaryDuration=' + summary.interval;
          }
        }, {
          key: 'resolveWebIds',
          value: function resolveWebIds(query) {
            var ds = this;
            var batchQuery = {};
            var batchIndex = 1;

            _.each(query.targets, function (target) {
              var hasAttributes = target.attributes.length > 0;

              var elementBatchId = batchIndex++;
              batchQuery[elementBatchId.toString()] = {
                'Method': 'GET',
                'Resource': '/elements?selectedFields=WebId;Name;Path&path=\\\\' + encodeURIComponent(target.elementPath)
              };

              if (hasAttributes) {
                _.each(target.attributes, function (attribute) {
                  batchQuery[(batchIndex++).toString()] = {
                    'Method': 'GET',
                    'Resource': '/elements/{0}/attributes?selectedFields=WebId;Name;Path&nameFilter=' + encodeURIComponent(target.elementPath),
                    'Parameters': ['$.' + elementBatchId + '.Content.WebId'],
                    'ParentIds': [elementBatchId.toString()]
                  };
                });
              } else {}
              target.attributes;
            });
          }
        }, {
          key: 'parsePiPointValueList',
          value: function parsePiPointValueList(value, target) {
            var _this4 = this;

            var isSummary = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            var api = this;
            var datapoints = [];
            var previousValue = null;
            _.each(value, function (item) {
              var grafanaDataPoint = api.parsePiPointValue(item, isSummary, target);
              var drop = false;
              if (isSummary) {
                grafanaDataPoint, previousValue, drop = _this4.noDataReplace(item.Value, target.summary.nodata, grafanaDataPoint);
              } else {
                grafanaDataPoint, previousValue, drop = _this4.noDataReplace(item, target.summary.nodata, grafanaDataPoint);
              }
              if (!drop) {
                datapoints.push(grafanaDataPoint);
              }
            });
            return datapoints;
          }
        }, {
          key: 'parsePiPointValue',
          value: function parsePiPointValue(value) {
            var isSummary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var target = arguments[2];

            var num = !isSummary && _typeof(value.Value) === "object" ? Number(value.Value.Value) : Number(value.Value);
            if (isSummary) {
              num = Number(value.Value.Value);
              if (target.summary.interval == "") {
                return [!isNaN(num) ? num : 0, new Date(target.endTime).getTime()];
              }
              return [!isNaN(num) ? num : 0, new Date(value.Value.Timestamp).getTime()];
            }
            return [!isNaN(num) ? num : 0, new Date(value.Timestamp).getTime()];
          }
        }, {
          key: 'noDataReplace',
          value: function noDataReplace(item, noDataReplacementMode, grafanaDataPoint) {
            var previousValue = null;
            var drop = false;
            if (item.Value === 'No Data' || item.Value.Name && item.Value.Name === 'No Data' || !item.Good) {
              if (noDataReplacementMode === 'Drop') {
                drop = true;
              } else if (noDataReplacementMode === '0') {
                grafanaDataPoint[0] = 0;
              } else if (noDataReplacementMode === 'Null') {
                grafanaDataPoint[0] = null;
              } else if (noDataReplacementMode === 'Previous' && previousValue !== null) {
                grafanaDataPoint[0] = previousValue;
              }
            } else {
              previousValue = item.Value;
            }
            return grafanaDataPoint, previousValue, drop;
          }
        }, {
          key: 'processResults',
          value: function processResults(content, target, name) {
            var api = this;
            var isSummary = target.summary && target.summary.types && target.summary.types.length > 0;
            if (target.regex && target.regex.enable) {
              name = name.replace(new RegExp(target.regex.search), target.regex.replace);
            }
            if (isSummary) {
              var innerResults = [];
              var groups = _.groupBy(content.Items, function (item) {
                return item.Type;
              });
              _.forOwn(groups, function (value, key) {
                innerResults.push({
                  'target': name + '[' + key + ']',
                  'datapoints': api.parsePiPointValueList(value, target, isSummary)
                });
              });
              return innerResults;
            }
            return [{
              'target': name,
              'datapoints': api.parsePiPointValueList(content.Items, target, isSummary)
            }];
            // }).catch(err => { api.error = err }))
          }
        }, {
          key: 'getStream',
          value: function getStream(query) {
            var _this5 = this;

            var api = this;
            var results = [];

            _.each(query.targets, function (target) {
              target.attributes = _.filter(target.attributes || [], function (attribute) {
                return 1 && attribute;
              });
              var url = '';
              var isSummary = target.summary && target.summary.types && target.summary.types.length > 0;
              var isInterpolated = target.interpolate && target.interpolate.enable;
              // perhaps add a check to see if interpolate override time < query.interval
              var intervalTime = target.interpolate.interval ? target.interpolate.interval : query.interval;
              var timeRange = '?startTime=' + query.range.from.toJSON() + '&endTime=' + query.range.to.toJSON();
              var targetName = target.expression || target.elementPath;
              if (target.expression) {
                url += '/calculation';
                if (isSummary) {
                  url += '/summary' + timeRange + (isInterpolated ? '&sampleType=Interval&sampleInterval=' + intervalTime : '');
                } else {
                  url += '/intervals' + timeRange + '&sampleInterval=' + intervalTime;
                }
                url += '&expression=' + encodeURIComponent(target.expression);
                url += '&webid=';
                if (target.attributes.length > 0) {
                  _.each(target.attributes, function (attribute) {
                    results.push(api.restGetWebId(target.elementPath + '|' + attribute, target.isPiPoint).then(function (webidresponse) {
                      return api.restPost(url + webidresponse.WebId).then(function (response) {
                        return api.processResults(response.data, target, target.display || attribute || targetName);
                      }).catch(function (err) {
                        api.error = err;
                      });
                    }));
                  });
                } else {
                  results.push(api.restGetWebId(target.elementPath, target.isPiPoint).then(function (webidresponse) {
                    return api.restPost(url + webidresponse.WebId).then(function (response) {
                      return api.processResults(response.data, target, target.display || targetName);
                    }).catch(function (err) {
                      api.error = err;
                    });
                  }));
                }
              } else {
                url += '/streamsets';
                if (isSummary) {
                  url += '/summary' + timeRange + '&intervals=' + query.maxDataPoints + _this5.getSummaryUrl(target.summary);
                } else if (target.interpolate && target.interpolate.enable) {
                  url += '/interpolated' + timeRange + '&interval=' + intervalTime;
                } else if (target.recordedValues && target.recordedValues.enable) {
                  url += '/recorded' + timeRange + '&maxCount=' + target.recordedValues.maxNumber;
                } else {
                  url += '/plot' + timeRange + '&intervals=' + query.maxDataPoints;
                }

                results.push(api.$q.all(_.map(target.attributes, function (attribute) {
                  return api.restGetWebId(target.elementPath + '|' + attribute, target.isPiPoint);
                })).then(function (webidresponse) {
                  var query = {};
                  _.each(webidresponse, function (webid, index) {
                    query[index + 1] = {
                      "Method": "GET",
                      "Resource": api.piwebapiurl + url + '&webid=' + webid.WebId
                    };
                  });

                  return api.restBatch(query).then(function (response) {
                    var targetResults = [];
                    _.each(response.data, function (value, key) {
                      _.each(value.Content.Items, function (item) {
                        _.each(api.processResults(item, target, target.display || item.Name || targetName), function (targetResult) {
                          targetResults.push(targetResult);
                        });
                      });
                    });

                    return targetResults;
                  }).catch(function (err) {
                    api.error = err;
                  });
                }));
              }
            });

            return results;
          }
        }, {
          key: 'restGet',
          value: function restGet(path) {
            return this.backendSrv.datasourceRequest({
              url: this.url + path,
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }, {
          key: 'restGetWebId',
          value: function restGetWebId(assetPath, isPiPoint) {
            var ds = this;

            // check cache
            var cachedWebId = ds.webidCache.get(assetPath);
            if (cachedWebId) {
              return ds.$q.when({ Path: assetPath, WebId: cachedWebId });
            }

            if (!isPiPoint) {
              // no cache hit, query server
              var path = (assetPath.indexOf('|') >= 0 ? '/attributes?selectedFields=WebId;Name;Path&path=\\\\' : '/elements?selectedFields=WebId;Name;Path&path=\\\\') + assetPath;
            } else {
              var path = '/points?selectedFields=WebId;Name;Path&path=\\\\' + assetPath.replace('|', '\\');
            }

            return this.backendSrv.datasourceRequest({
              url: this.url + path,
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }).then(function (response) {
              ds.webidCache.put(assetPath, response.data.WebId);
              return { Path: assetPath, WebId: response.data.WebId };
            });
          }
        }, {
          key: 'restBatch',
          value: function restBatch(batch) {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/batch',
              data: batch,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'message/http'
              }
            });
          }
        }, {
          key: 'restPost',
          value: function restPost(path) {
            return this.backendSrv.datasourceRequest({
              url: this.url,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'message/http',
                'X-PIWEBAPI-HTTP-METHOD': 'GET',
                'X-PIWEBAPI-RESOURCE-ADDRESS': path
              }
            });
          }
        }, {
          key: 'getDataServers',
          value: function getDataServers() {
            return this.restGet('/dataservers').then(function (response) {
              return response.data.Items;
            });
          }
        }, {
          key: 'getDataServer',
          value: function getDataServer(name) {
            return this.restGet('/dataservers?name=' + name).then(function (response) {
              return response.data;
            });
          }
        }, {
          key: 'getAssetServers',
          value: function getAssetServers() {
            return this.restGet('/assetservers').then(function (response) {
              return response.data.Items;
            });
          }
        }, {
          key: 'getAssetServer',
          value: function getAssetServer(name) {
            return this.restGet('/assetservers?path=\\\\' + name).then(function (response) {
              return response.data;
            });
          }
        }, {
          key: 'getDatabase',
          value: function getDatabase(path) {
            return this.restGet('/assetdatabases?path=\\\\' + path).then(function (response) {
              return response.data;
            });
          }
        }, {
          key: 'getDatabases',
          value: function getDatabases(serverId, options) {
            return this.restGet('/assetservers/' + serverId + '/assetdatabases').then(function (response) {
              return response.data.Items;
            });
          }
        }, {
          key: 'getElement',
          value: function getElement(path) {
            return this.restGet('/elements?path=\\\\' + path).then(function (response) {
              return response.data;
            });
          }
        }, {
          key: 'getEventFrameTemplates',
          value: function getEventFrameTemplates(databaseId) {
            return this.restGet('/assetdatabases/' + databaseId + '/elementtemplates?selectedFields=Items.InstanceType;Items.Name;Items.WebId').then(function (response) {
              return _.filter(response.data.Items, function (item) {
                return item.InstanceType === 'EventFrame';
              });
            });
          }
        }, {
          key: 'getElementTemplates',
          value: function getElementTemplates(databaseId) {
            return this.restGet('/assetdatabases/' + databaseId + '/elementtemplates?selectedFields=Items.InstanceType;Items.Name;Items.WebId').then(function (response) {
              return _.filter(response.data.Items, function (item) {
                return item.InstanceType === 'Element';
              });
            });
          }
        }, {
          key: 'getAttributes',
          value: function getAttributes(elementId, options) {
            var querystring = '?' + _.map(options, function (value, key) {
              return key + '=' + value;
            }).join('&');

            if (querystring === '?') {
              querystring = '';
            }

            return this.restGet('/elements/' + elementId + '/attributes' + querystring).then(function (response) {
              return response.data.Items;
            });
          }
        }, {
          key: 'getDatabaseElements',
          value: function getDatabaseElements(databaseId, options) {
            var querystring = '?' + _.map(options, function (value, key) {
              return key + '=' + value;
            }).join('&');

            if (querystring === '?') {
              querystring = '';
            }

            return this.restGet('/assetdatabases/' + databaseId + '/elements' + querystring).then(function (response) {
              return response.data.Items;
            });
          }
        }, {
          key: 'getElements',
          value: function getElements(elementId, options) {
            var querystring = '?' + _.map(options, function (value, key) {
              return key + '=' + value;
            }).join('&');

            if (querystring === '?') {
              querystring = '';
            }

            return this.restGet('/elements/' + elementId + '/elements' + querystring).then(function (response) {
              return response.data.Items;
            });
          }
        }, {
          key: 'piPointSearch',
          value: function piPointSearch(serverId, nameFilter) {
            return this.restGet('/dataservers/' + serverId + '/points?maxCount=100&nameFilter=' + nameFilter).then(function (results) {
              return results.data.Items;
            });
          }
        }, {
          key: 'getWebId',
          value: function getWebId(target) {
            var api = this;
            var isAf = target.target.indexOf('\\') >= 0;
            var isAttribute = target.target.indexOf('|') >= 0;
            if (!isAf && target.target.indexOf('.') === -1) {
              return api.$q.when([{ WebId: target.target, Name: target.display || target.target }]);
            }

            if (!isAf) {
              // pi point lookup
              return api.piPointSearch(this.piserver.webid, target.target).then(function (results) {
                if (results.data.Items === undefined || results.data.Items.length === 0) {
                  return [{ WebId: target.target, Name: target.display || target.target }];
                }
                return results.data.Items;
              });
            } else if (isAf && isAttribute) {
              // af attribute lookup
              return api.restGet('/attributes?path=\\\\' + target.target).then(function (results) {
                if (results.data === undefined || results.status !== 200) {
                  return [{ WebId: target.target, Name: target.display || target.target }];
                }
                // rewrite name if specified
                results.data.Name = target.display || results.data.Name;
                return [results.data];
              });
            } else {
              // af element lookup
              return api.restGet('/elements?path=\\\\' + target.target).then(function (results) {
                if (results.data === undefined || results.status !== 200) {
                  return [{ WebId: target.target, Name: target.display || target.target }];
                }
                // rewrite name if specified
                results.data.Name = target.display || results.data.Name;
                return [results.data];
              });
            }
          }
        }]);

        return PiWebApiDatasource;
      }());

      _export('PiWebApiDatasource', PiWebApiDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
