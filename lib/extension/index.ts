import { IEnhancedField } from '../types';

export interface IFieldExtension {
  name?: string;
  enter?: (field: IEnhancedField, parentField?: IEnhancedField) => void;
  exit?: (field: IEnhancedField, parentField?: IEnhancedField) => void;
}

const extensions: IFieldExtension[] = [];

export function addFieldExtensions(...exts: IFieldExtension[]) {
  extensions.push(...exts);
}

export function runFieldExtensions(fields: IEnhancedField[], parentField?: IEnhancedField) {
  for (const field of fields) {
    extensions.forEach((ext) => ext.enter?.(field, parentField));

    if (field.group) {
      runFieldExtensions(field.group, field);
    }

    extensions.forEach((ext) => ext.exit?.(field, parentField));
  }
}
