import uniqueId from 'lodash/uniqueId';
import { IField } from './types';

export interface IFieldExtension {
  name?: string;
  enter?: (field: IField, parentField?: IField) => void;
  exit?: (field: IField, parentField?: IField) => void;
}

const extensions: IFieldExtension[] = [];

export function addFieldExtensions(...exts: IFieldExtension[]) {
  extensions.push(...exts);
}

export function runFieldExtensions(fields: IField[], parentField?: IField) {
  for (const field of fields) {
    extensions.forEach((ext) => ext.enter?.(field, parentField));

    if (field.group) {
      runFieldExtensions(field.group, field);
    }

    extensions.forEach((ext) => ext.exit?.(field, parentField));
  }
}

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

export const addKeyPath: IFieldExtension = {
  name: 'addKeyPath',
  enter(field: IField, parentField?: IField) {
    if (field._keyPath != null) {
      return;
    }

    let keyPath = '';

    if (parentField?._keyPath) {
      if (field.name) {
        keyPath = `${parentField._keyPath}[${field.name}]`;
      } else {
        keyPath = parentField._keyPath;
      }
    } else {
      keyPath = field.name || '';
    }

    Object.defineProperty(field, '_keyPath', {
      value: keyPath,
    });
  },
};
