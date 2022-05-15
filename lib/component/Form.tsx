import React, { useEffect, useRef, useMemo } from 'react';
import { useFormik, FormikProvider } from 'formik';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { IEnhancedField, IFormValues, IRawFields, IValidationConfig } from '../types';
import { Field } from './Field';
import { useFieldExtensions } from './useFieldExtensions';
import './ui';

export interface IJsonFormProps<Values = any> {
  source: IRawFields;
  onChange?(values: Values): void;
  initialValues?: Values;
  idPrefix?: string;
  validationConfig?: IValidationConfig;
}

export const JsonForm = <Values extends IFormValues = any>({
  source,
  onChange,
  initialValues = {} as any,
  idPrefix = 'react-json-form-',
  validationConfig,
}: IJsonFormProps<Values>) => {
  // 创建form的state
  const formik = useFormik({
    initialValues,
    onSubmit() {},
  });

  useEffect(() => {
    onChange?.(formik.values);
  }, [formik.values, onChange]);

  const formikRef = useRef(formik);

  formikRef.current = formik;

  const mergedValidationConfig = useMemo(() => {
    return merge({}, defaultValidationConfig, validationConfig);
    // ignore validationConfig changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { updateFields, notifyFieldsChanged } = useFieldExtensions(
    formikRef,
    idPrefix,
    [],
    mergedValidationConfig
  );
  // fields 是整个 form 结构的 single source of truth，但它是 mutable 的
  // 因为在后续的过程中会在 fields 上添加新的数据，但并不是每种添加修改都需要更新组件
  const resolvedFieldsRef = useRef<IEnhancedField[]>([]);

  resolvedFieldsRef.current = useMemo(() => {
    const fields = cloneDeep(source.fields);
    updateFields(fields);
    return fields;
  }, [updateFields, source.fields]);

  // 传入新 source 时，重置整个form
  useEffect(() => {
    formikRef.current.resetForm();
    notifyFieldsChanged(resolvedFieldsRef.current);
  }, [notifyFieldsChanged, source]);

  // console.log('resolvedFields', resolvedFieldsRef.current);

  // 根据json，动态创建组件
  return (
    <FormikProvider value={formik}>
      <form>
        {resolvedFieldsRef.current.map((field) => (
          <Field field={field} key={field.id} />
        ))}
      </form>
    </FormikProvider>
  );
};

const defaultValidationConfig: IValidationConfig = {
  validators: [
    {
      name: 'required',
      validation: (value) => {
        return value == null || (typeof value === 'string' && value === '');
      },
    },
  ],
  validationMessages: [{ name: 'required', message: 'this field is required' }],
};
