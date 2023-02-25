import React, { useCallback, useContext, useDebugValue, useEffect, useMemo, useRef } from 'react';
import { useConfig } from './Config';
import {
  IComparators,
  IConditionsProperties,
  IField,
  IInternalField,
  IValidations,
  TAccumulatedConditions,
} from './types';
import { StoreContext, useFieldGroup, shallow } from './store';
import { get } from './utils';

const FieldContext = React.createContext<IInternalField>(null as any);

export function useField() {
  return useContext(FieldContext);
}

export interface IFieldProps {
  field: IInternalField;
}

export const Field = React.memo<IFieldProps>(({ field }) => {
  const conditions = useConditions(field.conditions);
  const props = useFieldProps(field, conditions);
  const fieldStatus = useMemo(
    () => ({ disabled: props.disabled, readonly: props.readonly, required: props.required }),
    [props.disabled, props.readonly, props.required]
  );
  // field.wrapper
  const { components } = useConfig();
  const wrapperRender = useFieldWrapper(field);
  const group = useFieldGroup(field);
  const validatorsFromProps = useMemo(() => {
    if (props.required) {
      return ['required'];
    }
    return [];
  }, [props.required]);

  useFieldValidators(field, validatorsFromProps);

  const reset = useFieldReset(field);

  useEffect(() => reset, [reset]);

  useEffect(() => {
    if (conditions.hide) {
      reset();
    }
  }, [conditions.hide, reset]);

  if (conditions.hide) {
    return null;
  }

  let fieldTypeOrGroup: React.ReactNode = null;

  if (field.type) {
    if (components[field.type] == null) {
      throw Error(`can not find component ${field.type}!`);
    } else {
      fieldTypeOrGroup = React.createElement(components[field.type], { ...props });
    }
  } else if (field.group) {
    fieldTypeOrGroup = React.createElement(
      'div',
      { className: 'field-group' },
      group.map((subField) => <Field field={subField} key={subField.key} />)
    );
  }

  return (
    <FieldContext.Provider value={field}>
      <ParentFieldStatusContext.Provider value={fieldStatus}>
        {wrapperRender(fieldTypeOrGroup, props)}
      </ParentFieldStatusContext.Provider>
    </FieldContext.Provider>
  );
});

Field.displayName = 'Field';

function useFieldReset(field: IInternalField) {
  const control = useInternalFieldControl(field);
  const controlRef = useRef(control);

  useEffect(() => {
    controlRef.current = control;
  }, [control]);

  const target = useRef(field);
  const { useStore } = useContext(StoreContext);

  return useCallback(() => {
    if (
      controlRef.current == null ||
      useStore.getState().fields.some((field) => field.key === target.current.key) === false
    ) {
      return;
    }

    if (controlRef.current.value != null) {
      controlRef.current.setValue(undefined, false);
    }

    if (controlRef.current.touched != null) {
      controlRef.current.setTouched(false, false);
    }

    if (controlRef.current.error != null) {
      controlRef.current.setError(undefined);
    }
  }, [useStore]);
}

function useInternalFieldControl(field: IInternalField) {
  const { useStore } = useContext(StoreContext);
  const { getFieldHelpers, getFieldMeta } = useStore(
    (state) => ({
      getFieldHelpers: state.formik?.getFieldHelpers,
      getFieldMeta: state.formik?.getFieldMeta,
    }),
    shallow
  );

  if (field.actualName == null || getFieldMeta == null || getFieldHelpers == null) {
    return null;
  }

  const { value, touched, error } = getFieldMeta(field.actualName);
  const { setValue, setTouched, setError } = getFieldHelpers(field.actualName);

  return { value, touched, error, setValue, setTouched, setError };
}

export function useFieldControl(field?: IInternalField) {
  const currentfield = useField();
  const res = useInternalFieldControl(field || currentfield);
  useDebugValue(res);
  return res;
}

