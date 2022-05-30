import { useMemo } from 'react';
import { useFormikContext } from 'formik';
import { IFieldHideCalculator } from './useFieldExpressions';

export function useFieldHide(hideCalculator?: IFieldHideCalculator) {
  const { values } = useFormikContext();

  return useMemo(() => {
    return hideCalculator ? hideCalculator(values) : false;
  }, [values, hideCalculator]);
}
