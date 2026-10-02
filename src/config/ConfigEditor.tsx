import React, { ChangeEvent, PureComponent } from 'react';
import { Divider, InlineField, InlineSwitch, Input } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { AdvancedHttpSettings, Auth, ConnectionSettings, convertLegacyAuthProps } from '@grafana/plugin-ui';
import { PIWebAPIDataSourceJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<PIWebAPIDataSourceJsonData, {}> {}

/**
 * The backend reads the max cache time as a whole number of hours: a decimal value would stop the datasource from
 * loading, so it is rounded. An empty or invalid value is left out and the backend uses its default.
 */
const parseMaxCacheTime = (value: string): number | undefined => {
  const hours = Number(value);
  return value.trim() === '' || !Number.isFinite(hours) ? undefined : Math.max(0, Math.round(hours));
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

  onHttpOptionsChange = (options: DataSourceSettings<PIWebAPIDataSourceJsonData, {}>) => {
    const { onOptionsChange } = this.props;
    onOptionsChange(options);
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
      maxCacheTime: parseMaxCacheTime(event.target.value),
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
    const { options } = this.props;

    return (
      <div>
        <ConnectionSettings
          config={options}
          onChange={this.onHttpOptionsChange}
          urlPlaceholder="https://server.name/piwebapi"
        />
        <Divider />
        <Auth {...convertLegacyAuthProps({ config: options, onChange: this.onHttpOptionsChange })} />
        <Divider />
        <AdvancedHttpSettings config={options} onChange={this.onHttpOptionsChange} />
        <Divider />

        <h3 className="page-heading">Custom Configuration</h3>

        <div className="gf-form-group">
          <div className="gf-form">
            <InlineField
              label="Max Cache Time"
              labelWidth={26}
              tooltip={'Maximum number of hours for WebID cache. Default 12h'}
            >
              <Input
                id="config-max-cache-time"
                width={24}
                type="number"
                min={0}
                step={1}
                onChange={this.onMaxCacheTimeChange}
                value={options.jsonData.maxCacheTime ?? ''}
                placeholder="Cache in hours"
              />
            </InlineField>
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
          <div className="gf-form-inline">
            <InlineField label="Enable Streaming Support" labelWidth={26} tooltip={'Stream live PI tag values via WebSocket'}>
              <InlineSwitch value={options.jsonData.useStreaming} onChange={this.onUseStreamingChange} />
            </InlineField>
          </div>
        </div>

        <h3 className="page-heading">PI/AF Connection Details</h3>

        <div className="gf-form-group">
          {options.jsonData.pipoint && (
            <div className="gf-form">
              <InlineField label="PI Server" labelWidth={26} tooltip={'Default PI Server to use for data requests'}>
                <Input
                  id="config-pi-server"
                  width={40}
                  onChange={this.onPIServerChange}
                  value={options.jsonData.piserver || ''}
                  placeholder="PI Server"
                />
              </InlineField>
            </div>
          )}
          <div className="gf-form">
            <InlineField label="AF Server" labelWidth={26} tooltip={'Default AF Server to use for data requests'}>
              <Input
                id="config-af-server"
                width={40}
                onChange={this.onAFServerChange}
                value={options.jsonData.afserver || ''}
                placeholder="AF Server"
              />
            </InlineField>
          </div>
          <div className="gf-form">
            <InlineField label="AF Database" labelWidth={26} tooltip={'Default AF Database server for AF queries'}>
              <Input
                id="config-af-database"
                width={40}
                onChange={this.onAFDatabaseChange}
                value={options.jsonData.afdatabase || ''}
                placeholder="AF Database"
              />
            </InlineField>
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
