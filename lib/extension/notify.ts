import { IFieldExtension } from '.';
import { IField } from '../types';

export function addNotifyFieldsChanged(
  notifyFieldsChangedRef: React.MutableRefObject<(fields: IField | IField[]) => void>
): IFieldExtension {
  return {
    name: 'addMethod',
    enter(field) {
      if (field.notifyFieldsChanged != null) {
        return;
      }

      field.notifyFieldsChanged = (fields) => {
        notifyFieldsChangedRef.current(fields);
      };
    },
  };
}
