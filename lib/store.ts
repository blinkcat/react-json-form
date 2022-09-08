import React, { useCallback, useContext, useMemo } from 'react';
import create from 'zustand';
import { useFormik } from 'formik';
import { FieldID, IInternalField } from './types';
import { makeInternalFields } from './utils';

export { default as shallow } from 'zustand/shallow';

export interface IFormStore {
  formik: ReturnType<typeof useFormik> | null;
  setFormik(formik: ReturnType<typeof useFormik>): void;
  fields: IInternalField[];
  setFields(fields: IInternalField[]): void;
}

export const StoreContext = React.createContext<ReturnType<typeof createStore>>(null as any);

export default function createStore() {
  const cbQueueWithSetFormik: Array<() => void> = [];

  function runWhenSetFormik(cb: () => void) {
    cbQueueWithSetFormik.push(cb);
  }

  const useStore = create<IFormStore>((set) => ({
    formik: null,
    setFormik: (newFormik) => {
      set({ formik: newFormik });
      if (cbQueueWithSetFormik.length) {
        cbQueueWithSetFormik.forEach((cb) => cb());
        cbQueueWithSetFormik.length = 0;
      }
    },
    fields: [],
    setFields: (newFields) => {
      set({ fields: newFields });
    },
  }));

  return { runWhenSetFormik, useStore };
}

export function useFieldsMap() {
  const { useStore } = useContext(StoreContext);
  const fields = useStore((state) => state.fields);

  return useMemo(() => {
    const m = new Map<FieldID, IInternalField>();

    for (const field of fields) {
      m.set(field.id, field);
    }

    return m;
  }, [fields]);
}

export function useFieldGroup(field: IInternalField) {
  const fieldsMap = useFieldsMap();

  if (field.groupIds) {
    return field.groupIds.map((id) => fieldsMap.get(id)!);
  }
  return [];
}

export function useRootFields() {
  const { useStore } = useContext(StoreContext);
  return useStore((state) => state.fields.filter((field) => field.parentId === -1));
}

export function useParentField(field: IInternalField) {
  const { useStore } = useContext(StoreContext);

  return useStore((state) => {
    if (field.parentId !== -1) {
      return state.fields.find((fd) => fd.id === field.parentId);
    }
  });
}

export function useFieldArray(parentField: IInternalField) {
  const { useStore } = useContext(StoreContext);
  const setFields = useStore((state) => state.setFields);
  const fieldsMap = useFieldsMap();
  const changeKeyPath = useCallback(
    (field: IInternalField, lastInternalFieldKeyPath: string) => {
      let newKeyPath = lastInternalFieldKeyPath;

      if (field.name) {
        newKeyPath = lastInternalFieldKeyPath + '.' + field.name;
        fieldsMap.set(field.id, { ...field, keyPath: newKeyPath });
      }

      for (const id of field.groupIds || []) {
        changeKeyPath(fieldsMap.get(id)!, newKeyPath);
      }
    },
    [fieldsMap]
  );

  const add = useCallback(
    (index: number) => {
      if (parentField.array == null) {
        return;
      }

      if (index < 0 || index > parentField.groupIds!.length) {
        console.warn(`index ${index} shoud be between 0 and ${parentField.groupIds?.length}`);
        return;
      }

      for (let i = index; i < parentField.groupIds!.length; i++) {
        changeKeyPath(
          { ...fieldsMap.get(parentField.groupIds![i])!, name: `${i + 1}` },
          parentField.keyPath!
        );
      }

      const newField = makeInternalFields(
        [{ ...parentField.array, name: `${index}` }],
        undefined,
        parentField.keyPath
      )[0];

      newField.parentId = parentField.id;
      fieldsMap.set(newField.id, newField);

      const newGroupIds = [...parentField.groupIds!];

      newGroupIds.splice(index, 0, newField.id);

      const newParentField = { ...parentField, groupIds: newGroupIds };

      fieldsMap.set(newParentField.id, newParentField);

      setFields(Array.from(fieldsMap.values()));
    },
    [changeKeyPath, fieldsMap, parentField, setFields]
  );

  const remove = useCallback(
    (index: number) => {
      if (parentField.array == null) {
        return;
      }

      if (index < 0 || index > parentField.groupIds!.length) {
        console.warn(`index ${index} shoud be between 0 and ${parentField.groupIds?.length}`);
        return;
      }

      const target = fieldsMap.get(parentField.groupIds![index]);

      if (target == null) {
        console.warn(`field with id ${parentField.groupIds![index]} doesn't exist in fields!`);
        return;
      }

      function removeAll(ids?: FieldID[]) {
        if (ids == null) {
          return;
        }

        for (const id of ids) {
          removeAll(fieldsMap.get(id)?.groupIds);
          fieldsMap.delete(id);
        }
      }

      fieldsMap.delete(target.id);
      removeAll(target.groupIds);

      for (let i = index + 1; i < parentField.groupIds!.length; i++) {
        changeKeyPath(
          { ...fieldsMap.get(parentField.groupIds![i])!, name: `${i - 1}` },
          parentField.keyPath!
        );
      }

      const newGroupIds = [...parentField.groupIds!];

      newGroupIds.splice(index, 1);

      fieldsMap.set(parentField.id, { ...parentField, groupIds: newGroupIds });

      setFields(Array.from(fieldsMap.values()));
    },
    [changeKeyPath, fieldsMap, parentField, setFields]
  );

  return { add, remove };
}
