import React, { useEffect } from 'react';
import { findWidget, findWrapper } from '../registry';
import { IField } from '../types';
import { useFieldExpressions } from '../hook/useFieldExpressions';
import { useFieldHide } from '../hook/useFieldHide';
import { useFieldProps } from '../hook/useFieldProps';
import { useFieldArray } from '../hook/useFieldArray';
import { useFieldReset } from '../hook/useFieldReset';
import { useFieldValidators } from '../hook/useFieldValidators';

export interface IFieldProps {
  field: IField;
}

export const Field: React.FC<IFieldProps> = ({ field }) => {
  const { propsCalculator, hideCalculator } = useFieldExpressions(field);
  const hide = useFieldHide(hideCalculator);

  useFieldProps(field, propsCalculator);
  useFieldArray(field);

  if (hide) {
    return null;
  }

  let res: JSX.Element | null = null;

  if (field.type) {
    // 如果 field.type 存在，那么这个 widget 会全权负责整个 field 的渲染工作
    res = <FieldType field={field} />;
  } else if (field.group) {
    res = <FieldGroup fields={field.group} />;
  }

  if (field.wrapper) {
    res = <FieldWrapper field={field}>{res}</FieldWrapper>;
  }

  return res;
};

const FieldType: React.FC<{
  field: IField;
}> = ({ field }) => {
  console.assert(field.type, 'FieldType field must have type');

  const reset = useFieldReset(field);
  const Widget = getWidget(field.type!);

  useEffect(() => reset, [reset]);
  useFieldValidators(field);

  return <Widget {...field.props} field={field} />;
};

function getWidget(type: string) {
  const Widget = findWidget(type);

  if (Widget) {
    return Widget;
  }

  throw Error(`can not find Widget with name ${type}`);
}

const FieldWrapper: React.FC<{
  field: IField;
  children: JSX.Element | null;
}> = ({ field, children }) => {
  if (!Array.isArray(field.wrapper)) {
    console.warn(
      `field "wrapper" must be array type, and not empty. current wrapper is "${
        field.wrapper
      }", type is ${typeof field.wrapper}.`
    );

    return children;
  }

  return field.wrapper.reduce((acc, key) => {
    const Comp = findWrapper(key);

    if (Comp) {
      return React.createElement(Comp, { ...field.props, field: field }, acc);
    }

    return acc;
  }, children);
};

interface IFieldGroupProps {
  fields: IField[];
}

const FieldGroup: React.FC<IFieldGroupProps> = ({ fields }) => {
  return (
    <div>
      {fields.map((field) => (
        <Field key={field.id} field={field} />
      ))}
    </div>
  );
};
