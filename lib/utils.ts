import { IField, IInternalField } from './types';

let globalFieldId = 0;

function getUniqueId() {
  return globalFieldId++;
}

function makeAnInternalField(
  field: IField,
  parentInternalField?: IInternalField,
  lastInternalFieldKeyPath?: string
): IInternalField {
  const internalField: IInternalField = {
    ...field,
    parentId: -1,
    keyPath: '',
    id: getUniqueId(),
  };

  if (field.group || field.array) {
    internalField.groupIds = [];
  }

  if (parentInternalField) {
    internalField.parentId = parentInternalField.id;
    parentInternalField.groupIds?.push(internalField.id);
  }

  if (internalField.name) {
    internalField.keyPath = internalField.name;

    if (lastInternalFieldKeyPath) {
      internalField.keyPath = lastInternalFieldKeyPath + '.' + internalField.keyPath;
    }
  }

  return internalField;
}

export function makeInternalFields(
  fields: IField[],
  parentInternalField?: IInternalField,
  lastInternalFieldKeyPath?: string,
  res: IInternalField[] = []
): IInternalField[] {
  for (const field of fields) {
    const internalField = makeAnInternalField(field, parentInternalField, lastInternalFieldKeyPath);

    if (field.group) {
      makeInternalFields(
        field.group,
        internalField,
        internalField.keyPath || lastInternalFieldKeyPath,
        res
      );
    }

    res.push(internalField);
  }

  return res;
}
