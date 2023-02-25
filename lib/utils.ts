import { IField, IInternalField } from './types';

// convert IField to IInternalField
export function convert2InternalFields(
  fields: IField[],
  parentKey = '',
  parentActualName = '',
  res: IInternalField[] = []
) {
  for (let i = 0; i < fields.length; i++) {
    const iField: IInternalField = {
      ...fields[i],
      parentKey,
      key: '',
    };

    iField.key = `${parentKey ? parentKey + '_' : ''}${iField.name || i}`;
    iField.actualName =
      iField.name && parentActualName ? parentActualName + '.' + iField.name : iField.name;

    res.push(iField);

    if (fields[i].group) {
      convert2InternalFields(
        fields[i].group!,
        iField.key,
        iField.actualName || parentActualName,
        res
      );
    }
  }

  return res;
}

export function get(obj: any, path: string) {
  if (path.includes('.')) {
    const paths = path.split('.');
    let target = obj;

    for (let i = 0; i < paths.length; i++) {
      target = target[paths[i]];

      if (target == null) {
        return target;
      }
    }

    return target;
  }

  return obj[path];
}
