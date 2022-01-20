import React, { InputHTMLAttributes, FunctionComponent } from 'react';
import { InlineFormLabel } from '@grafana/ui';

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  tooltip?: string;
  labelWidth?: number;
  children?: React.ReactNode;
  queryEditor?: JSX.Element;
}

export const QueryField: FunctionComponent<Partial<Props>> = ({ label, labelWidth = 8, tooltip, children }) => (
  <>
    <InlineFormLabel width={labelWidth} className="query-keyword" tooltip={tooltip}>
      {label}
    </InlineFormLabel>
    {children}
  </>
);

export const QueryRowTerminator = () => {
  return (
    <div className="gf-form gf-form--grow">
      <div className="gf-form-label gf-form-label--grow" />
    </div>
  );
};

export const QueryInlineField = ({ ...props }) => {
  return (
    <QueryEditorRow>
      <QueryField {...props} />
    </QueryEditorRow>
  );
};

export const QueryEditorRow = (props: Partial<Props>) => {
  return (
    <div className="gf-form-inline">
      {props.children}
      <QueryRowTerminator />
    </div>
  );
};

export const QueryRawInlineField = ({ ...props }) => {
  return (
    <QueryRawEditorRow>
      <QueryField {...props} />
    </QueryRawEditorRow>
  );
};

export const QueryRawEditorRow = (props: Partial<Props>) => {
  return <>{props.children}</>;
};
