import React, { useDebugValue, useEffect, useLayoutEffect, useRef } from 'react';
import { FormikConfig, useFormik } from 'formik';
import { IField, IFormValues } from './types';
import { Field } from './Field';
import createStore, { StoreContext, useRootFields } from './store';
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
  const store = useStoreOnce();
  const formik = useFormik({ initialValues, onSubmit, enableReinitialize: false });
  const initialValuesRef = useRef(initialValues);
  const preFormik = usePrevious(formik);

  useStoreView(store.useStore.getState());

  useLayoutEffect(() => {
    if (
      preFormik == null ||
      formik.values !== preFormik.values ||
      formik.errors !== preFormik.errors ||
      formik.touched !== preFormik.touched ||
      formik.isSubmitting !== preFormik.isSubmitting
    ) {
      store.useStore.getState().setFormik(formik);
    }
  }, [formik, preFormik, store]);

  useEffect(() => {
    store.useStore
      .getState()
      .setFields(
        makeInternalFields(fields, undefined, undefined, undefined, initialValuesRef.current)
      );
  }, [fields, store]);

  useEffect(() => {
    if (firstRender.current === false) {
      onValueChange?.(formik.values);
    }
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

  return (
    <StoreContext.Provider value={store}>
      <form>
        <RootFields />
      </form>
    </StoreContext.Provider>
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

function useStoreOnce() {
  const ref = useRef<ReturnType<typeof createStore>>();

  if (ref.current) {
    return ref.current;
  }

  ref.current = createStore();

  return ref.current;
}

function useStoreView(store: any) {
  useDebugValue(store);
}

function RootFields() {
  const rootFields = useRootFields();

  return (
    <>
      {rootFields.map((field) => (
        <Field key={field.id} field={field} />
      ))}
    </>
  );
}
