export interface IField {
  name?: string;
  type?: string; // 表示 widget
  wrapper?: string[]; // string 还是 string[]
  description?: string;
  // default?: any;
  props?: {
    // 虽然 json 中只有那几只类型，但是可以通过 fieldExtension 来进行扩展，添加 object、function 等
    [prop: string]: any;
  };
  expressions?: {
    [expr: string]: any;
  };
  group?: IField[];
  array?: IField;
  validators?: [
    // 从注册的 validate 函数中找到对应的函数
    | string
    // options 用于传参
    | { name: string; options: any }
    // 临时自定义 validate
    | { validator: IValidatorFn['validation']; message: string }
  ];
}

// 后端应该返回的 json
export interface IRawFields {
  version: string;
  fields: IField[];
}

export interface IEnhancedField extends IField {
  readonly id?: string;
  _hide?: boolean;
  // _expressions?: Array<(...args: any[]) => void>;
  _keyPath?: string;
  // get?(path: Required<IField>['name'] | Array<Required<IField>['name']>): IField;
  readonly parent?: IField;
  // internal use only
  readonly form?: {
    registerFieldValidator(name: string, validate: IFieldValidation): void;
    unregisterFieldValidator(name: string): void;
    setFieldValue(name: string, value: any): void;
    getFieldValue(name: string): any;
    reset: () => void;
  };
  notifyFieldsChanged?: (fields: IField | IField[]) => void;
  readonly runExpressions?: () => void;
  // readonly reset?: () => void;
  readonly validateCreator?: (va?: string[]) => IFieldValidation;
}

export interface IFieldValidation {
  (value: any): string | void | Promise<string | void>;
}

export interface IFormValues {
  [name: string]: any;
}

export interface IValidatorFn {
  name: string;
  validation: (value: any, field: IField, options?: any) => boolean | Promise<boolean>;
}

export interface IValidationMessage {
  name: string;
  message: string;
}

export interface IValidationConfig {
  validators: Array<IValidatorFn>;
  validationMessages: Array<IValidationMessage>;
}