function useFieldWrapper(field: IInternalField) {
  const { components } = useConfig();

  return useCallback(
    (children: React.ReactNode, props: any) => {
      if (field.wrapper == null) {
        return children;
      }

      if (!Array.isArray(field.wrapper)) {
        console.warn(
          `field "wrapper" must be array type, and not empty. current wrapper is "${
            field.wrapper
          }", type is ${typeof field.wrapper}.`
        );

        return children;
      }

      return field.wrapper.reduce((acc, key) => {
        const Comp = components[key];

        if (Comp) {
          return React.createElement(Comp, { ...props }, acc);
        }

        return acc;
      }, children);
    },
    [field.wrapper, components]
  );
}

const ParentFieldStatusContext = React.createContext<IConditionsProperties>({
  disabled: false,
  hide: false,
  required: false,
  readonly: false,
});

function useParentFieldContext() {
  return useContext(ParentFieldStatusContext);
}

function useFieldProps(field: IInternalField, propsFromConditions?: IConditionsProperties) {
  const {
    disabled: parentDisabled,
    required: parentRequired,
    readonly: parentReadonly,
  } = useParentFieldContext();

  return useMemo(() => {
    const props = { ...field.props, ...propsFromConditions };

    props.disabled = parentDisabled || props.disabled;
    props.required = parentRequired || props.required;
    props.readonly = parentReadonly || props.readonly;

    return props;
  }, [field.props, propsFromConditions, parentDisabled, parentRequired, parentReadonly]);
}

function useFieldValidators(field: IInternalField, validatorsFromProps: string[]) {
  const { validationMessages } = useConfig();
  const validatorsFromField = field.validators;
  const oldValidatorsFromProps = useRef<string[]>([]);

  const validatorsFromPropsMemo = useMemo(() => {
    if (shallow(oldValidatorsFromProps.current, validatorsFromProps)) {
      return oldValidatorsFromProps.current;
    } else {
      oldValidatorsFromProps.current = validatorsFromProps;
      return validatorsFromProps;
    }
  }, [validatorsFromProps]);

  const validationsFromField = useValidators(validatorsFromField);
  const validationsFromProps = useValidators(validatorsFromPropsMemo);

  const needValidation = useMemo(() => {
    return (
      field.actualName != null &&
      (validationsFromField.length > 0 || validationsFromProps.length > 0)
    );
  }, [validationsFromField, validationsFromProps, field.actualName]);

  const fieldValidation = useCallback(
    (value: any) => {
      if (needValidation === false) {
        // !Don't return null
        // https://formik.org/docs/guides/validation#frequently-asked-questions
        // Can I return `null` as an error message?
        return;
      }

      const validations = [...validationsFromProps, ...validationsFromField];

      for (const validation of validations) {
        const error = validation(value, field);

        if (typeof error === 'string') {
          return validationMessages[error] || error;
        }
      }
    },
    [needValidation, validationsFromProps, validationsFromField, field, validationMessages]
  );

  const { useStore } = useContext(StoreContext);
  const { registerField, unregisterField } = useStore(
    (state) => ({
      registerField: state.formik?.registerField,
      unregisterField: state.formik?.unregisterField,
    }),
    shallow
  );

  useEffect(() => {
    if (needValidation) {
      registerField?.(field.actualName!, { validate: fieldValidation });
      return () => {
        unregisterField?.(field.actualName!);
      };
    }
  }, [needValidation, field.actualName, fieldValidation, registerField, unregisterField]);
}

function useValidators(validatorsFromSw: IInternalField['validators']) {
  const { validations } = useConfig();
  const getValidator = useCallback(
    (name: string) => {
      if (validations[name] == null) {
        console.warn(`validator '${name}' doesn't exist in config validations`);
        return null;
      }
      return validations[name];
    },
    [validations]
  );

  return useMemo(() => {
    const validators: IValidations[''][] = [];

    if (typeof validatorsFromSw === 'function') {
      validators.push(validatorsFromSw);
    } else if (typeof validatorsFromSw === 'string') {
      const validator = getValidator(validatorsFromSw);

      if (validator) {
        validators.push(validator);
      }
    } else if (Array.isArray(validatorsFromSw)) {
      for (const fieldValidator of validatorsFromSw) {
        if (typeof fieldValidator === 'string') {
          const validator = getValidator(fieldValidator);

          if (validator) {
            validators.push(validator);
          }
        } else {
          const validator = getValidator(fieldValidator[0]);

          if (validator) {
            validators.push((value, field) => validator(value, field, fieldValidator[1]));
          }
        }
      }
    }

    return validators;
  }, [validatorsFromSw, getValidator]);
}

