import { IFieldExtension } from '.';
import { IEnhancedField } from '../types';

export const addKeyPath: IFieldExtension = {
  name: 'addKeyPath',
  enter(field: IEnhancedField, parentField?: IEnhancedField) {
    if (field.name == null || field._keyPath != null) {
      return;
    }

    Object.defineProperty(field, '_keyPath', {
      value: parentField?._keyPath ? `${parentField._keyPath}[${field.name}]` : field.name,
    });
  },
};
