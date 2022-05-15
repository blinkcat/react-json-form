import { useCallback, useEffect, useRef, useState } from 'react';
import { FormikContextType } from 'formik';
import { addFieldExtensions, IFieldExtension, runFieldExtensions } from '../extension';
import { IField, IValidationConfig } from '../types';
import { addId } from '../extension/fieldId';
import { addParent } from '../extension/parent';
import { addNotifyFieldsChanged } from '../extension/notify';
import { addKeyPath } from '../extension/keyPath';
import { resolveFieldArray } from '../extension/array';
import { resolveExpressions } from '../extension/expressions';
import { addForm } from '../extension/form';
import { resolveValidation } from '../extension/validation';

export function useFieldExtensions(
  formikRef: React.RefObject<FormikContextType<any>>,
  idPrefix = '',
  extraExtensions: IFieldExtension[],
  validationConfig: IValidationConfig
) {
  const updateFields = useCallback((fields: IField | IField[]) => {
    runFieldExtensions(Array.isArray(fields) ? fields : [fields]);
  }, []);
  const forceUpdate = useForceUpdate();
  // 等待更新的 fields
  const fieldsChangedQueueRef = useRef<IField[]>([]);
  const notifyFieldsChanged = useCallback((fields: IField | IField[]) => {
    if (Array.isArray(fields)) {
      fieldsChangedQueueRef.current.push(...fields);
    } else {
      fieldsChangedQueueRef.current.push(fields);
    }
  }, []);
  const notifyFieldsChangedRef = useRef(notifyFieldsChanged);

  notifyFieldsChangedRef.current = notifyFieldsChanged;

  // 在 formik values 更新完成后再更新 fields 就可以了
  useEffect(() => {
    if (fieldsChangedQueueRef.current.length === 0) {
      return;
    }
    updateFields(fieldsChangedQueueRef.current);
    forceUpdate();
    fieldsChangedQueueRef.current = [];
  }, [formikRef.current?.values, updateFields, forceUpdate]);

  useOnInit(() => {
    addFieldExtensions(
      addId(idPrefix),
      addParent,
      addNotifyFieldsChanged(notifyFieldsChangedRef),
      addKeyPath,
      resolveFieldArray(formikRef),
      resolveExpressions(formikRef),
      addForm(formikRef),
      resolveValidation(validationConfig),
      ...extraExtensions
    );
  });

  return { updateFields, notifyFieldsChanged };
}

/**
 * 只在组件初始化时执行一次
 *
 * @param {() => void} callback
 */
function useOnInit(callback: () => void) {
  const isInit = useRef(true);

  if (isInit.current) {
    isInit.current = false;

    callback();
  }
}

function useForceUpdate() {
  const update = useState(0)[1];

  return useCallback(() => {
    update((c) => c + 1);
  }, [update]);
}
