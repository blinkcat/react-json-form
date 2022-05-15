import { IFieldExtension } from '.';
import {
  IField,
  IFieldValidation,
  IValidationConfig,
  IValidationMessage,
  IValidatorFn,
} from '../types';

export function resolveValidation(validationConfig: IValidationConfig): IFieldExtension {
  const validators = new Map<IValidatorFn['name'], IValidatorFn['validation']>();

  validationConfig.validators.forEach((va) => validators.set(va.name, va.validation));

  const validationMessages = new Map<IValidationMessage['name'], IValidationMessage['message']>();

  validationConfig.validationMessages.forEach((vm) => validationMessages.set(vm.name, vm.message));

  function collectValidations(field: IField) {
    const validations: IFieldValidation[] = [];

    if (!Array.isArray(field.validators)) {
      return validations;
    }

    for (let i = 0; i < field.validators.length; i++) {
      const validator = field.validators[i];
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

  function collectValidationsFromProps(field: IField, validatorsFromProps: string[]) {
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

  return {
    name: 'validation',
    exit(field) {
      if (field.name == null || !Array.isArray(field.validators) || field.validateCreator != null) {
        return;
      }

      const validations = collectValidations(field);

      const validateCreator = (validatorsFromProps: string[] = []) => {
        const validationsFromProps = collectValidationsFromProps(field, validatorsFromProps);

        return async (value: any) => {
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
        };
      };

      Object.defineProperty(field, 'validateCreator', {
        configurable: true,
        value: validateCreator,
      });
    },
  };
}