// conditions
const Comparators = {
  equals: (fieldValue: any, targetValue: any) => {
    if (fieldValue === targetValue) {
      return true;
    }

    if (typeof fieldValue !== typeof targetValue || typeof fieldValue !== 'object') {
      return false;
    }

    const fieldKeys = Object.keys(fieldValue);
    const targetKeys = Object.keys(targetValue);

    if (fieldKeys.length !== targetKeys.length) {
      return false;
    }

    for (const key of fieldKeys) {
      if (Object.prototype.hasOwnProperty.call(fieldValue, key)) {
        if (!Comparators.equals(fieldValue[key], targetValue[key])) {
          return false;
        }
      }
    }

    return true;
  },
  contains: (fieldValue: any, targetValue: any) => {
    if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
      return fieldValue.includes(targetValue);
    }

    if (fieldValue != null && typeof fieldValue === 'object') {
      return Object.keys(fieldValue).some((key) =>
        Comparators.equals(fieldValue[key], targetValue)
      );
    }

    return false;
  },

  gt: (fieldValue: any, targetValue: any) => {
    if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
      return fieldValue > targetValue;
    }
    return false;
  },

  lt: (fieldValue: any, targetValue: any) => {
    if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
      return fieldValue < targetValue;
    }
    return false;
  },

  in: (fieldValue: any, targetValue: any) => {
    return Comparators.contains(targetValue, fieldValue);
  },
};

function useConditions(conditions: Required<IField>['conditions'] = {}): IConditionsProperties {
  const { useStore } = useContext(StoreContext);
  const values = useStore((state) => state.formik?.values || {});

  const conditionFns = useMemo(() => {
    return Object.keys(conditions).reduce((acc, key) => {
      const theCondition = (conditions as any)[key] || false;

      if (typeof theCondition === 'boolean') {
        // eslint-disable-next-line no-new-func
        acc[key] = new Function(`return Boolean(${theCondition})`);
      } else {
        // eslint-disable-next-line no-new-func
        acc[key] = new Function(
          'Comparators',
          'values',
          'get',
          `
            try{
              return ${compileCondition('AND', [theCondition])}
            }catch(e){
              console.error(e);
              return false;
            }
          `
        );
      }

      return acc;
    }, {} as any);
  }, [conditions]);

  return useMemo(() => {
    return Object.keys(conditionFns).reduce((acc, key) => {
      acc[key] = conditionFns[key](Comparators, values, get);
      return acc;
    }, {} as any);
  }, [values, conditionFns]);
}

const comparatorNames = ['equals', 'contains', 'in', 'gt', 'lt'];
const comparatorConditions = ['AND', 'OR', 'NOT'];

function compileCondition(condition: string, accumulatedConditions: TAccumulatedConditions[]) {
  const res: string[] = accumulatedConditions.map((accumulatedCondition) => {
    return (
      '(' +
      Object.keys(accumulatedCondition)
        .map((key) => {
          if (comparatorConditions.includes(key)) {
            return compileCondition(key, (accumulatedCondition as any)[key]);
          }
          return compileComparator(key, (accumulatedCondition as any)[key]);
        })
        .join('&&') +
      ')'
    );
  });

  switch (condition) {
    case 'OR':
      return `(${res.join('||')})`;
    case 'NOT':
      return `!(${res.join('&&')})`;
    default:
      return `(${res.join('&&')})`;
  }
}

function compileComparator(name: string, comparator: IComparators) {
  return Object.keys(comparator)
    .filter((key) => comparatorNames.includes(key))
    .map(
      (key) =>
        `Comparators.${key}(get(values, '${name}'), JSON.parse('${JSON.stringify(
          (comparator as any)[key]
        )}'))`
    )
    .join('&&');
}
