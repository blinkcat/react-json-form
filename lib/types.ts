export interface IField {
  readonly id?: string;
  /**
   * @private
   */
  _keyPath?: string;
  name?: string;
  type?: string; // 表示 widget
  wrapper?: string[];
  description?: string;
  props?: {
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
