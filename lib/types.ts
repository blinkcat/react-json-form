export type FieldID = string | number;
/**
 * single form field
 */
export interface IField {
  name?: string;
  type?: string;
  wrapper?: string[];
  props?: {
    [prop: string]: any;
  };
  expressions?: {
    [expr: string]: any;
  };
  group?: IField[];
  array?: IField;
  validators?: IValidations[''] | string | (string | [string, any])[];
}

export interface IInternalField extends IField {
  id: FieldID;
  parentId: FieldID;
  keyPath?: string;
  groupIds?: FieldID[];
}

export interface IFormValues<T extends IFormValues = any> {
  [name: string]: T;
}

export interface IValidations {
  [name: string]: (
    value: any,
    field: IField,
    options?: any
  ) => string | undefined | Promise<string | undefined>;
}

export interface IValidationMessages {
  [name: string]: string;
}
