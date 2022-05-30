import { useMemo } from 'react';
import { useFormikContext } from 'formik';
import { IField } from '../types';
import { IFieldPropsCalculator } from './useFieldExpressions';

export function useFieldProps(field: IField, propsFromExpressions?: IFieldPropsCalculator) {
  if (field.props == null) {
    field.props = {};
  }

  const { props } = field;
  const { values } = useFormikContext();

  return useMemo(() => {
    if (propsFromExpressions == null) {
      return props;
    }
    // yes, overide field.props
    Object.assign(
      props,
      Object.keys(propsFromExpressions).reduce((acc, key) => {
        acc[key] = propsFromExpressions[key](values);
        return acc;
      }, {} as any)
    );

    // if parent field is disabled, all chidren should be disabled.
    if (props.disabled === false) {
      let parentField = field.parent;

      while (parentField) {
        if (parentField.props?.disabled === true) {
          props.disabled = true;
          break;
        }
      }
    }

    return props;
  }, [props, propsFromExpressions, values, field]);
}
