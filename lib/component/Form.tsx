import React, { useEffect, useRef } from 'react';
import { useFormik, FormikProvider } from 'formik';
import cloneDeep from 'lodash/cloneDeep';
import { IField, IFormValues, IRawFields } from '../types';
import { Field } from './Field';
import {
  addFieldExtensions,
  runFieldExtensions,
  addId,
  addParent,
  addKeyPath,
} from '../fieldExtension';
import './ui';

export interface IJsonFormProps<Values = any> {
  source: IRawFields;
  onChange?(values: Values): void;
  initialValues?: Values;
  idPrefix?: string;
}

export const JsonForm = <Values extends IFormValues = any>({
  source,
  onChange,
  initialValues = {} as any,
  idPrefix = 'react-json-form-',
}: IJsonFormProps<Values>) => {
  // 创建form的state
  const formik = useFormik({
    initialValues,
    onSubmit() {},
  });

  useEffect(() => {
    onChange?.(formik.values);
  }, [formik.values, onChange]);

  useOnInit(() => {
    addFieldExtensions(addId(idPrefix), addParent, addKeyPath);
  });

  const resolvedFieldsRef = useRef<IField[]>([]);
  const { resetForm } = formik;

  // 传入新 source 时，重置整个form
  useEffect(() => {
    resolvedFieldsRef.current = cloneDeep(source.fields);
    runFieldExtensions(resolvedFieldsRef.current);
    resetForm();
  }, [resetForm, source.fields]);

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

function useOnInit(callback: () => void) {
  const isInit = useRef(true);

  if (isInit.current) {
    isInit.current = false;

    callback();
  }
}
