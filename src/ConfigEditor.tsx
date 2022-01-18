import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, DataSourceHttpSettings } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { PIWebAPIDataSourceJsonData } from './types';

const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<PIWebAPIDataSourceJsonData, {}> {}

const coerceOptions = (
  options: DataSourceSettings<PIWebAPIDataSourceJsonData, {}>
): DataSourceSettings<PIWebAPIDataSourceJsonData, {}> => {
  return {
    ...options,
    jsonData: {
      ...options.jsonData,
      url: options.url
    },
  }
}

interface State {}

export class PIWebAPIConfigEditor extends PureComponent<Props, State> {
  onPIServerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      piserver: event.target.value,
    }
    onOptionsChange({ ...options, jsonData })
  }

  onAFServerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      afserver: event.target.value,
    }
    onOptionsChange({ ...options, jsonData })
  }

  onAFDatabaseChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      afdatabase: event.target.value,
    }
    onOptionsChange({ ...options, jsonData })
  }

  componentDidUpdate() {
    const { options } = this.props
    coerceOptions(options)
  }

  render() {
    const { onOptionsChange, options: originalOptions } = this.props
    const options = coerceOptions(originalOptions)

    return (
      <div>  
        <DataSourceHttpSettings
          defaultUrl="https://server.name/webapi"
          dataSourceConfig={options}
          onChange={onOptionsChange}
          showAccessOptions
        />

        <h3 className="page-heading">PI/AF Connection Details</h3>
  
        <div className="gf-form-group">
          <div className="gf-form">
            <FormField
              label="PI Server"
              labelWidth={10}
              inputWidth={25}
              onChange={this.onPIServerChange}
              value={options.jsonData.piserver || ''}
              placeholder="Default PI Server to use for data requests"
            />
          </div>
          <div className="gf-form">
            <FormField
              label="AF Server"
              labelWidth={10}
              inputWidth={25}
              onChange={this.onAFServerChange}
              value={options.jsonData.afserver || ''}
              placeholder="Default AF Server to use for data requests"
            />
          </div>
          <div className="gf-form">
            <FormField
              label="AF Database"
              labelWidth={10}
              inputWidth={25}
              onChange={this.onAFDatabaseChange}
              value={options.jsonData.afdatabase || ''}
              placeholder="Default AF Database server for AF queries"
            />
          </div>
        </div>
      </div>
    );
  }
}
