import { IFieldExtension } from '.';

export const addParent: IFieldExtension = {
  name: 'addParent',
  enter(field, parentField) {
    if (field.parent != null) {
      return;
    }

    Object.defineProperty(field, 'parent', {
      enumerable: true,
      value: parentField,
    });
  },
};
