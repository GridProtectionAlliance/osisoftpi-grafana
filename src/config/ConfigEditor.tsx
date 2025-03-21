import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, DataSourceHttpSettings, InlineField, InlineSwitch } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, DataSourceJsonData, DataSourceSettings } from '@grafana/data';
import { PIWebAPIDataSourceJsonData } from '../types';

const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<PIWebAPIDataSourceJsonData, {}> {}

const coerceOptions = (
  options: DataSourceSettings<PIWebAPIDataSourceJsonData, {}>
): DataSourceSettings<PIWebAPIDataSourceJsonData, {}> => {
  return {
    ...options,
    jsonData: {
      ...options.jsonData,
      url: options.url,
    },
  };
};

interface State {}

export class PIWebAPIConfigEditor extends PureComponent<Props, State> {
  onPIServerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      piserver: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onAFServerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      afserver: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onAFDatabaseChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      afdatabase: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onHttpOptionsChange = (options: DataSourceSettings<DataSourceJsonData, {}>) => {
    const { onOptionsChange } = this.props;
    onOptionsChange(coerceOptions(options));
  };

  onPiPointChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      piserver: event.target.checked ? options.jsonData.piserver : '',
      pipoint: event.target.checked,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onNewFormatChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      newFormat: event.target.checked,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onMaxCacheTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      maxCacheTime: Number(event.target.value),
    };
    onOptionsChange({ ...options, jsonData });
  };

  onUseUnitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      useUnit: event.target.checked,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onUseExperimentalChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      useExperimental : event.target.checked,
      useStreaming : event.target.checked ? options.jsonData.useStreaming : false,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onUseStreamingChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      useStreaming: event.target.checked,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onUseResponseCacheChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      useResponseCache: event.target.checked,
    };
    onOptionsChange({ ...options, jsonData });
  };

  render() {
    const { options: originalOptions } = this.props;
    const options = coerceOptions(originalOptions);

    return (
      <div>
        <DataSourceHttpSettings
          defaultUrl="https://server.name/piwebapi"
          dataSourceConfig={options}
          onChange={this.onHttpOptionsChange}
          showAccessOptions
        />

        <h3 className="page-heading">Custom Configuration</h3>

        <div className="gf-form-group">
          <div className="gf-form">
            <FormField
              label="Max Cache Time"
              labelWidth={13}
              inputWidth={12}
              type='number'
              tooltip={'Maximum number of hours for WebID cache. Default 12h'}
              onChange={this.onMaxCacheTimeChange}
              value={options.jsonData.maxCacheTime}
              placeholder="Cache in hours"
            />
          </div>
          <div className="gf-form-inline">
            <InlineField label="Enable PI Points in Query" labelWidth={26} tooltip={'Allow queries to PI data server'}>
              <InlineSwitch value={options.jsonData.pipoint} onChange={this.onPiPointChange} />
            </InlineField>
          </div>
          <div className="gf-form-inline">
            <InlineField label="Enable New Data Format" labelWidth={26} tooltip={'Allow new extended format in data frames'}>
              <InlineSwitch value={options.jsonData.newFormat} onChange={this.onNewFormatChange} />
            </InlineField>
          </div>
          <div className="gf-form-inline">
            <InlineField label="Enable Unit From Data" labelWidth={26} tooltip={'Add units defined in PI to data frames'}>
              <InlineSwitch value={options.jsonData.useUnit} onChange={this.onUseUnitChange} />
            </InlineField>
          </div>
          {/* {options.jsonData.useExperimental && (
            <div className="gf-form-inline">
              <InlineField label="Enable Steaming Support" labelWidth={26}>
                <InlineSwitch value={options.jsonData.useStreaming} onChange={this.onUseStreamingChange} />
              </InlineField>
            </div>
          )} */}
        </div>

        <h3 className="page-heading">PI/AF Connection Details</h3>

        <div className="gf-form-group">
          {options.jsonData.pipoint && (
            <div className="gf-form">
              <FormField
                label="PI Server"
                labelWidth={13}
                inputWidth={20}
                onChange={this.onPIServerChange}
                value={options.jsonData.piserver || ''}
                tooltip={'Default PI Server to use for data requests'}
                placeholder="PI Server"
              />
            </div>
          )}
          <div className="gf-form">
            <FormField
              label="AF Server"
              labelWidth={13}
              inputWidth={20}
              onChange={this.onAFServerChange}
              value={options.jsonData.afserver || ''}
              tooltip={'Default AF Server to use for data requests'}
              placeholder="AF Server"
            />
          </div>
          <div className="gf-form">
            <FormField
              label="AF Database"
              labelWidth={13}
              inputWidth={20}
              onChange={this.onAFDatabaseChange}
              value={options.jsonData.afdatabase || ''}
              tooltip={'Default AF Database server for AF queries'}
              placeholder="AF Database"
            />
          </div>
        </div>

        <h3 className="page-heading">Additional Configuration</h3>

        <div className="gf-form-group">
          <div className="gf-form-inline">
              <InlineField label="Enable Experimental Features" labelWidth={26}>
                <InlineSwitch value={options.jsonData.useExperimental} onChange={this.onUseExperimentalChange} />
              </InlineField>
            </div>
            {options.jsonData.useExperimental && (
              <div className="gf-form-inline">
                <InlineField label="Enable Response Cache" labelWidth={26} tooltip={'Use cached response when API returns error'}>
                  <InlineSwitch value={options.jsonData.useResponseCache} onChange={this.onUseResponseCacheChange} />
                </InlineField>
              </div>
            )}
        </div>
      </div>
    );
  }
}
