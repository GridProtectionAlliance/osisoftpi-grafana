import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, DataSourceHttpSettings } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings, DataSourceJsonData } from '@grafana/data';
import { PIWebAPIDataSourceJsonData } from './types';

const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<PIWebAPIDataSourceJsonData> {}

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

  render() {
    const { onOptionsChange, options } = this.props;
    const { jsonData } = options;

    jsonData.url = options.url;

    return (
      <div>  
        <DataSourceHttpSettings
          defaultUrl="https://server.name/webapi"
          dataSourceConfig={options}
          onChange={(config: DataSourceSettings<DataSourceJsonData, {}>) => {
            jsonData.url = config.url;
            console.log(jsonData);
            onOptionsChange({...config, jsonData});
          }}
          showAccessOptions={true}
        />

        <h3 className="page-heading">PI/AF Connection Details</h3>
  
        <div className="gf-form-group">
          <div className="gf-form">
            <FormField
              label="PI Server"
              labelWidth={10}
              inputWidth={25}
              onChange={this.onPIServerChange}
              value={jsonData.piserver || ''}
              placeholder="Default PI Server to use for data requests"
            />
          </div>
          <div className="gf-form">
            <FormField
              label="AF Server"
              labelWidth={10}
              inputWidth={25}
              onChange={this.onAFServerChange}
              value={jsonData.afserver || ''}
              placeholder="Default AF Server to use for data requests"
            />
          </div>
          <div className="gf-form">
            <FormField
              label="AF Database"
              labelWidth={10}
              inputWidth={25}
              onChange={this.onAFDatabaseChange}
              value={jsonData.afdatabase || ''}
              placeholder="Default AF Database server for AF queries"
            />
          </div>
        </div>
      </div>
    );
  }
}
