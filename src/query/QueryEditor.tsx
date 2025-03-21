import { each, filter, forOwn, join, reduce, map, slice, remove, defaults } from 'lodash';

import React, { PureComponent, ChangeEvent } from 'react';
import { Icon, InlineField, InlineFieldRow, InlineSwitch, Input, SegmentAsync, Segment } from '@grafana/ui';
import { QueryEditorProps, SelectableValue, TypedVariableModel } from '@grafana/data';

import { PiWebAPIDatasource } from '../datasource';
import { QueryInlineField, QueryRawInlineField, QueryRowTerminator } from '../components/Forms';
import { PIWebAPISelectableValue, PIWebAPIDataSourceJsonData, PIWebAPIQuery, defaultQuery } from '../types';
import { QueryEditorModeSwitcher } from 'components/QueryEditorModeSwitcher';
import { parseRawQuery, getSummaryTypes } from 'helper';

const LABEL_WIDTH = 24;
const LABEL_SWITCH_WIDTH = 49.067 / 8.0;
const MIN_ELEM_INPUT_WIDTH = 200;
const MIN_ATTR_INPUT_WIDTH = 250;

interface State {
  isPiPoint: boolean;
  hideError: boolean;
  segments: Array<SelectableValue<PIWebAPISelectableValue>>;
  attributes: Array<SelectableValue<PIWebAPISelectableValue>>;
  summaries: Array<SelectableValue<PIWebAPISelectableValue>>;
  attributeSegment: SelectableValue<PIWebAPISelectableValue>;
  summarySegment: SelectableValue<PIWebAPISelectableValue>;
  calculationBasisSegment: SelectableValue<PIWebAPISelectableValue>;
  noDataReplacementSegment: SelectableValue<PIWebAPISelectableValue>;
}

type Props = QueryEditorProps<PiWebAPIDatasource, PIWebAPIQuery, PIWebAPIDataSourceJsonData>;

const REMOVE_LABEL = '-REMOVE-';

const CustomLabelComponent = (props: any) => {
  if (props.value) {
    return (
      <div 
        style={{width: props.width, marginRight: props.marginRight}} 
        className={`gf-form-label ${props.value.type === 'template' ? 'query-keyword' : ''}`}>
        {props.label ?? '--no label--'}
      </div>
    );
  }
  return (
    <a className="gf-form-label query-part">
      <Icon name="plus" />
    </a>
  );
};

export class PIWebAPIQueryEditor extends PureComponent<Props, State> {
  error: any;
  piServer: any[] = [];
  availableAttributes: any = {};
  summaryTypes: string[];
  calculationBasis: string[];
  recordedBoundaryTypes: string [];
  noDataReplacement: string[];
  state: State = {
    isPiPoint: false,
    hideError: false,
    segments: [],
    attributes: [],
    summaries: [],
    attributeSegment: {},
    summarySegment: {},
    calculationBasisSegment: {},
    noDataReplacementSegment: {},
  };

  constructor(props: any) {
    super(props);
    this.onSegmentChange = this.onSegmentChange.bind(this);
    this.calcBasisValueChanged = this.calcBasisValueChanged.bind(this);
    this.recordedBoundaryTypeValueChanged = this.recordedBoundaryTypeValueChanged.bind(this);
    this.calcNoDataValueChanged = this.calcNoDataValueChanged.bind(this);
    this.onSummaryAction = this.onSummaryAction.bind(this);
    this.onSummaryValueChanged = this.onSummaryValueChanged.bind(this);
    this.onAttributeAction = this.onAttributeAction.bind(this);
    this.onAttributeChange = this.onAttributeChange.bind(this);

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
      'AllForNonNumeric', // A convenience for requesting all available summary calculations for non-numeric data.
    ];

    this.calculationBasis = [
      'TimeWeighted', // Weight the values in the calculation by the time over which they apply. Interpolation is based on whether the attribute is stepped. Interpolated events are generated at the boundaries if necessary.
      'EventWeighted', // Evaluate values with equal weighting for each event. No interpolation is done. There must be at least one event within the time range to perform a successful calculation. Two events are required for standard deviation. In handling events at the boundary of the calculation, the AFSDK uses following rules:
      'TimeWeightedContinuous', // Apply weighting as in TimeWeighted, but do all interpolation between values as if they represent continuous data, (standard interpolation) regardless of whether the attribute is stepped.
      'TimeWeightedDiscrete', // Apply weighting as in TimeWeighted but interpolation between values is performed as if they represent discrete, unrelated values (stair step plot) regardless of the attribute is stepped.
      'EventWeightedExcludeMostRecentEvent', // The calculation behaves the same as _EventWeighted_, except in the handling of events at the boundary of summary intervals in a multiple intervals calculation. Use this option to prevent events at the intervals boundary from being double count at both intervals. With this option, events at the end time (most recent time) of an interval is not used in that interval.
      'EventWeightedExcludeEarliestEvent', // Similar to the option _EventWeightedExcludeMostRecentEvent_. Events at the start time(earliest time) of an interval is not used in that interval.
      'EventWeightedIncludeBothEnds', // Events at both ends of the interval boundaries are included in the event weighted calculation.
    ];

    this.recordedBoundaryTypes = [
      'Inside', // Default. Specifies to return the recorded values on the inside of the requested time range as the first and last values. 
      'Outside', // Specifies to return the recorded values on the outside of the requested time range as the first and last values.
      'Interpolated', //Specifies to create an interpolated value at the end points of the requested time range if a recorded value does not exist at that time.
    ]

