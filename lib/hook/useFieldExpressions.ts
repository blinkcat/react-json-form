import { useMemo } from 'react';
import { IField } from '../types';

export interface IFieldHideCalculator<V = any> {
  (values: V): boolean;
}

export interface IFieldPropsCalculator<V = any> {
  [name: string]: (values: V) => any;
}

export function useFieldExpressions(field: IField) {
  const { expressions, id } = field;

  return useMemo(() => {
    if (expressions == null) {
      return {};
    }

    let hideCalculator: IFieldHideCalculator;

    switch (typeof expressions.hide) {
      case 'string':
        // eslint-disable-next-line no-new-func
        hideCalculator = new Function('values', `return Boolean(${expressions.hide})`) as any;
        break;
      case 'function':
        hideCalculator = expressions.hide;
        break;
      default:
        hideCalculator = () => Boolean(expressions.hide);
    }

    // 处理剩余的属性
    const propsCalculator = Object.keys(expressions)
      .filter((key) => key.startsWith('props.'))
      .reduce((acc, key) => {
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
      }, {} as IFieldPropsCalculator);

    return { propsCalculator, hideCalculator };
  }, [expressions, id]);
}
