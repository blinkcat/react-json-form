import { FormikContextType } from 'formik';
import { IFieldExtension } from '.';
import { IFieldValidation } from '../types';

export function addForm(formikRef: React.RefObject<FormikContextType<any>>): IFieldExtension {
  return {
    name: 'addReset',
    enter(field) {
      if (field.name == null || field.form != null) {
        return;
      }

      const form = {};

      Object.defineProperties(form, {
        reset: {
          value: () => {
            if (field._keyPath == null) {
              return;
            }

            const { setError, setTouched, setValue } = formikRef.current?.getFieldHelpers(
              field._keyPath
            )!;

            setValue(undefined, false);
            setTouched(false, false);
            setError(undefined);
          },
        },
        registerFieldValidator: {
          value: (name: string, validate: IFieldValidation) => {
            formikRef.current?.registerField(name, { validate });
          },
        },
        unregisterFieldValidator: {
          value: (name: string) => {
            formikRef.current?.unregisterField(name);
          },
        },
        setFieldValue: {
          value: (name: string, value: any) => {
            formikRef.current?.setFieldValue(name, value);
          },
        },
        getFieldValue: {
          value: (name: string) => {
            return formikRef.current?.getFieldMeta(name).value;
          },
        },
      });

      Object.defineProperty(field, 'form', {
        enumerable: true,
        value: form,
      });
    },
  };
}
