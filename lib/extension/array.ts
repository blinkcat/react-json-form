import { FormikContextType } from 'formik';
import cloneDeep from 'lodash/cloneDeep';
import { IFieldExtension } from '.';

export function resolveFieldArray(
  formikRef: React.RefObject<FormikContextType<any>>
): IFieldExtension {
  return {
    name: 'resolveFieldArray',
    enter(field) {
      if (field.array == null) {
        return;
      }

      const { value } = formikRef.current?.getFieldMeta(field._keyPath!) || {};

      if (Array.isArray(value)) {
        if (Array.isArray(field.group) && field.group.length === value.length) {
          return;
        }
        // field.group 中有几个，就会渲染几个组件
        field.group = value.map((_, index) => ({
          ...cloneDeep(field.array),
          name: `${index}`,
        }));
      } else {
        field.group = [];
      }
    },
  };
}
