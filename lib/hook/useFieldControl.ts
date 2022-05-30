import { FieldHelperProps, FieldMetaProps, useFormikContext } from 'formik';
import { IField } from '../types';

export interface IFieldControl<Value = any> {
  value: FieldMetaProps<Value>['value'];
  error: FieldMetaProps<Value>['error'];
  touched: FieldMetaProps<Value>['touched'];
  setValue: FieldHelperProps<Value>['setValue'];
  setError: FieldHelperProps<Value>['setError'];
  setTouched: FieldHelperProps<Value>['setTouched'];
}

export function useFieldControl(field: IField): IFieldControl | null {
  const { getFieldHelpers, getFieldMeta } = useFormikContext();

  if (field.name == null || field._keyPath == null) {
    return null;
  }

  const { value, touched, error } = getFieldMeta(field._keyPath);
  const { setValue, setTouched, setError } = getFieldHelpers(field._keyPath);

  return { value, touched, error, setValue, setTouched, setError };
}
