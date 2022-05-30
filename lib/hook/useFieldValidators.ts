import { useFormikContext } from 'formik';
import { useCallback, useEffect, useMemo } from 'react';
import {
  IField,
  IFieldValidation,
  IValidationConfig,
  IValidationMessage,
  IValidatorFn,
} from '../types';

function useValidationConfig() {
  const validationConfig: IValidationConfig = {
    validators: [
      {
        name: 'required',
        validation: (value) => {
          return value == null || (typeof value === 'string' && value === '');
        },
      },
    ],
    validationMessages: [{ name: 'required', message: 'this field is required' }],
  };
  const validators = new Map<IValidatorFn['name'], IValidatorFn['validation']>();
  const validationMessages = new Map<IValidationMessage['name'], IValidationMessage['message']>();

  validationConfig.validators.forEach((va) => validators.set(va.name, va.validation));
  validationConfig.validationMessages.forEach((vm) => validationMessages.set(vm.name, vm.message));

  return { validators, validationMessages };
}

export function useFieldValidators(field: IField) {
  const { validators, validationMessages } = useValidationConfig();
  const { validators: fieldValidators } = field;
  const { required } = field.props || {};

  const validations = useMemo(
    () => collectValidations(field, fieldValidators, validators, validationMessages),
    [validators, validationMessages, fieldValidators, field]
  );

  const validationsFromProps = useMemo(
    () =>
      collectValidationsFromProps(
        field,
        required ? ['required'] : [],
        validators,
        validationMessages
      ),
    [validators, validationMessages, field, required]
  );

  const needValidation = useMemo(() => {
    return validations.length !== 0 || validationsFromProps.length !== 0;
  }, [validations, validationsFromProps]);

  const fieldValidation = useCallback(
    async (value: any) => {
      for (const validation of validationsFromProps) {
        const me = await validation(value);

        if (me) {
          return me;
        }
      }

      for (const validation of validations) {
        const me = await validation(value);

        if (me) {
          return me;
        }
      }
    },
    [validations, validationsFromProps]
  );

  const { registerField, unregisterField } = useFormikContext();

  useEffect(() => {
    if (needValidation) {
      registerField(field._keyPath!, { validate: fieldValidation });
    }

    return () => {
      unregisterField(field._keyPath!);
    };
    // registerField, unregisterField won't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field, fieldValidation, needValidation]);
}

function collectValidations(
  field: IField,
  fieldValidators: IField['validators'],
  validators: Map<IValidatorFn['name'], IValidatorFn['validation']>,
  validationMessages: Map<IValidationMessage['name'], IValidationMessage['message']>
) {
  const validations: IFieldValidation[] = [];

  if (!Array.isArray(fieldValidators)) {
    return validations;
  }

  for (let i = 0; i < fieldValidators.length; i++) {
    const validator = fieldValidators[i];
    let name: string = '';
    let validation: IValidatorFn['validation'];
    let message: string;
    let options: any;

    if (typeof validator === 'string') {
      name = validator;
    } else if ('name' in validator) {
      name = validator.name;
      options = validator.options;
    } else {
      validation = validator.validator;
      message = validator.message;
    }

    if (name) {
      if (!validators.has(name)) {
        console.warn(`validator '${name}' doesn't exist in validationConfig.validators`);
        continue;
      }

      validation = validators.get(name)!;

      if (!validationMessages.has(name)) {
        console.warn(
          `validation message '${name}' does't exist in validationConfig.validationMessages`
        );
        continue;
      }

      message = validationMessages.get(name)!;
    }

    validations.push((value: any) => {
      if (validation(value, field, options)) {
        return message;
      }
    });
  }

  return validations;
}

function collectValidationsFromProps(
  field: IField,
  validatorsFromProps: string[],
  validators: Map<IValidatorFn['name'], IValidatorFn['validation']>,
  validationMessages: Map<IValidationMessage['name'], IValidationMessage['message']>
) {
  const validations: IFieldValidation[] = [];

  if (validatorsFromProps.length === 0) {
    return validations;
  }

  for (const va of validatorsFromProps) {
    const name = va;

    if (!validators.has(va)) {
      console.warn(`validator '${name}' doesn't exist in validationConfig.validators`);
      continue;
    }

    const validation = validators.get(name)!;

    if (!validationMessages.has(name)) {
      console.warn(
        `validation message '${name}' does't exist in validationConfig.validationMessages`
      );
      continue;
    }

    const message = validationMessages.get(name)!;

    validations.push((value: any) => {
      if (validation(value, field)) {
        return message;
      }
    });
  }

  return validations;
}