    this.noDataReplacement = [
      'Null', // replace with nulls
      'Drop', // drop items
      'Previous', // use previous value if available
      '0', // replace with 0
      'Keep', // Keep value
    ];
  }

  // is selected segment empty
  isValueEmpty(value: PIWebAPISelectableValue | undefined) {
    return !value || !value.value || !value.value.length || value.value === REMOVE_LABEL;
  }

  segmentChangeValue = (segments: Array<SelectableValue<PIWebAPISelectableValue>>) => {
    const query = this.props.query;
    this.setState({ segments }, () => this.onChange({ ...query, segments }));
  };

  attributeChangeValue = (attributes: Array<SelectableValue<PIWebAPISelectableValue>>): Promise<void> => {
    const query = this.props.query;
    return new Promise((resolve) => this.setState({ attributes }, () => {
      this.onChange({ ...query, attributes })
      resolve();
    }));
  };

  // summary calculation basis change event
  calcBasisValueChanged(segment: SelectableValue<PIWebAPISelectableValue>) {
    const metricsQuery = this.props.query as PIWebAPIQuery;
    const summary = metricsQuery.summary;
    if (summary) {
      summary.basis = segment.value?.value;
    }
    this.onChange({ ...metricsQuery, summary });
  }
  // get summary calculation basis user interface segments
  getCalcBasisSegments() {
    const segments = map(this.calculationBasis, (item: string) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item,
        value: {
          value: item,
          expandable: true,
        },
      };
      return selectableValue;
    });
    return segments;
  }

  // recorded boundary type change event
  recordedBoundaryTypeValueChanged(segment: SelectableValue<PIWebAPISelectableValue>) {
    const metricsQuery = this.props.query as PIWebAPIQuery;
    const recordedValues = metricsQuery.recordedValues;
    if (recordedValues) {
      recordedValues.boundaryType = segment.value?.value;
    }
    this.onChange({ ...metricsQuery, recordedValues });
  }
  // get recorded boundary type user interface segments
  getRecordedBoundaryTypeSegments() {
    const segments = map(this.recordedBoundaryTypes, (item: string) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item,
        value: {
          value: item,
          expandable: true,
        },
      };
      return selectableValue;
    });
    return segments;
  }

  // no data change event
  calcNoDataValueChanged(segment: SelectableValue<PIWebAPISelectableValue>) {
    const metricsQuery = this.props.query as PIWebAPIQuery;
    const nodata = segment.value?.value;
    this.onChange({ ...metricsQuery, nodata });
  }
  // get no data user interface segments
  getNoDataSegments() {
    const segments = map(this.noDataReplacement, (item: string) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item,
        value: {
          value: item,
          expandable: true,
        },
      };
      return selectableValue;
    });
    return segments;
  }

  // summary query change event
  onSummaryValueChanged(item: SelectableValue<PIWebAPISelectableValue>, index: number) {
    const summaries = this.state.summaries.slice(0) as Array<SelectableValue<PIWebAPISelectableValue>>;
    summaries[index] = item;
    if (this.isValueEmpty(item.value)) {
      summaries.splice(index, 1);
    }
    this.setState({ summaries }, this.stateCallback);
  }
  // get the list of summaries available
  getSummarySegments() {
    const summaryTypes = filter(this.summaryTypes, (type) => {
      return this.state.summaries.map((s) => s.value?.value).indexOf(type) === -1;
    });

    const segments = map(summaryTypes, (item: string) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item,
        value: {
          value: item,
          expandable: true,
        },
      };
      return selectableValue;
    });

    segments.unshift({
      label: REMOVE_LABEL,
      value: {
        value: REMOVE_LABEL,
      },
    });

    return segments;
  }

  // remove a summary from the user interface and the query
  removeSummary(part: SelectableValue<PIWebAPISelectableValue>) {
    const summaries = filter(this.state.summaries, (item: SelectableValue<PIWebAPISelectableValue>) => {
      return item !== part;
    });
    this.setState({ summaries });
  }
  // add a new summary to the query
  onSummaryAction(item: SelectableValue<PIWebAPISelectableValue>) {
    const summaries = this.state.summaries.slice(0) as Array<SelectableValue<PIWebAPISelectableValue>>;
    // if value is not empty, add new attribute segment
    if (!this.isValueEmpty(item.value)) {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item.label,
        value: {
          value: item.value?.value,
          expandable: true,
        },
      };
      summaries.push(selectableValue);
    }
    this.setState({ summarySegment: {}, summaries }, this.stateCallback);
  }

  // remove an attribute from the query
  removeAttribute(part: SelectableValue<PIWebAPISelectableValue>) {
    const attributes = filter(this.state.attributes, (item: SelectableValue<PIWebAPISelectableValue>) => {
      return item !== part;
    });
    this.attributeChangeValue(attributes);
  }
  // add an attribute to the query
  onAttributeAction(item: SelectableValue<PIWebAPISelectableValue>) {
    const { query } = this.props;
    const attributes = this.state.attributes.slice(0);
    // partial variable
    if (item.value !== null && typeof item.value !== 'object' && !Array.isArray(item.value)) {
      const value = String(item.value! as string);
      item.value = {
        type: value.match(/\${\w+}/gi) ? 'template' : undefined,
        value: value,
      }
    }

    // if value is not empty, add new attribute segment
    if (!this.isValueEmpty(item.value)) {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: item.label,
        value: {
          type: item.value?.value && item.value?.value.match(/\${\w+}/gi) ? 'template' : undefined,
          value: item.value?.value,
          expandable: !query.isPiPoint,
        },
      };
      attributes.push(selectableValue);
    }
    this.attributeChangeValue(attributes);
  }

  // pi point change event
  onPiPointChange = (item: SelectableValue<PIWebAPISelectableValue>, index: number) => {
    let attributes = this.state.attributes.slice(0);

    if (item.label === REMOVE_LABEL) {
      remove(attributes, (_, n) => n === index);
    } else {
      // set current value
      attributes[index] = item;
    }

    this.checkPiPointSegments(item, attributes);
  };
  // attribute change event
  onAttributeChange = (item: SelectableValue<PIWebAPISelectableValue>, index: number) => {
    let attributes = this.state.attributes.slice(0);

    // ignore if no change
    if (attributes[index].label === item.value?.value) {
      return;
    }

    // set current value
    attributes[index] = item;

    this.checkAttributeSegments(attributes, this.state.segments);
  };
  // segment change
  onSegmentChange = (item: SelectableValue<PIWebAPISelectableValue>, index: number) => {
    const { query } = this.props;
    let segments = this.state.segments.slice(0);

    // partial variable
    if (item.value !== null && typeof item.value !== 'object' && !Array.isArray(item.value)) {
      const value = String(item.value! as string);
      item.value = {
        type: value.match(/\${\w+}/gi) ? 'template' : undefined,
        value: value,
      }
    }

    // ignore if no change
    if (segments[index].label === item.value?.value) {
      return;
    }

    // reset attributes list
    this.setState({ attributes: [] }, () => {
      if (item.label === REMOVE_LABEL) {
        segments = slice(segments, 0, index);
        this.checkAttributeSegments([], segments).then(() => {
          if (segments.length === 0) {
            segments.push({
              label: '',
            });
          } else if (!!segments[segments.length - 1].value?.expandable) {
            segments.push({
              label: 'Select Element',
              value: {
                value: '-Select Element-',
              },
            });
          }
          if (query.isPiPoint) {
            this.piServer = [];
          }
          this.segmentChangeValue(segments);
        });
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
      this.checkAttributeSegments([], segments).then((): Promise<Array<SelectableValue<PIWebAPISelectableValue>>> => {
        // add new options
        if (item.value?.type === 'template') { // if it's a variable we need to check for new elements\
          return this.getElementSegments(segments.length + 1, segments).then((elements) => {
            if (elements.length > 0) {
              segments[index].value!.expandable = true;
              segments.push({
                label: 'Select Element',
                value: {
                  value: '-Select Element-',
                },
              });
            }
            this.segmentChangeValue(segments);
            return segments;
          });
        } else if (!!item.value?.expandable) {
          segments.push({
            label: 'Select Element',
            value: {
              value: '-Select Element-',
            },
          });
        }
        return new Promise((resolve) => {
          this.segmentChangeValue(segments);
          resolve(segments);
        });
      });
    });
  };

  // get a ui segment for the attributes
  getElementSegments = (
    index: number,
    currentSegment?: Array<SelectableValue<PIWebAPISelectableValue>>
  ): Promise<Array<SelectableValue<PIWebAPISelectableValue>>> => {
    const { datasource, query, data } = this.props;
    const ctrl = this;
    const findQuery = query.isPiPoint
      ? { type: 'dataserver' }
      : {
          path: this.getSegmentPathUpTo(currentSegment ?? this.state.segments.slice(0), index),
          afServerWebId: this.state.segments.length > 0 && this.state.segments[0].value ? this.state.segments[0].value.webId : undefined,
        };

    if (!query.isPiPoint) {
      if (datasource.afserver?.name && index === 0) {
        return Promise.resolve([
          {
            label: datasource.afserver.name,
            value: {
              value: datasource.afserver.name,
              expandable: true,
            },
          },
        ]);
      }
      if (datasource.afserver?.name && datasource.afdatabase?.name && index === 1) {
        return Promise.resolve([
          {
            label: datasource.afdatabase.name,
            value: {
              value: datasource.afdatabase.name,
              expandable: true,
            },
          },
        ]);
      }
    }
    return datasource
      .metricFindQuery(findQuery, Object.assign(data?.request?.scopedVars ?? {}, { isPiPoint: query.isPiPoint }))
      .then((items: any[]) => {
        const altSegments = map(items, (item: any) => {
          let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
            label: item.text,
            value: {
              webId: item.WebId,
              value: item.text,
              expandable: !query.isPiPoint && item.expandable,
            },
          };
          return selectableValue;
        });

        if (altSegments.length === 0) {
          return altSegments;
        }

        // add template variables
        const variables = datasource.templateSrv.getVariables();
        each(variables, (variable: TypedVariableModel) => {
          let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
            label: '${' + variable.name + '}',
            value: {
              type: 'template',
              value: '${' + variable.name + '}',
              expandable: !query.isPiPoint,
            },
          };
          altSegments.unshift(selectableValue);
        });

        // add remove label
        altSegments.unshift({
          label: REMOVE_LABEL,
          value: {
            value: REMOVE_LABEL,
          },
        });

        return altSegments;
      })
      .catch((err: any) => {
        ctrl.error = err.message || 'Failed to issue metric query';
        return [];
      });
  };

  // get the list of attributes for the user interface - PI
  getAttributeSegmentsPI = (attributeText?: string): Promise<Array<SelectableValue<PIWebAPISelectableValue>>> => {
    const { datasource, query, data } = this.props;
    const ctrl = this;
    const findQuery = {
      path: '',
      webId: this.getSelectedPIServer(),
      pointName: (attributeText ?? '') + '*',
      type: 'pipoint',
    };
    let segments: Array<SelectableValue<PIWebAPISelectableValue>> = [];
    return datasource
      .metricFindQuery(findQuery, Object.assign(data?.request?.scopedVars ?? {}, { isPiPoint: query.isPiPoint }))
      .then((items: any[]) => {
        segments = map(items, (item: any) => {
          let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
            path: item.Path,
            label: item.text,
            value: {
              value: item.text,
              expandable: false,
            },
          };
          return selectableValue;
        });
        if (!!attributeText && attributeText.length > 0) {
          segments.unshift({
            label: attributeText,
            value: {
              value: attributeText,
              expandable: false,
            },
          });
        }
        // add template variables
        const variables = datasource.templateSrv.getVariables();
        each(variables, (variable: TypedVariableModel) => {
          let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
            label: '${' + variable.name + '}',
            value: {
              type: 'template',
              value: '${' + variable.name + '}',
              expandable: !query.isPiPoint,
            },
          };
          segments.unshift(selectableValue);
        });

        // add remove label
        segments.unshift({
          label: REMOVE_LABEL,
          value: {
            value: REMOVE_LABEL,
          },
        });

        return segments;
      })
      .catch((err: any) => {
        ctrl.error = err.message || 'Failed to issue metric query';
        return segments;
      });
  };

  // get the list of attributes for the user interface - AF
  getAttributeSegmentsAF = (attributeText?: string): Array<SelectableValue<PIWebAPISelectableValue>> => {
    const { datasource } = this.props;
    const ctrl = this;
    let segments: Array<SelectableValue<PIWebAPISelectableValue>> = [];

    segments.push({
      label: REMOVE_LABEL,
      value: {
        value: REMOVE_LABEL,
      },
    });

    // add template variables
    const variables = datasource.templateSrv.getVariables();
    each(variables, (variable: TypedVariableModel) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: '${' + variable.name + '}',
        value: {
          type: 'template',
          value: '${' + variable.name + '}',
          expandable: false,
        },
      };
      segments.push(selectableValue);
    });

    forOwn(ctrl.availableAttributes, (val: any, key: string) => {
      let selectableValue: SelectableValue<PIWebAPISelectableValue> = {
        label: key,
        value: {
          value: key,
          expandable: true,
        },
      };
      segments.push(selectableValue);
    });

    return segments;
  };

  // build data from target string
  buildFromTarget = (
    query: PIWebAPIQuery,
    segmentsArray: Array<SelectableValue<PIWebAPISelectableValue>>,
    attributesArray: Array<SelectableValue<PIWebAPISelectableValue>>
  ) => {
    const splitAttributes = query.target!.split(';');
    const splitElements = splitAttributes.length > 0 ? splitAttributes[0].split('\\') : [];

    if (splitElements.length > 1 || (splitElements.length === 1 && splitElements[0] !== '')) {
      // remove element hierarchy from attribute collection
      splitAttributes.splice(0, 1);

      each(splitElements, (item, _) => {
        segmentsArray.push({
          label: item,
          value: {
            type: item.match(/\${\w+}/gi) ? 'template' : undefined,
            value: item,
            expandable: true,
          },
        });
      });
      each(splitAttributes, (item, _) => {
        if (item !== '') {
          // set current value
          attributesArray.push({
            label: item,
            value: {
              type: item.match(/\${\w+}/gi) ? 'template' : undefined,
              value: item,
              expandable: false,
            },
          });
        }
      });
      return this.getElementSegments(splitElements.length + 1, segmentsArray).then((elements) => {
        if (elements.length > 0) {
          segmentsArray.push({
            label: 'Select Element',
            value: {
              value: '-Select Element-',
            },
          });
        }
        return segmentsArray;
      });
    }
    return Promise.resolve(segmentsArray);
  };

  /**
   * Gets the segment information and parses it to a string.
   *
   * @param {any} index - Last index of segment to use.
   * @returns - AF Path or PI Point name.
   *
   * @memberOf PIWebAPIQueryEditor
   */
  getSegmentPathUpTo(segments: Array<SelectableValue<PIWebAPISelectableValue>>, index: number): string {
    const arr = segments.slice(0, index);

    return reduce(
      arr,
      (result: any, segment: SelectableValue<PIWebAPISelectableValue>) => {
        if (!segment.value) {
          return '';
        }
        if (!segment.value.value?.startsWith('-Select')) {
          return result ? result + '\\' + segment.value.value : segment.value.value;
        }
        return result;
      },
      ''
    );
  }

  /**
   * Get the current AF Element's child attributes. Validates when the element selection changes.
   *
   * @returns - Collection of attributes.
   *
   * @memberOf PIWebAPIQueryEditor
   */
  checkAttributeSegments(
    attributes: Array<SelectableValue<PIWebAPISelectableValue>>,
    segments: Array<SelectableValue<PIWebAPISelectableValue>>
  ): Promise<any> {
    const { datasource, data } = this.props;
    const ctrl = this;
    const findQuery = {
      path: this.getSegmentPathUpTo(segments.slice(0), segments.length),
      type: 'attributes',
    };
    return datasource
      .metricFindQuery(findQuery, Object.assign(data?.request?.scopedVars ?? {}, { isPiPoint: false }))
      .then((attributesResponse: any) => {
        const validAttributes: any = {};

        each(attributesResponse, (attribute: any) => {
          validAttributes[attribute.Path.substring(attribute.Path.indexOf('|') + 1)] = attribute.WebId;
        });

        const filteredAttributes = filter(attributes, (attrib: SelectableValue<PIWebAPISelectableValue>) => {
          const changedValue = datasource.templateSrv.replace(attrib.value?.value);
          return validAttributes[changedValue] !== undefined;
        });

        ctrl.availableAttributes = validAttributes;
        return this.attributeChangeValue(filteredAttributes);
      })
      .catch((err: any) => {
        ctrl.error = err.message || 'Failed to issue metric query';
        return this.attributeChangeValue(attributes);
      });
  }

  /**
   * Get PI points from server.
   *
   * @returns - Collection of attributes.
   *
   * @memberOf PIWebAPIQueryEditor
   */
  checkPiPointSegments(
    attribute: SelectableValue<PIWebAPISelectableValue>,
    attributes: Array<SelectableValue<PIWebAPISelectableValue>>
  ) {
    const { datasource, data } = this.props;
    const ctrl = this;
    const findQuery = {
      path: attribute.path,
      webId: ctrl.getSelectedPIServer(),
      pointName: attribute.label,
      type: 'pipoint',
    };
    return datasource
      .metricFindQuery(findQuery, Object.assign(data?.request?.scopedVars ?? {}, { isPiPoint: true }))
      .then(() => {
        return ctrl.attributeChangeValue(attributes);
      })
      .catch((err: any) => {
        ctrl.error = err.message || 'Failed to issue metric query';
        return ctrl.attributeChangeValue([]);
      });
  }

  /**
   * Gets the webid of the current selected pi data server.
   *
   * @memberOf PIWebAPIQueryEditor
   */
  getSelectedPIServer() {
    let webID = '';

    this.piServer.forEach((s) => {
      const parts = this.props.query.target!.split(';');
      if (parts.length >= 2) {
        if (parts[0] === s.text) {
          webID = s.WebId;
          return;
        }
      }
    });
    return this.piServer.length > 0 ? this.piServer[0].value?.webId : webID;
  }

  /**
   * Queries PI Web API for child elements and attributes when the raw query text editor is changed.
   *
   * @memberOf PIWebAPIQueryEditor
   */
  textEditorChanged() {
    const { query } = this.props;
    const splitAttributes = query.target!.split(';');
    const splitElements = splitAttributes.length > 0 ? splitAttributes[0].split('\\') : [];

    let segments: Array<SelectableValue<PIWebAPISelectableValue>> = [];
    let attributes: Array<SelectableValue<PIWebAPISelectableValue>> = [];

    if (splitElements.length > 1 || (splitElements.length === 1 && splitElements[0] !== '')) {
      // remove element hierarchy from attribute collection
      splitAttributes.splice(0, 1);

      each(splitElements, (item, _) => {
        segments.push({
          label: item,
          value: {
            type: item.match(/\${\w+}/gi) ? 'template' : undefined,
            value: item,
            expandable: true,
          },
        });
      });
      each(splitAttributes, function (item, index) {
        if (item !== '') {
          attributes.push({
            label: item,
            value: {
              type: item.match(/\${\w+}/gi) ? 'template' : undefined,
              value: item,
              expandable: false,
            },
          });
        }
      });
      this.getElementSegments(splitElements.length + 1, segments)
        .then((elements) => {
          if (elements.length > 0) {
            segments.push({
              label: 'Select Element',
              value: {
                value: '-Select Element-',
              },
            });
          }
        })
        .then(() => {
          this.updateArray(segments, attributes, this.state.summaries, query.isPiPoint!, () => {
            this.onChange({
              ...query,
              query: undefined,
              rawQuery: false,
              attributes: this.state.attributes,
              segments: this.state.segments,
            });
          });
        });
    } else {
      segments = this.checkAfServer();
      this.updateArray(segments, this.state.attributes, this.state.summaries, query.isPiPoint!, () => {
        this.onChange({
          ...query,
          query: undefined,
          rawQuery: false,
          attributes: this.state.attributes,
          segments: this.state.segments,
        });
      });
    }
  }

  /**
   * Check if the AF server and database are configured in the datasoure config.
   *
   * @returns the segments array
   *
   * @memberOf PIWebAPIQueryEditor
   */
  checkAfServer = () => {
    const { datasource } = this.props;
    const segmentsArray = [];
    if (datasource.afserver?.name) {
      segmentsArray.push({
        label: datasource.afserver.name,
        value: {
          value: datasource.afserver.name,
          expandable: true,
        },
      });
      if (datasource.afdatabase?.name) {
        segmentsArray.push({
          label: datasource.afdatabase.name,
          value: {
            value: datasource.afdatabase.name,
            expandable: true,
          },
        });
      }
      segmentsArray.push({
        label: 'Select Element',
        value: {
          value: '-Select Element-',
        },
      });
    } else {
      segmentsArray.push({
        label: '',
      });
    }
    return segmentsArray;
  };

  /**
   * Update the internal state of the datasource.
   *
   * @param segmentsArray the segments array to update
   * @param attributesArray the AF attributes array to update
   * @param summariesArray the summaries array to update
   * @param isPiPoint the is PI point flag
   * @param cb optional callback function
   *
   * @memberOf PIWebAPIQueryEditor
   */
  updateArray = (
    segmentsArray: Array<SelectableValue<PIWebAPISelectableValue>>,
    attributesArray: Array<SelectableValue<PIWebAPISelectableValue>>,
    summariesArray: Array<SelectableValue<PIWebAPISelectableValue>>,
    isPiPoint: boolean,
    cb?: (() => void) | undefined
  ) => {
    this.setState(
      {
        segments: segmentsArray,
        attributes: attributesArray,
        summaries: summariesArray,
        isPiPoint,
      },
      () => {
        if (!isPiPoint) {
          this.checkAttributeSegments(attributesArray, this.state.segments).then(() => {
            if (cb) {
              cb();
            }
          });
        }
      }
    );
  };

  // React action when component is initialized/updated
  scopedVarsDone = false;
  componentDidMount = () => {
    this.initialLoad(false);
  };

  componentDidUpdate = () => {
    const { query } = this.props;
    if (this.props.data?.state === 'Done' && !!this.props.data?.request?.scopedVars && !this.scopedVarsDone) {
      this.scopedVarsDone = true;
      this.initialLoad(!query.isPiPoint);
    }
  };

  initialLoad = (force: boolean) => {
    const { query } = this.props;
    const metricsQuery = defaults(query, defaultQuery) as PIWebAPIQuery;
    const { segments, attributes, summary, isPiPoint } = metricsQuery;

    let segmentsArray: Array<SelectableValue<PIWebAPISelectableValue>> = force ? [] : segments?.slice(0) ?? [];
    let attributesArray: Array<SelectableValue<PIWebAPISelectableValue>> = force ? [] : attributes?.slice(0) ?? [];
    let summariesArray = getSummaryTypes(summary); // TODO: remove in 6.0.0 => summary.types ?? [];

    if (!isPiPoint && segmentsArray.length === 0) {
      if (query.target && query.target.length > 0 && query.target !== ';') {
        attributesArray = [];
        // Build query from target
        this.buildFromTarget(query, segmentsArray, attributesArray)
          .then((_segmentsArray) => {
            this.updateArray(_segmentsArray, attributesArray, summariesArray, false);
          })
          .catch((e) => console.error(e));
        return;
      } else {
        segmentsArray = this.checkAfServer();
      }
    } else if (isPiPoint && segmentsArray.length > 0) {
      this.piServer = segmentsArray;
    }
    this.updateArray(segmentsArray, attributesArray, summariesArray, !!isPiPoint, () => {
      this.onChange(query);
    });
  };

  onChange = (query: PIWebAPIQuery) => {
    const { onChange, onRunQuery } = this.props;

    if (query.rawQuery) {
      query.target = query.query ?? '';
      if (!!query.query) {
        const { attributes, elementPath } = parseRawQuery(query.target);
        query.attributes = attributes;
        query.elementPath = elementPath;
      }
    } else {
      query.elementPath = this.getSegmentPathUpTo(this.state.segments, this.state.segments.length);
      query.target =
        query.elementPath +
        ';' +
        join(
          query.attributes?.map((s) => s.value?.value),
          ';'
        );
    }

    // recover summary due to format change
    // TODO: remove in 6.0.0
    const summary = {
      ...defaultQuery.summary,
      ...query.summary,
    };
    if (summary) {
      summary.types = this.state.summaries;
    }
    // END TODO

    onChange({...query, summary});

    if (this.isValidQuery(query)) {
      onRunQuery();
    }
  };

  isValidQuery = (query: PIWebAPIQuery): boolean => {
    if (query.target && query.target.length > 0 && query.target !== ";") {
      query.target = query.target.trim();
      const targetSplit = query.target.split(";", 2);
      return targetSplit.length === 2 && targetSplit[0].length > 0 && targetSplit[1].length > 0;
    }
    return false;
  }

  stateCallback = () => {
    const query = this.props.query as PIWebAPIQuery;
    this.onChange(query);
  };

  onIsPiPointChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const { query: queryChange } = this.props;
    const isPiPoint = !queryChange.isPiPoint;
    this.setState(
      {
        segments: isPiPoint ? [{ label: '' }] : this.checkAfServer(),
        attributes: [],
        isPiPoint,
      },
      () => {
        this.onChange({
          ...queryChange,
          expression: '',
          attributes: this.state.attributes,
          segments: this.state.segments,
          isPiPoint,
        });
      }
    );
  };

  onHideErrorChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const { query: queryChange } = this.props;
    const hideError = !queryChange.hideError;
    this.setState(
      {
        hideError,
      },
      () => {
        this.onChange({
          ...queryChange,
          hideError,
        });
      }
    );
  };

  render() {
    const { query: queryProps, onChange, onRunQuery } = this.props;
    const metricsQuery = defaults(queryProps, defaultQuery) as PIWebAPIQuery;
    const {
      useLastValue,
      useUnit,
      interpolate,
      query,
      rawQuery,
      digitalStates,
      enableStreaming,
      recordedValues,
      expression,
      isPiPoint,
      hideError,
      summary,
      nodata,
      display,
      regex,
    } = metricsQuery;

    return (
      <>
        {this.props.datasource.piPointConfig && (
          <InlineField label="Is Pi Point?" labelWidth={LABEL_WIDTH}>
            <InlineSwitch value={isPiPoint} onChange={this.onIsPiPointChange} />
          </InlineField>
        )}

        {!!rawQuery && (
          <InlineFieldRow>
            <InlineField label="Raw Query" labelWidth={LABEL_WIDTH} grow={true}>
              <Input
                onBlur={this.stateCallback}
                value={query}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ ...metricsQuery, query: event.target.value })
                }
                placeholder="enter query"
              />
            </InlineField>
            <QueryEditorModeSwitcher isRaw={true} onChange={(value: boolean) => this.textEditorChanged()} />
          </InlineFieldRow>
        )}

        {!rawQuery && (
          <>
            <div className="gf-form-inline">
              <QueryRawInlineField
                label={isPiPoint ? 'PI Server' : 'AF Elements'}
                tooltip={isPiPoint ? 'Select PI server.' : 'Select AF Element.'}
              >
                {this.state.segments.map((segment: SelectableValue<PIWebAPISelectableValue>, index: number) => {
                  return (
                    <SegmentAsync
                      key={'element-' + index}
                      Component={<CustomLabelComponent value={segment.value} label={segment.label} />}
                      onChange={(item) => this.onSegmentChange(item, index)}
                      loadOptions={(query?: string | undefined) => {
                        return this.getElementSegments(index);
                      }}
                      allowCustomValue
                      inputMinWidth={MIN_ELEM_INPUT_WIDTH}
                    />
                  );
                })}
                <QueryRowTerminator />
                {!isPiPoint && (
                  <QueryEditorModeSwitcher
                    isRaw={false}
                    onChange={(value: boolean) => {
                      onChange({ ...metricsQuery, query: metricsQuery.target, rawQuery: value });
                    }}
                  />
                )}
              </QueryRawInlineField>
            </div>

            <QueryInlineField label={isPiPoint ? 'Pi Points' : 'Attributes'}>
              {this.state.attributes.map((attribute: SelectableValue<PIWebAPISelectableValue>, index: number) => {
                if (isPiPoint) {
                  return (
                    <SegmentAsync
                      key={'attributes-' + index}
                      Component={<CustomLabelComponent value={attribute.value} label={attribute.label} />}
                      disabled={this.piServer.length === 0}
                      onChange={(item) => this.onPiPointChange(item, index)}
                      loadOptions={this.getAttributeSegmentsPI}
                      reloadOptionsOnChange
                      allowCustomValue
                      inputMinWidth={MIN_ATTR_INPUT_WIDTH}
                    />
                  );
                }
                return (
                  <Segment
                    key={'attributes-' + index}
                    Component={<CustomLabelComponent value={attribute.value} label={attribute.label} />}
                    disabled={this.state.segments.length <= 2}
                    onChange={(item) => this.onAttributeChange(item, index)}
                    options={this.getAttributeSegmentsAF()}
                    allowCustomValue
                    inputMinWidth={MIN_ATTR_INPUT_WIDTH}
                  />
                );
              })}

              {isPiPoint && (
                <SegmentAsync
                  Component={
                    <CustomLabelComponent
                      value={this.state.attributeSegment.value}
                      label={this.state.attributeSegment.label}
                    />
                  }
                  disabled={this.piServer.length === 0}
                  onChange={this.onAttributeAction}
                  loadOptions={this.getAttributeSegmentsPI}
                  reloadOptionsOnChange
                  allowCustomValue
                  inputMinWidth={MIN_ATTR_INPUT_WIDTH}
                />
              )}
              {!isPiPoint && (
                <Segment
                  Component={
                    <CustomLabelComponent
                      value={this.state.attributeSegment.value}
                      label={this.state.attributeSegment.label}
                    />
                  }
                  disabled={this.state.segments.length <= 2}
                  onChange={this.onAttributeAction}
                  options={this.getAttributeSegmentsAF()}
                  allowCustomValue
                  inputMinWidth={MIN_ATTR_INPUT_WIDTH}
                />
              )}
            </QueryInlineField>
          </>
        )}

        <InlineFieldRow>
          <InlineField
            label="Calculation"
            grow={true}
            labelWidth={LABEL_WIDTH}
            tooltip={
              "Modify all attributes by an equation. Use '.' for current item. Leave Attributes empty if you wish to perform element based calculations."
            }
          >
            <Input
              onBlur={onRunQuery}
              value={expression}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ ...metricsQuery, expression: event.target.value })
              }
              placeholder="'.'*2"
            />
          </InlineField>
        </InlineFieldRow>

        <InlineFieldRow>
          <InlineField
            label="Use Last Value"
            tooltip={"Returns values of the attributes for an Element or Pi Point at the specified end time (StreamSet GetValues)."}
            labelWidth={LABEL_WIDTH}
          >
            <InlineSwitch
              value={useLastValue.enable}
              onChange={() =>
                this.onChange({
                  ...metricsQuery,
                  useLastValue: { ...useLastValue, enable: !useLastValue.enable },
                  recordedValues: defaultQuery.recordedValues!,
                  interpolate: defaultQuery.interpolate!,
                  summary: defaultQuery.summary!,
                })
              }
            />
          </InlineField>

          {useLastValue.enable && (
            <InlineField
              label="Ignore end time"
              tooltip={"Returns End of stream value (StreamSet GetEnd). Ignore selected end time."}
              labelWidth={LABEL_WIDTH}
            >
              <InlineSwitch
                value={recordedValues.enable}
                onChange={() =>
                  this.onChange({
                    ...metricsQuery,
                    recordedValues: { enable: !recordedValues.enable , boundaryType: 'Inside' },
                  })
                }
              />
            </InlineField>
          )}
          <InlineField label="Digital States" labelWidth={LABEL_WIDTH}>
            <InlineSwitch
              value={digitalStates.enable}
              onChange={() =>
                this.onChange({
                  ...metricsQuery,
                  digitalStates: { ...digitalStates, enable: !digitalStates.enable },
                })
              }
            />
          </InlineField>
          <InlineField
            label="Replace Bad Data"
            labelWidth={LABEL_WIDTH}
            tooltip={'Replacement for bad quality values.'}
          >
            <Segment
              Component={
                <CustomLabelComponent
                  width={LABEL_WIDTH * 4}
                  value={{ value: nodata }}
                  label={nodata}
                />
              }
              onChange={this.calcNoDataValueChanged}
              options={this.getNoDataSegments()}
              allowCustomValue
            />
          </InlineField>
          {this.props.datasource.useUnitConfig && (
            <InlineField
              label="Use unit from datapoints"
              tooltip={"Use unit in label from PI tag or PI AF attribute"}
              labelWidth={LABEL_WIDTH}
            >
              <InlineSwitch
                value={useUnit.enable}
                onChange={() =>
                  this.onChange({
                    ...metricsQuery,
                    useUnit: { ...useUnit, enable: !useUnit.enable },
                  })
                }
              />
            </InlineField>
          )}
          {this.props.datasource.useStreaming && (
            <InlineField 
              label="Enable Streaming" 
              labelWidth={LABEL_WIDTH}
              tooltip={'Enable streaming data if it is supported for the point type.'}
            >
              <InlineSwitch
                value={enableStreaming.enable}
                onChange={() =>
                  this.onChange({ ...metricsQuery, enableStreaming: { ...enableStreaming, enable: !enableStreaming.enable } })
                }
              />
            </InlineField>
          )}
        </InlineFieldRow>
        
        {(interpolate.enable || (!useLastValue.enable && !recordedValues.enable && !summary.enable)) && (
          <InlineFieldRow>
            <InlineField
              label={!!expression ? "Interval Values" : "Interpolate"}
              labelWidth={LABEL_WIDTH}
              tooltip={!!expression ? '' : 'Returns interpolated values of attributes for an element or pi point over the specified time range at the specified sampling interval (StreamSet GetInterpolated).'}
            >
              <InlineSwitch
                value={interpolate.enable}
                onChange={() =>
                  this.onChange({
                    ...metricsQuery,
                    interpolate: { ...interpolate, enable: !interpolate.enable, interval: undefined },
                    useLastValue: defaultQuery.useLastValue!,
                    recordedValues: defaultQuery.recordedValues!,
                    summary: defaultQuery.summary!,
                  })
                }
              />
            </InlineField>
            <InlineField
              disabled={!interpolate.enable}
              label={!!expression ? "Interval Period" : "Interpolate Period"}
              labelWidth={LABEL_WIDTH}
              tooltip={"Override time between sampling, e.g. '30s'. Defaults to timespan/chart width."}
            >
              <Input
                onBlur={onRunQuery}
                width={LABEL_WIDTH + LABEL_SWITCH_WIDTH + 0.5}
                value={interpolate.interval}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ ...metricsQuery, interpolate: { ...interpolate, interval: event.target.value } })
                }
                placeholder="30s"
              />
            </InlineField>
          </InlineFieldRow>
        )}

        {!useLastValue.enable && !interpolate.enable && !summary.enable && (
          <InlineFieldRow>
            <InlineField
              label="Recorded Values"
              labelWidth={LABEL_WIDTH}
              tooltip={'Returns recorded values of the attributes for an element, event frame, or attribute (StreamSet GetRecorded).'}
            >
              <InlineSwitch
                value={recordedValues.enable}
                onChange={() =>
                  this.onChange({
                    ...metricsQuery,
                    recordedValues: { ...recordedValues, enable: !recordedValues.enable, maxNumber: undefined, boundaryType: 'Inside' },
                    useLastValue: defaultQuery.useLastValue!,
                    interpolate: defaultQuery.interpolate!,
                    summary: defaultQuery.summary!,
                  })
                }
              />
            </InlineField>
            <InlineField
              label="Max Recorded Values"
              labelWidth={LABEL_WIDTH}
              tooltip={
                'Maximum number of recorded value to retrive from the data archive, without using interpolation.'
              }
            >
              <Input
                onBlur={onRunQuery}
                width={LABEL_WIDTH + LABEL_SWITCH_WIDTH + 0.5}
                value={recordedValues.maxNumber}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({
                    ...metricsQuery,
                    recordedValues: { ...recordedValues, maxNumber: parseInt(event.target.value, 10) },
                  })
                }
                type="number"
                placeholder="1000"
              />
            </InlineField>
            <InlineField
              label="Boundary Type"
              labelWidth={LABEL_WIDTH}
              tooltip={
                'Defines the behavior of data retrieval at the end points of a specified time range.'
              }
              >
                <Segment
                  Component={
                    <CustomLabelComponent
                      width={LABEL_WIDTH * 4}
                      value={{ value: recordedValues?.boundaryType }}
                      label={recordedValues?.boundaryType}
                    />
                  }
                  onChange={this.recordedBoundaryTypeValueChanged}
                  options={this.getRecordedBoundaryTypeSegments()}
                  allowCustomValue
                />
            </InlineField>
          </InlineFieldRow>
        )}

        {(summary.enable || (!recordedValues.enable && !useLastValue.enable && !interpolate.enable)) && (
          <InlineFieldRow>
            <InlineField
              label="Summary Enable"
              labelWidth={LABEL_WIDTH}
              tooltip={'Returns summary values of the attributes for an element, event frame or attribute (StreamSet GetSummaries).'}
            >
              <InlineSwitch
                value={summary?.enable}
                onChange={() =>
                  this.onChange({
                    ...metricsQuery,
                    summary: { ...summary, enable: !(summary?.enable) },
                    useLastValue: defaultQuery.useLastValue!,
                    recordedValues: defaultQuery.recordedValues!,
                    interpolate: defaultQuery.interpolate!,
                  })
                }
              />
            </InlineField>
            <InlineField
              disabled={!summary?.enable}
              label="Summary Basis"
              labelWidth={LABEL_WIDTH}
              tooltip={
                'Defines the possible calculation options when performing summary calculations over time-series data.'
              }
            >
              <Segment
                Component={
                  <CustomLabelComponent
                    width={(LABEL_WIDTH + LABEL_SWITCH_WIDTH + 0.5) * 8}
                    marginRight="0"
                    value={{ value: summary?.basis }}
                    label={summary?.basis}
                  />
                }
                onChange={this.calcBasisValueChanged}
                options={this.getCalcBasisSegments()}
                allowCustomValue
              />
            </InlineField>
            <InlineField 
              disabled={!summary?.enable}
              label="Summaries Types" 
              labelWidth={LABEL_WIDTH} 
              tooltip={'PI Web API summary options.'}
            >
              <InlineFieldRow>
                {this.state.summaries.map((s: SelectableValue<PIWebAPISelectableValue>, index: number) => {
                  return (
                    <Segment
                      key={'summaries-' + index}
                      Component={<CustomLabelComponent value={s.value} label={s.label} />}
                      onChange={(item) => this.onSummaryValueChanged(item, index)}
                      options={this.getSummarySegments()}
                      allowCustomValue
                    />
                  );
                })}
                <Segment
                  Component={
                    <CustomLabelComponent
                      value={this.state.summarySegment.value}
                      label={this.state.summarySegment.label}
                    />
                  }
                  onChange={this.onSummaryAction}
                  options={this.getSummarySegments()}
                  allowCustomValue
                />
              </InlineFieldRow>
            </InlineField>
          </InlineFieldRow>
        )}
        {summary?.enable && (
          <InlineFieldRow>
            <InlineField 
              label="Enable interval" 
              labelWidth={LABEL_WIDTH}
              tooltip={'Enable summary type interval.'}
            >
              <InlineSwitch
                value={!!summary?.sampleTypeInterval}
                onChange={() =>
                  this.onChange({ ...metricsQuery, summary: { ...summary, sampleTypeInterval: !(summary?.sampleTypeInterval) } })
                }
              />
            </InlineField>
            <InlineField
              disabled={!summary.sampleTypeInterval}
              label="Sample Interval"
              labelWidth={LABEL_WIDTH}
              tooltip={"A time span specifies how often the filter expression is evaluated when computing the summary for an interval, if the sampleType is enable."}
            >
              <Input
                onBlur={onRunQuery}
                width={LABEL_WIDTH + (LABEL_SWITCH_WIDTH + 0.5)}
                value={summary?.sampleInterval}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ ...metricsQuery, summary: { ...summary, sampleInterval: event.target.value } })
                }
                placeholder="30s"
              />
            </InlineField>
            <InlineField
              label="Summary Period"
              labelWidth={LABEL_WIDTH}
              tooltip={"The duration of each summary interval, e.g. '30s'."}
            >
              <Input
                onBlur={onRunQuery}
                width={LABEL_WIDTH + (LABEL_SWITCH_WIDTH + 0.5)}
                value={summary?.duration}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({ ...metricsQuery, summary: { ...summary, duration: event.target.value } })
                }
                placeholder="30s"
              />
            </InlineField>
          </InlineFieldRow>
        )}

        <InlineFieldRow>
          <InlineField
            label="Display Name"
            labelWidth={LABEL_WIDTH}
            tooltip={'If single attribute, modify display name. Otherwise use regex to modify display name.'}
          >
            <Input
              onBlur={onRunQuery}
              width={LABEL_WIDTH + (LABEL_SWITCH_WIDTH + 0.5)}
              value={display}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ ...metricsQuery, display: event.target.value })
              }
              placeholder="Display"
            />
          </InlineField>
          <InlineField label="Enable Regex Replace" labelWidth={LABEL_WIDTH}>
            <InlineSwitch
              value={regex.enable}
              onChange={() => {
                this.onChange({ ...metricsQuery, regex: { ...regex, enable: !regex.enable } });
              }}
            />
          </InlineField>
          <InlineField label="Search" labelWidth={LABEL_WIDTH}>
            <Input
              onBlur={onRunQuery}
              width={LABEL_WIDTH}
              value={regex.search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ ...metricsQuery, regex: { ...regex, search: event.target.value } })
              }
              placeholder="(.*)"
            />
          </InlineField>
          <InlineField label="Replace" labelWidth={LABEL_WIDTH}>
            <Input
              onBlur={onRunQuery}
              width={LABEL_WIDTH}
              value={regex.replace}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ ...metricsQuery, regex: { ...regex, replace: event.target.value } })
              }
              placeholder="$1"
            />
          </InlineField>
        </InlineFieldRow>

        <InlineFieldRow>
          <InlineField
            label="Ignore API Error?"
            labelWidth={LABEL_WIDTH}
            tooltip={'Don\'t present errors from PiWebAPI in the panel.'}
          >
            <InlineSwitch value={hideError} onChange={this.onHideErrorChange} />
          </InlineField>
        </InlineFieldRow>
      </>
    );
  }
}
