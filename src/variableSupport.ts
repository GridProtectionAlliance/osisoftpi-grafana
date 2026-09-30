import { from, map, Observable } from 'rxjs';

import { CustomVariableSupport, DataQueryRequest, DataQueryResponse } from '@grafana/data';

import type { PiWebAPIDatasource } from './datasource';
import { PiWebAPIVariableQueryEditor, variableQueryText } from './query/VariableQueryEditor';
import { PIWebAPIVariableQuery } from './types';

export class PiWebAPIVariableSupport extends CustomVariableSupport<PiWebAPIDatasource, PIWebAPIVariableQuery> {
  editor = PiWebAPIVariableQueryEditor;

  constructor(private readonly datasource: PiWebAPIDatasource) {
    super();
  }

  query(request: DataQueryRequest<PIWebAPIVariableQuery>): Observable<DataQueryResponse> {
    const text = variableQueryText(request.targets[0]);
    return from(this.datasource.metricFindQuery(text, { scopedVars: request.scopedVars, range: request.range })).pipe(
      map((values) => ({ data: values.map(({ text, value }) => ({ text, value: value ?? text })) }))
    );
  }
}
