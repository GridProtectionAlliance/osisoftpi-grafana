import { each, filter, forOwn, join, reduce, map, slice, remove, defaults } from 'lodash';

import React, { PureComponent, ChangeEvent } from 'react';
import { Icon, LegacyForms, SegmentAsync, Segment } from '@grafana/ui';
import { QueryEditorProps, SelectableValue, VariableModel } from '@grafana/data';

import { PiWebAPIDatasource } from './datasource';
import { QueryInlineField, QueryRowTerminator } from './components/Forms';
import {
  PIWebAPISelectableValue,
  PIWebAPIDataSourceJsonData,
  PIWebAPIQuery,
  defaultQuery
} from './types';

const { Input, Switch } = LegacyForms;

interface State {
  segments: SelectableValue<PIWebAPISelectableValue>[];
  attributes: SelectableValue<PIWebAPISelectableValue>[];
  summaries: SelectableValue<PIWebAPISelectableValue>[];
  attributeSegment: SelectableValue<PIWebAPISelectableValue>;
  summarySegment: SelectableValue<PIWebAPISelectableValue>;
  calculationBasisSegment: SelectableValue<PIWebAPISelectableValue>;
  noDataReplacementSegment: SelectableValue<PIWebAPISelectableValue>;
}

type Props = QueryEditorProps<PiWebAPIDatasource, PIWebAPIQuery, PIWebAPIDataSourceJsonData>

const REMOVE_LABEL = '-REMOVE-'

const CustomLabelComponent = (props: any) => {
  if (props.value) {
    return <div className="gf-form-label">{props.label ?? '---no label--'}</div>;
  }
  return <a className="gf-form-label query-part"><Icon name="plus" /></a>
}

export class PIWebAPIQueryEditor extends PureComponent<Props, State> {
  error: any;
  piServer: any[] = [];
  availableAttributes: any = {};
  summaryTypes: string[];
  calculationBasis: string[];
  noDataReplacement: string[];
  state: State = {
    segments: [],
    attributes: [],
    summaries: [],
    attributeSegment: {},
    summarySegment: {},
    calculationBasisSegment: {},
    noDataReplacementSegment: {}
  };

  constructor(props: any) {
    super(props)
    this.onSegmentChange = this.onSegmentChange.bind(this)
    this.calcBasisValueChanged = this.calcBasisValueChanged.bind(this)
    this.calcNoDataValueChanged = this.calcNoDataValueChanged.bind(this)
    this.onSummaryAction = this.onSummaryAction.bind(this)
    this.onSummaryValueChanged = this.onSummaryValueChanged.bind(this)
    this.onAttributeAction = this.onAttributeAction.bind(this)
    this.onAttributeChange = this.onAttributeChange.bind(this)
    
    this.summaryTypes = [
      // 'None', // A summary type is not specified.
      'Total', // A totalization over the time range.
      'Average', // The average value over the time range.
      'Minimum', // The minimum value over the time range.
      'Maximum', // The maximum value over the time range.
      'Range', // The range value over the time range (minimum-maximum).
      'StdDev', // The standard deviation over the time range.
      'PopulationStdDev', // The population standard deviation over the time range.
      'Count', // The sum of event count over the time range when calculation basis is event weighted. The sum of event time duration over the time range when calculation basis is time weighted.
      'PercentGood', // Percent of data with good value during the calculation period. For time weighted calculations, the percentage is based on time. For event weighted calculations, the percent is based on event count.
      'All', // A convenience for requesting all available summary calculations.
      'AllForNonNumeric' // A convenience for requesting all available summary calculations for non-numeric data.
    ]

    this.calculationBasis = [
      'TimeWeighted', // Weight the values in the calculation by the time over which they apply. Interpolation is based on whether the attribute is stepped. Interpolated events are generated at the boundaries if necessary.
      'EventWeighted', // Evaluate values with equal weighting for each event. No interpolation is done. There must be at least one event within the time range to perform a successful calculation. Two events are required for standard deviation. In handling events at the boundary of the calculation, the AFSDK uses following rules:
      'TimeWeightedContinuous', // Apply weighting as in TimeWeighted, but do all interpolation between values as if they represent continuous data, (standard interpolation) regardless of whether the attribute is stepped.
      'TimeWeightedDiscrete', // Apply weighting as in TimeWeighted but interpolation between values is performed as if they represent discrete, unrelated values (stair step plot) regardless of the attribute is stepped.
      'EventWeightedExcludeMostRecentEvent', // The calculation behaves the same as _EventWeighted_, except in the handling of events at the boundary of summary intervals in a multiple intervals calculation. Use this option to prevent events at the intervals boundary from being double count at both intervals. With this option, events at the end time (most recent time) of an interval is not used in that interval.
      'EventWeightedExcludeEarliestEvent', // Similar to the option _EventWeightedExcludeMostRecentEvent_. Events at the start time(earliest time) of an interval is not used in that interval.
      'EventWeightedIncludeBothEnds' // Events at both ends of the interval boundaries are included in the event weighted calculation.
    ]

    this.noDataReplacement = [
      'Null', // replace with nulls
      'Drop', // drop items
      'Previous', // use previous value if available
      '0', // replace with 0
      'Keep', // Keep value      
    ]
  }

