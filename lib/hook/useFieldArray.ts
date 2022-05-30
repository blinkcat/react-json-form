import { useFormikContext } from 'formik';
import cloneDeep from 'lodash/cloneDeep';
import { runFieldExtensions } from '../fieldExtension';
import { IField } from '../types';

export function useFieldArray(field: IField) {
  const { getFieldMeta } = useFormikContext();

  if (field.name == null || field._keyPath == null || field.array == null) {
    return;
  }

  const { value } = getFieldMeta(field._keyPath);

  if (!Array.isArray(value)) {
    field.group = [];
    return;
  }

  if (Array.isArray(field.group) && field.group.length === value.length) {
    return;
  }

  field.group = value.map((_, index) => ({
    ...cloneDeep(field.array),
    name: `${index}`,
  }));

  runFieldExtensions([field]);
}

export function pushAField(field: IField) {
  if (!Array.isArray(field.group)) {
    field.group = [];
  }

  field.group.push({
    ...cloneDeep(field.array),
    name: `${field.group.length}`,
  });

  runFieldExtensions([field]);
}

export function popAField(field: IField) {
  if (!Array.isArray(field.group)) {
    return;
  }

  field.group.pop();
}
