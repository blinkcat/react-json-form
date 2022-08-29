import React, { useCallback, useContext, useDebugValue, useEffect, useMemo, useRef } from 'react';
import { getIn, setIn } from 'formik';
import { useConfig } from './Config';
import { IField, IInternalField, IValidations } from './types';
import {
  useFormStore,
  shallow,
  useFieldGroup,
  useFieldArray,
  runWhenSetFormik,
} from './useFormStore';

export interface IFieldProps {
  field: IInternalField;
}

export const Field = React.memo<IFieldProps>(({ field }) => {
  // field.props field.expressions
  const { hide, props: propsFromExpressions } = useFieldExpressions(field);
  const props = useFieldProps(field, propsFromExpressions);
  const fieldStatus = useMemo(() => {
    return { disabled: props.disabled };
  }, [props.disabled]);
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
    if (hide) {
      reset();
    }
  }, [hide, reset]);

  if (hide) {
    return null;
  }

  let fieldTypeOrGroup: React.ReactNode = null;

  if (field.type) {
    if (components[field.type] == null) {
      throw Error(`can not find component ${field.type}!`);
    } else {
      fieldTypeOrGroup = React.createElement(components[field.type], { ...props, field });
    }
  } else if (field.groupIds) {
    fieldTypeOrGroup = React.createElement(
      'div',
      { className: 'field-group' },
      group.map((subField) => <Field field={subField} key={subField.id} />)
    );
  }

  return (
    <ParentFieldStatusContext.Provider value={fieldStatus}>
      {wrapperRender(fieldTypeOrGroup, props)}
    </ParentFieldStatusContext.Provider>
  );
});

Field.displayName = 'Field';

function useFieldReset(field: IInternalField) {
  const control = useFieldControl(field);
  const controlRef = useRef(control);

  useEffect(() => {
    controlRef.current = control;
  }, [control]);

  const target = useRef(field);

  return useCallback(() => {
    if (
      controlRef.current == null ||
      useFormStore.getState().fields.some((field) => field.id === target.current.id) === false
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
  }, []);
}

function useInternalFieldControl(field: IInternalField) {
  const { getFieldHelpers, getFieldMeta } = useFormStore(
    (state) => ({
      getFieldHelpers: state.formik?.getFieldHelpers,
      getFieldMeta: state.formik?.getFieldMeta,
    }),
    shallow
  );

  if (field.keyPath == null || getFieldMeta == null || getFieldHelpers == null) {
    return null;
  }

  const { value, touched, error } = getFieldMeta(field.keyPath);
  const { setValue, setTouched, setError } = getFieldHelpers(field.keyPath);

  return { value, touched, error, setValue, setTouched, setError };
}

export function useFieldControl(field: IInternalField) {
  const res = useInternalFieldControl(field);
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
          return React.createElement(Comp, { ...props, field }, acc);
        }

        return acc;
      }, children);
    },
    [field, components]
  );
}

const ParentFieldStatusContext = React.createContext<{ disabled: boolean }>({ disabled: false });

function useParentFieldContext() {
  return useContext(ParentFieldStatusContext);
}

function useFieldProps(field: IInternalField, propsFromExpressions?: any) {
  const { disabled: parentDisabled } = useParentFieldContext();

  return useMemo(() => {
    const props = { ...field.props, ...propsFromExpressions };

    if (parentDisabled === true) {
      props.disabled = true;
    }

    return props;
  }, [field.props, propsFromExpressions, parentDisabled]);
}