  // is selected segment empty
  isValueEmpty(value: PIWebAPISelectableValue|undefined) {
    return !value || !value.value || !value.value.length || value.value === REMOVE_LABEL;
  }

  // summary calculation change event
  calcBasisValueChanged(segment?: any) {
    const metricsQuery = this.props.query as PIWebAPIQuery;
    const summary = metricsQuery.summary;
    summary.basis = segment.value?.value;
    this.onChange({...metricsQuery, summary});
  }
  // get summary calculation basis user interface segments
  getCalcBasisSegments() {
    const segments = map(this.calculationBasis, (item: string) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item,
        value: {
          value: item,
          expandable: true
        }
      };
      return selectableValue;
    });
    return segments;
  }

   // no data change event
  calcNoDataValueChanged(segment?: any) {
    const metricsQuery = this.props.query as PIWebAPIQuery;
    const summary = metricsQuery.summary;
    summary.nodata = segment.value?.value;
    this.onChange({...metricsQuery, summary});
  }
  // get summary calculation basis user interface segments
  getNoDataSegments() {
    var segments = map(this.noDataReplacement, (item: any) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item,
        value: {
          value: item,
          expandable: true
        }
      };
      return selectableValue;
    });
    return segments;
  }

  // remove a summary from the user interface and the query
  removeSummary(part: any) {
    const summaries = filter(this.state.summaries, (item: any) => {
      return item !== part;
    })
    this.setState({ summaries });
  }
  // add a new summary to the query
  onSummaryAction(item: SelectableValue<PIWebAPISelectableValue>) {
    const summaries = this.state.summaries.slice(0) as SelectableValue<PIWebAPISelectableValue>[];
    // if value is not empty, add new attribute segment
    if (!this.isValueEmpty(item.value)) {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item.label,
        value: {
          value: item.value?.value,
          expandable: true
        }
      };
      summaries.push(selectableValue);
    } 
    this.setState({ summarySegment: {}, summaries });
  }
  // summary query change event
  onSummaryValueChanged(item: SelectableValue<PIWebAPISelectableValue>, index: number) {
    const summaries = this.state.summaries.slice(0) as SelectableValue<PIWebAPISelectableValue>[];
    summaries[index].value = item.value;
    if (this.isValueEmpty(item.value)) {
      summaries.splice(index, 1);
    }
    this.setState({ summaries });
  }
  // get the list of summaries available
  getSummarySegments() {
    const ctrl = this;
    const summaryTypes = filter(ctrl.summaryTypes, (type) => {
      return this.state.summaries.map((s) => s.value?.value).indexOf(type) === -1.
    });
    var segments = map(summaryTypes, (item: string) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item,
        value: {
          value: item,
          expandable: true
        }
      };
      return selectableValue;
    });

    segments.unshift({
      label: REMOVE_LABEL,
      value: {
        value: REMOVE_LABEL
      }
    });

    return segments;
  }

  // remove an af attribute from the query
  removeAttribute(part: any) {
    const attributes = filter(this.state.attributes, (item: any) => { 
      return item !== part;
    });
    this.attributeChangeValue(attributes); 
  }
  // add an attribute to the query
  onAttributeAction(item: SelectableValue<PIWebAPISelectableValue>) {
    const { query } = this.props;
    const attributes = this.state.attributes.slice(0);
    // if value is not empty, add new attribute segment
    if (!this.isValueEmpty(item.value)) {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item.label,
        value: {
          value: item.value?.value,
          expandable: !query.isPiPoint
        }
      };
      attributes.push(selectableValue)
    }
    this.attributeChangeValue(attributes); 
  }
  // pi point change event
  onPiPointChange = (item: SelectableValue<PIWebAPISelectableValue>, index: number) => {
    let attributes = this.state.attributes.slice(0);
    
    if (item.label === REMOVE_LABEL) {
      remove(attributes, (value, n) => n === index);
    } else {
      // set current value
      attributes[index] = item;
    }

    this.checkPiPointSegments(item, attributes);
  }
  // attribute change event
  onAttributeChange = (item: SelectableValue<PIWebAPISelectableValue>, index: number) => {
    let attributes = this.state.attributes.slice(0);

    // set current value
    attributes[index] = item;
    
    this.checkAttributeSegments(attributes, this.state.segments);
  }
  // segment change
  onSegmentChange = (item: SelectableValue<PIWebAPISelectableValue>, index: number) => {
    const { query } = this.props;
    let segments = this.state.segments.slice(0);
    
    if (item.label === REMOVE_LABEL) {
      segments = slice(segments, 0, index);
      this.checkAttributeSegments([], segments);
      if (segments.length > 0 && !!segments[segments.length - 1].value?.expandable) {
        segments.push({
          label: 'Select Element',
          value: {
            value: '-Select Element-'
          }
        });
      }
      if (query.isPiPoint) {
        this.piServer = [];
      }
      this.segmentChangeValue(segments);
      return;
    }

    // set current value
    segments[index] = item;

    // Accept only one PI server
    if (query.isPiPoint) {
      this.piServer.push(item);
      this.segmentChangeValue(segments);
      return;
    }

    // changed internal selection
    if (index < segments.length - 1) {
      segments = slice(segments, 0, index + 1);
    }
    this.checkAttributeSegments([], segments);
    // add new options
    if (!!item.value?.expandable) {
      segments.push({
        label: 'Select Element',
        value: {
          value: '-Select Element-'
        }
      });
    }
    if (query.isPiPoint) {
      this.piServer.push(item);
    }
    this.segmentChangeValue(segments);
  };

  /**
   * Gets the segment information and parses it to a string.
   * 
   * @param {any} index - Last index of segment to use.
   * @returns - AF Path or PI Point name.
   * 
   * @memberOf PiWebApiDatasourceQueryCtrl
   */
  getSegmentPathUpTo(segments: SelectableValue<PIWebAPISelectableValue>[], index: number): string {
    var arr = segments.slice(0, index)

    return reduce(arr, (result: any, segment: any) => {
      if (!segment.value) return '';
      if (!segment.value.value.startsWith('-Select')) {
        return result ? (result + '\\' + segment.value.value) : segment.value.value;
      }
      return result;
    }, '');
  }

  /**
   * Get the current AF Element's child attributes. Validates when the element selection changes.
   * 
   * @returns - Collection of attributes.
   * 
   * @memberOf PiWebApiDatasourceQueryCtrl
   */
  checkAttributeSegments(attributes: any[], segments: any[]) {
    const { datasource } = this.props;
    var ctrl = this;
    var findQuery = {
      path: this.getSegmentPathUpTo(segments.slice(0), segments.length),
      type: 'attributes'
    };
    return datasource.metricFindQuery(findQuery, false)
      .then((attributesResponse: any) => {
        var validAttributes: any = {};

        each(attributesResponse, (attribute: any) => {
          validAttributes[attribute.Path.substring(attribute.Path.indexOf('|') + 1)] = attribute.WebId;
        });

        var filteredAttributes = filter(attributes, (attrib: SelectableValue<PIWebAPISelectableValue>) => {
          const changedValue = datasource.templateSrv.replace(attrib.value?.value);
          return validAttributes[changedValue] !== undefined;
        });

        ctrl.availableAttributes = validAttributes;
        this.attributeChangeValue(filteredAttributes);
      })
      .catch((err: any) => {
        ctrl.error = err.message || 'Failed to issue metric query';
        this.attributeChangeValue([]);
      });
  }

  /**
   * Get PI points from server.
   *
   * @returns - Collection of attributes.
   * 
   * @memberOf PiWebApiDatasourceQueryCtrl
   */
  checkPiPointSegments(attribute: any, attributes: any[]) {
    const { datasource } = this.props;
    var ctrl = this;
    var findQuery = {
      path: attribute.path,
      webId: ctrl.getSelectedPIServer(),
      pointName: datasource.templateSrv.replace(attribute.label),
      type: 'pipoint'
    };
    return datasource.metricFindQuery(findQuery, true)
      .then(() => {
        this.attributeChangeValue(attributes);
      })
      .catch((err: any) => {
        ctrl.error = err.message || 'Failed to issue metric query';
        this.attributeChangeValue([]);
      });
  }

  // get a ui segment for the attributes
  getElementSegments = (index: number): Promise<Array<SelectableValue<PIWebAPISelectableValue>>> => {
    const { datasource, query } = this.props
    var ctrl = this;
    var findQuery = { path: this.getSegmentPathUpTo(this.state.segments.slice(0), index) }

    return datasource.metricFindQuery(findQuery, query.isPiPoint)
      .then((items: any[]) => {
        var altSegments = map(items, (item: any) => {
          let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
            webId: item.WebId,
            label: item.text,
            value: {
              value: item.text,
              expandable: !query.isPiPoint && item.expandable
            }
          }
          return selectableValue
        })

        if (altSegments.length === 0) { return altSegments }
      
        // add template variables
        const variables = datasource.templateSrv.getVariables();
        each(variables, (variable: VariableModel) => {
          let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
            label: `[[${variable.name}]]`,
            value: {
              type: 'template',
              value: `[[${variable.name}]]`,
              expandable: !query.isPiPoint
            }
          }
          altSegments.unshift(selectableValue)
        })
        
        altSegments.unshift({
          label: REMOVE_LABEL,
          value: {
            value: REMOVE_LABEL
          }
        })

        return altSegments
      }).catch((err: any) => {
        ctrl.error = err.message || 'Failed to issue metric query'
        return []
      })
  }
  
  /**
   * Gets the webid of the current selected pi data server.
   * 
   * @memberOf PiWebApiDatasourceQueryCtrl
   */
  getSelectedPIServer () {
    var webID = ''

    this.piServer.forEach(s => {
      var parts = this.props.query.target.split(';')
      if (parts.length >= 2) {
        if (parts[0] === s.text) {
          webID = s.WebId
          return
        }
      }
    });
    return this.piServer.length > 0 ? this.piServer[0].webId : webID
  }
  
  // get the list of attributes for the user interface - PI
  getAttributeSegmentsPI = (attributeText?: string): Promise<Array<SelectableValue<PIWebAPISelectableValue>>> => {
    const { datasource, query } = this.props
    var ctrl = this
    var segments: Array<SelectableValue<PIWebAPISelectableValue>> = []

    var findQuery = {
      path: '',
      webId: ctrl.getSelectedPIServer(),
      pointName: datasource.templateSrv.replace(attributeText) + '*',
      type: 'dataserver'
    }

    return datasource.metricFindQuery(findQuery, query.isPiPoint)
      .then((items: any[]) => {
        segments = map(items, (item: any) => {
          let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
            path: item.Path,
            label: item.text,
            value: {
              value: item.text,
              expandable: false
            }
          }
          return selectableValue
        })
        segments.unshift({
          label: attributeText,
          value: {
            value: attributeText,
            expandable: false
          }
        })
        segments.unshift({
          label: REMOVE_LABEL,
          value: {
            value: REMOVE_LABEL
          }
        })
        return segments
      }).catch((err: any) => {
        ctrl.error = err.message || 'Failed to issue metric query'
        return segments
      })
  }

  // get the list of attributes for the user interface - AF
  getAttributeSegmentsAF = (attributeText?: string): Array<SelectableValue<PIWebAPISelectableValue>> => {
    var ctrl = this
    var segments: Array<SelectableValue<PIWebAPISelectableValue>> = []
    
    forOwn(ctrl.availableAttributes, (val: any, key: any) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: key,
        value: {
          value: key,
          expandable: true
        }
      };
      segments.push(selectableValue);
    })

    segments.unshift({
      label: REMOVE_LABEL,
      value: {
        value: REMOVE_LABEL
      }
    })

    return segments
  }

  componentDidMount = () => {
    const { query } = this.props
    const metricsQuery = defaults(query, defaultQuery) as PIWebAPIQuery
    const { segments, attributes, summary } = metricsQuery

    let segmentsArray: SelectableValue<PIWebAPISelectableValue>[] = segments?.slice(0) ?? []
    if (segmentsArray.length === 0) {
      segmentsArray.push({})
    }
    let attributesArray: SelectableValue<PIWebAPISelectableValue>[] = attributes?.slice(0) ?? []
    let summariesArray = summary?.types ?? []
    if (query.isPiPoint && segmentsArray.length > 0) {
      this.piServer = segmentsArray; // pi server assignment
    }
    this.setState({ segments: segmentsArray, attributes: attributesArray, summaries: summariesArray })
  }

  segmentChangeValue = (segments: SelectableValue<PIWebAPISelectableValue>[]) => {
    const query = this.props.query
    this.setState({
      segments
    })
    this.onChange({...query, segments})
  }

  attributeChangeValue = (attributes: SelectableValue<PIWebAPISelectableValue>[]) => {
    const query = this.props.query
    this.setState({
      attributes
    })
    this.onChange({...query, attributes})
  }

  onChange = (query: PIWebAPIQuery) => {
    const { onChange, onRunQuery } = this.props

    query.summary.types = this.state.summaries;
    query.elementPath = this.getSegmentPathUpTo(this.state.segments, this.state.segments.length)
    query.target = query.elementPath + ';' + join(query.attributes.map(s => s.value?.value), ';')

    onChange(query)
    
    if (query.target && query.target.length > 0 && query.attributes.length > 0) {
      onRunQuery()
    }
  }

  render() {
    const { query, onRunQuery } = this.props
    const metricsQuery = defaults(query, defaultQuery) as PIWebAPIQuery
    const { interpolate, digitalStates, recordedValues, expression, isPiPoint, summary, display, regex } = metricsQuery

    return (
      <>
        <div className="gf-form">
          <Switch
            className="gf-form-inline"
            label="PI Point Search"
            labelClass="query-keyword"
            checked={isPiPoint}
            onChange={() =>
              this.onChange({...metricsQuery, isPiPoint: !isPiPoint})
            }
          />
        </div>

        <QueryInlineField label={isPiPoint ? "Element" : "Data Server"}>
          {this.state.segments.map((segment: SelectableValue<PIWebAPISelectableValue>, index: number) => 
            {
              return <SegmentAsync
                  Component={<CustomLabelComponent value={segment.value} label={segment.label} />}
                  onChange={(item) => {
                    this.onSegmentChange(item, index);
                  }}
                  loadOptions={(query?: string | undefined) => {
                    return this.getElementSegments(index);
                  }}
                  allowCustomValue
                />
            })
          }
        </QueryInlineField>

        <QueryInlineField label={isPiPoint ? "Pi Points" : "Attributes"}>
          {this.state.attributes.map((attribute: SelectableValue<PIWebAPISelectableValue>, index: number) => 
            {
              if (isPiPoint) {
                return <SegmentAsync
                    Component={<CustomLabelComponent value={attribute.value} label={attribute.label} />}
                    onChange={(item) => this.onPiPointChange(item, index)}
                    loadOptions={this.getAttributeSegmentsPI}
                    reloadOptionsOnChange
                    allowCustomValue
                  />
              }
              return <Segment
                  Component={<CustomLabelComponent value={attribute.value} label={attribute.label} />}
                  onChange={(item) => this.onAttributeChange(item, index)}
                  options={this.getAttributeSegmentsAF()}
                  allowCustomValue
                />
            })
          }

          {isPiPoint && (
            <SegmentAsync
              Component={<CustomLabelComponent value={this.state.attributeSegment.value} label={this.state.attributeSegment.label} />}
              onChange={this.onAttributeAction}
              loadOptions={this.getAttributeSegmentsPI}
              reloadOptionsOnChange
              allowCustomValue
            />
          )}
          {!isPiPoint && (
            <Segment
              Component={<CustomLabelComponent value={this.state.attributeSegment.value} label={this.state.attributeSegment.label} />}
              onChange={this.onAttributeAction}
              options={this.getAttributeSegmentsAF()}
              allowCustomValue
            />
          )}
        </QueryInlineField>
 
        <div className="gf-form-inline">
          <div className="gf-form">
            <label className="gf-form-label query-keyword width-11">Calculation
              <i className="fa fa-question-circle" bs-tooltip="'Modify all attributes by an equation. Use \'.\' for current item. Leave Attributes empty if you wish to perform element based calculations.'" data-placement="top"></i>
            </label>
            <Input
                className="gf-form-input"
                onBlur={onRunQuery}
                value={expression}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  this.onChange({...metricsQuery, expression: event.target.value })
                }
                placeholder="'.'*2"
              />
          </div>
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <label className="gf-form-label query-keyword width-11">Max Recorded Values
              <i className="fa fa-question-circle" bs-tooltip="'Maximum number of recorded value to retrive from the data archive, without using interpolation.'" data-placement="top"></i>
            </label>
            <Input
              className="gf-form-input width-6"
              onBlur={onRunQuery}
              value={recordedValues.maxNumber}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                this.onChange({...metricsQuery, recordedValues: {...recordedValues, maxNumber: parseInt(event.target.value)}})
              }
              type="number"
              placeholder="150000"
            />
          </div>
          <div className="gf-form">
            <Switch
              className="gf-form-inline"
              label="Recorded Values"
              labelClass="query-keyword"
              checked={recordedValues.enable}
              onChange={() => {
                this.onChange({...metricsQuery, recordedValues: {...recordedValues, enable: !recordedValues.enable}})
              }}
            />
          </div>
          <div className="gf-form">
            <Switch
              className="gf-form-inline"
              label="Digital States"
              labelClass="query-keyword"
              checked={digitalStates.enable}
              onChange={() => {
                this.onChange({...metricsQuery, digitalStates: {...digitalStates, enable: !digitalStates.enable}})
              }}
            />
          </div>
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <label className="gf-form-label query-keyword width-11">Interpolate Period
              <i className="fa fa-question-circle" bs-tooltip="'Override time between sampling, e.g. \'30s\'. Defaults to timespan/chart width.'" data-placement="top"></i>
            </label>
            <Input
              className="gf-form-input width-5"
              onBlur={onRunQuery}
              value={interpolate.interval}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                this.onChange({...metricsQuery, interpolate: {...interpolate, interval: event.target.value}})
              }
              placeholder="30s"
            />
          </div>
          
          <div className="gf-form">
            <Switch
              className="gf-form-inline"
              label="Interpolate"
              labelClass="query-keyword"
              checked={interpolate.enable}
              onChange={() => {
                this.onChange({...metricsQuery, interpolate: {...interpolate, enable: !interpolate.enable}})
              }}
            />
          </div>
          
          <div className="gf-form">
              <label className="gf-form-label query-keyword  width-8">
                <span>Replace Bad Data</span>
                <i className="fa fa-question-circle" bs-tooltip="'Replacement for bad quality values.'" data-placement="top"></i>
              </label>
              <Segment
                Component={<CustomLabelComponent value={ { value: summary.nodata }} label={summary.nodata} />}
                onChange={this.calcNoDataValueChanged}
                options={this.getNoDataSegments()}
                allowCustomValue
              />
          </div>
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <label className="gf-form-label query-keyword width-11">Summary Period
              <i className="fa fa-question-circle" bs-tooltip="'Override time between sampling, e.g. \'30s\'.'" data-placement="top"></i>
            </label>
            <Input
              className="gf-form-input width-5"
              onBlur={onRunQuery}
              value={summary.interval}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                this.onChange({...metricsQuery, summary: {...summary, interval: event.target.value} })
              }
              placeholder="30s"
            />
          </div>

          <div className="gf-form">
              <label className="gf-form-label query-keyword  width-8">
                <span>Basis</span>
                <i className="fa fa-question-circle" bs-tooltip="'Defines the possible calculation options when performing summary calculations over time-series data.'" data-placement="top"></i>
              </label>
              <Segment
                Component={<CustomLabelComponent value={{ value: summary.basis }} label={summary.basis} />}
                onChange={this.calcBasisValueChanged}
                options={this.getCalcBasisSegments()}
                allowCustomValue
              />
          </div>

          <div className="gf-form gf-form--grow">
            <label className="gf-form-label query-keyword  width-8">
              <span>Summaries</span>
            </label>
            {this.state.summaries.map((s: SelectableValue<PIWebAPISelectableValue>, index: number) => 
              {
                return <Segment
                    Component={<CustomLabelComponent value={s.data} label={s.label} />}
                    onChange={(item) => {
                      this.onSummaryValueChanged(item, index);
                    }}
                    options={this.getSummarySegments()}
                    allowCustomValue
                  />
              })
            }
            <Segment
                Component={<CustomLabelComponent value={this.state.summarySegment.value} lable={this.state.summarySegment.label} />}
                onChange={this.onSummaryAction}
                options={this.getSummarySegments()}
                allowCustomValue
              />

            <QueryRowTerminator />
          </div>
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <div className="gf-form max-width-30">
              <label className="gf-form-label query-keyword width-11">Display Name 
                <i className="fa fa-question-circle" bs-tooltip="'If single attribute, modify display name. Otherwise use regex to modify display name.'" data-placement="top"></i>
              </label>
              <Input
                className="gf-form-input width-5"
                onBlur={onRunQuery}
                value={display}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  this.onChange({...metricsQuery, display: event.target.value})
                }
                placeholder="Display"
              />
            </div>
          </div>
          <div className="gf-form">
            <Switch
              className="gf-form"
              label="Enable Regex Replace"
              labelClass="query-keyword"
              checked={regex.enable}
              onChange={() => {
                this.onChange({...metricsQuery, regex: {...regex, enable: !regex.enable}})
              }}
            />
          </div>
          <div className="gf-form">
            <div className="gf-form max-width-30">
              <label className="gf-form-label query-keyword">Search</label>
              <Input
                className="gf-form-input width-5"
                onBlur={onRunQuery}
                value={regex.search}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  this.onChange({...metricsQuery, regex: {...regex, search: event.target.value}})
                }
                placeholder="(.*)"
              />
            </div>
          </div>
          <div className="gf-form">
            <div className="gf-form max-width-30">
              <label className="gf-form-label query-keyword">Replace</label>
              
              <Input
                className="gf-form-input width-5"
                onBlur={onRunQuery}
                value={regex.replace}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  this.onChange({...metricsQuery, regex: {...regex, replace: event.target.value}})
                }
                placeholder="$1"
              />
            </div>
          </div>
          <QueryRowTerminator />
        </div>
      </>
    );
  }
}
