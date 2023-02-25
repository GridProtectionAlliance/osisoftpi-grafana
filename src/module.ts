import { DataSourcePlugin } from '@grafana/data';
import { PIWebAPIConfigEditor } from './ConfigEditor';
import { PIWebAPIQueryEditor } from './QueryEditor';
import { PiWebAPIDatasource } from './datasource';
import { PIWebAPIQuery, PIWebAPIDataSourceJsonData } from './types';

export const plugin = new DataSourcePlugin<PiWebAPIDatasource, PIWebAPIQuery, PIWebAPIDataSourceJsonData>(
  PiWebAPIDatasource
)
.setQueryEditor(PIWebAPIQueryEditor)
.setConfigEditor(PIWebAPIConfigEditor);