function useFieldExpressions(field: IInternalField) {
  const { expressions, id } = field;
  const values = useFormStore((state) => state.formik?.values || {});

  const { hideExpression, propsExpressions } = useMemo(() => {
    if (expressions == null || typeof expressions !== 'object') {
      return {};
    }

    let hideExpression: (values: any) => boolean;

    switch (typeof expressions.hide) {
      case 'string':
        // eslint-disable-next-line no-new-func
        hideExpression = new Function('values', `return Boolean(${expressions.hide})`) as any;
        break;
      case 'function':
        hideExpression = expressions.hide;
        break;
      default:
        hideExpression = () => Boolean(expressions.hide);
    }

    const propsExpressions: { [name: string]: (values: any) => any } = Object.keys(expressions)
      .filter((key) => key.startsWith('props.'))
      .reduce((acc: any, key) => {
        const keyWithoutPrefix = key.slice(6);

        switch (typeof expressions[key]) {
          case 'function':
            acc[keyWithoutPrefix] = expressions[key];
            break;
          case 'string':
            // eslint-disable-next-line no-new-func
            acc[keyWithoutPrefix] = new Function('values', `return ${expressions[key]}`) as any;
            break;
          default:
            throw Error(
              `type error in field with id ${id}:
              field.expressions['${key}'] must be function or string type, now it's ${key} with type ${typeof key}.`
            );
        }
        return acc;
      }, {});

    return { hideExpression, propsExpressions };
  }, [expressions, id]);

  const hide = useMemo(() => {
    if (hideExpression) {
      return hideExpression(values);
    }

    return false;
  }, [hideExpression, values]);

  const props = useMemo(() => {
    if (propsExpressions) {
      return Object.keys(propsExpressions).reduce((acc: any, key) => {
        acc[key] = propsExpressions[key](values);

        return acc;
      }, {});
    }

    return {};
  }, [propsExpressions, values]);

  return { hide, props };
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
      field.keyPath != null && (validationsFromField.length > 0 || validationsFromProps.length > 0)
    );
  }, [validationsFromField, validationsFromProps, field.keyPath]);

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

  const { registerField, unregisterField } = useFormStore(
    (state) => ({
      registerField: state.formik?.registerField,
      unregisterField: state.formik?.unregisterField,
    }),
    shallow
  );

  useEffect(() => {
    if (needValidation) {
      registerField?.(field.keyPath!, { validate: fieldValidation });
      return () => {
        unregisterField?.(field.keyPath!);
      };
    }
  }, [needValidation, field.keyPath, fieldValidation, registerField, unregisterField]);
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

export function useFieldArrayControl(field: IInternalField) {
  const control = useInternalFieldControl(field);
  const setFormikState = useFormStore((state) => state.formik?.setFormikState);
  const { add: addField, remove: removeField } = useFieldArray(field);

  const hasControl = useMemo(() => {
    if (control == null || field.array == null || setFormikState == null) {
      return false;
    }
    return true;
  }, [control, field.array, setFormikState]);
  const valueInControl = control?.value;
  const touchedInControl = control?.touched;
  const errorInControl = control?.error;

  const addAndRemove = useMemo(() => {
    if (!hasControl) {
      return null;
    }

    function add(index?: number) {
      const value = Array.isArray(valueInControl) ? valueInControl : [];
      const i = index ?? value.length;

      runWhenSetFormik(() => addField(i));

      setFormikState!((prevState) => ({
        ...prevState,
        values: setIn(
          prevState.values,
          field.keyPath!,
          arrayInsert(getIn(prevState.values, field.keyPath!), i, getDefaultValue(field.array!))
        ),
        touched: touchedInControl
          ? setIn(
              prevState.touched,
              field.keyPath!,
              arrayInsert(getIn(prevState.touched, field.keyPath!), i, null)
            )
          : prevState.touched,
        errors: errorInControl
          ? setIn(
              prevState.errors,
              field.keyPath!,
              arrayInsert(getIn(prevState.errors, field.keyPath!), i, null)
            )
          : prevState.errors,
      }));
    }

    function remove(index: number) {
      const value = Array.isArray(valueInControl) ? valueInControl : [];

      if (index < 0 || index >= value.length) {
        return;
      }

      runWhenSetFormik(() => removeField(index));

      setFormikState!((prevState) => ({
        ...prevState,
        values: setIn(
          prevState.values,
          field.keyPath!,
          arrayDelete(getIn(prevState.values, field.keyPath!), index)
        ),
        touched: touchedInControl
          ? setIn(
              prevState.touched,
              field.keyPath!,
              arrayDelete(getIn(prevState.touched, field.keyPath!), index)
            )
          : prevState.touched,
        errors: errorInControl
          ? setIn(
              prevState.errors,
              field.keyPath!,
              arrayDelete(getIn(prevState.errors, field.keyPath!), index)
            )
          : prevState.errors,
      }));
    }

    return { add, remove };
  }, [
    hasControl,
    addField,
    removeField,
    setFormikState,
    field.keyPath,
    field.array,
    valueInControl,
    touchedInControl,
    errorInControl,
  ]);

  if (addAndRemove) {
    return { ...control, ...addAndRemove };
  }

  return null;
}

function getDefaultValue(field: IField) {
  if (field.array) {
    return [];
  }

  if (field.group) {
    return {};
  }

  return '';
}

function arrayInsert(array: any[] | undefined, index: number, value: any) {
  if (array == null) {
    return [value];
  }

  const newArray = array.slice();

  newArray.splice(index, 0, value);

  return newArray;
}

function arrayDelete(array: any[], index: number) {
  const newArray = array.slice();

  newArray.splice(index, 1);

  return newArray;
}
