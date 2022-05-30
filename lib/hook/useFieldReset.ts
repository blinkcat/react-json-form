import { useCallback, useMemo } from 'react';
import { useFormikContext } from 'formik';
import { IField } from '../types';

export function useFieldReset(field: IField) {
  const { getFieldHelpers } = useFormikContext();
  const { setError, setTouched, setValue } = useMemo<
    Partial<ReturnType<typeof getFieldHelpers>>
  >(() => {
    if (field._keyPath == null) {
      return {};
    }
    return getFieldHelpers(field._keyPath!);
  }, [getFieldHelpers, field._keyPath]);

  return useCallback(() => {
    setValue?.(undefined, false);
    setTouched?.(false, false);
    setError?.(undefined);
  }, [setError, setTouched, setValue]);
}
