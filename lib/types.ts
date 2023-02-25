export interface IComparators {
  equals?: any;
  contains?: any;
  in?: Record<any, any> | Array<any>;
  gt?: number;
  lt?: number;
}

export interface IConditions {
  [name: string]: IComparators;
}

export type TAccumulatedConditions =
  | IConditions
  | {
      AND?: TAccumulatedConditions[];
      OR?: TAccumulatedConditions[];
      NOT?: TAccumulatedConditions[];
    };

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
  conditions?: {
    hide?: TAccumulatedConditions | boolean;
    disabled?: TAccumulatedConditions | boolean;
    required?: TAccumulatedConditions | boolean;
    readonly?: TAccumulatedConditions | boolean;
  };
  group?: IField[];
  validators?: IValidations[''] | string | (string | [string, any])[];
}

export interface IConditionsProperties {
  hide?: boolean;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
}

export interface IInternalField extends IField {
  parentKey: string;
  key: string;
  actualName?: string;
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
