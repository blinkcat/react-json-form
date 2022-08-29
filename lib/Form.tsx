import React, { useDebugValue, useEffect, useLayoutEffect, useRef } from 'react';
import { FormikConfig, useFormik } from 'formik';
import { IField, IFormValues } from './types';
import { Field } from './Field';
import { useFormStore, useRootFields } from './useFormStore';
import { makeInternalFields } from './utils';

export interface IJsonFormProps<V extends IFormValues = IFormValues> {
  fields: IField[];
  onSubmit?: FormikConfig<V>['onSubmit'];
  initialValues?: V;
  onValueChange?: (values: V) => void;
}

export const JsonForm: React.FC<IJsonFormProps> = ({
  initialValues = {},
  fields,
  onSubmit = () => {},
  onValueChange,
}) => {
  const formik = useFormik({ initialValues, onSubmit });
  const preFormik = usePrevious(formik);

  useLayoutEffect(() => {
    if (
      preFormik == null ||
      formik.values !== preFormik.values ||
      formik.errors !== preFormik.errors ||
      formik.touched !== preFormik.touched ||
      formik.isSubmitting !== preFormik.isSubmitting
    ) {
      useFormStore.getState().setFormik(formik);
    }
  }, [formik, preFormik]);

  useEffect(() => {
    useFormStore.getState().setFields(makeInternalFields(fields));
  }, [fields]);

  useEffect(() => {
    onValueChange?.(formik.values);
  }, [onValueChange, formik.values]);

  const { resetForm } = formik;

  useEffect(() => {
    if (firstRender.current === false) {
      resetForm();
    }
  }, [fields, resetForm]);

  const firstRender = useRef(true);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  useFormStateView();

  const rootFields = useRootFields();

  return (
    <form>
      {rootFields.map((field) => (
        <Field key={field.id} field={field} />
      ))}
    </form>
  );
};

JsonForm.defaultProps = {
  initialValues: {},
  onSubmit() {},
};

function usePrevious<T>(value: T) {
  const valueRef = useRef<T>();

  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  return valueRef.current;
}

function useFormStateView() {
  useDebugValue(useFormStore.getState());
}
