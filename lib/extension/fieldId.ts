import uniqueId from 'lodash/uniqueId';
import { IFieldExtension } from '.';

export function addId(idPrefix: string): IFieldExtension {
  return {
    name: 'addId',
    enter(field) {
      if (field.id != null && field.id.startsWith(idPrefix)) {
        return;
      }

      Object.defineProperty(field, 'id', {
        enumerable: true,
        value: uniqueId(idPrefix),
      });
    },
  };
}
