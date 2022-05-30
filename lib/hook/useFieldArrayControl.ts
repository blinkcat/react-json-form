import { getIn, setIn, useFormikContext } from 'formik';
import { IField } from '../types';
import { popAField, pushAField } from './useFieldArray';
import { IFieldControl, useFieldControl } from './useFieldControl';

export function useFieldArrayControl(
  field: IField
): (IFieldControl & { add(index?: number): void; remove(index: number): void }) | null {
  const control = useFieldControl(field);
  const { setFormikState } = useFormikContext();

  if (control == null || field.array == null) {
    return null;
  }

  const keyPath = field._keyPath!;
  // 这里多了两个方法，add 和 remove，专门用来操作数组
  function add(index?: number) {
    const values = Array.isArray(control?.value) ? control?.value! : [];

    index = index ?? values.length;

    pushAField(field);

    setFormikState((prevState) => ({
      ...prevState,
      values: setIn(
        prevState.values,
        keyPath,
        insertItem(getIn(prevState.values, keyPath), index!, getDefaultValue(field.array!))
      ),
      touched: control?.touched
        ? setIn(
            prevState.touched,
            keyPath,
            insertItem(getIn(prevState.touched, keyPath), index!, null)
          )
        : prevState.touched,
      errors: control?.error
        ? setIn(
            prevState.errors,
            keyPath,
            insertItem(getIn(prevState.errors, keyPath), index!, null)
          )
        : prevState.errors,
    }));
  }

  function remove(index: number) {
    const values = Array.isArray(control?.value) ? control?.value! : [];

    if (index < 0 || index >= values.length) {
      return;
    }

    popAField(field);

    setFormikState((prevState) => ({
      ...prevState,
      values: setIn(prevState.values, keyPath, removeItem(getIn(prevState.values, keyPath), index)),
      touched: control?.touched
        ? setIn(prevState.touched, keyPath, removeItem(getIn(prevState.touched, keyPath), index))
        : prevState.touched,
      errors: control?.error
        ? setIn(prevState.errors, keyPath, removeItem(getIn(prevState.errors, keyPath), index))
        : prevState.errors,
    }));
  }

  return { ...control, add, remove };
}

function getDefaultValue(field: IField) {
  if (field.array) {
    return [];
  }

  if (field.group) {
    return {};
  }

  return '';
}

function insertItem(array: any[] | undefined, index: number, value: any) {
  if (!array) {
    return [value];
  }

  const newArray = array.slice();

  newArray.splice(index, 0, value);

  return newArray;
}

function removeItem(array: any[], index: number) {
  const newArray = array.slice();

  newArray.splice(index, 1);

  return newArray;
}
