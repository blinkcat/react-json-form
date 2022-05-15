import { FormikContextType } from 'formik';
import set from 'lodash/set';
import { IFieldExtension } from '.';
import { IEnhancedField } from '../types';

export function resolveExpressions(
  formikRef: React.RefObject<FormikContextType<any>>
): IFieldExtension {
  // 小心这里的 formikRef，在使用它的内部属性时必须直接引用
  // formikRef.current?.values  这样是对的
  // const {current:{values}}=formikRef 这样就可能出错
  // 因为 formikRef 记录的是 Form 组件中 useFormik 的返回值，这个值随时可能发生变化，并且触发组件重新渲染。
  // 因此 formikRef 是稳定的，但是 formikRef.current 是变化的。
  function getValues() {
    return formikRef.current?.values;
  }

  return {
    name: 'resolveExpressions',
    exit(field: IEnhancedField) {
      /**
       * widget c:
       *
       * {
       *  expressions: {
       *    "props.label": "values.a",
       *    "hide": "values.b"
       *  }
       * }
       */
      if (typeof field.expressions !== 'object' || field.runExpressions != null) {
        return;
      }

      const exprExecutors: Array<(...args: any[]) => void> = [];

      // 特殊处理 hide，hide 决定是否渲染组件
      if ('hide' in field.expressions) {
        exprExecutors.push(
          typeof field.expressions.hide == 'function'
            ? () => {
                (field as any)._hide = field.expressions?.hide(getValues());
              }
            : () => {
                // eslint-disable-next-line no-new-func
                new Function('field', 'values', `field._hide=Boolean(${field.expressions?.hide})`)(
                  field,
                  getValues()
                );
              }
        );
      }

      // 处理剩余的属性
      Object.keys(field.expressions)
        .filter((key) => key !== 'hide')
        .forEach((key) => {
          field.props = field.props || {};

          exprExecutors.push(
            typeof field.expressions![key] === 'function'
              ? () => {
                  set({ props: field.props }, key, field.expressions![key](getValues()));
                }
              : () => {
                  // eslint-disable-next-line no-new-func
                  new Function('props', 'values', `${key}=(${field.expressions![key]})`)(
                    field.props,
                    getValues()
                  );
                }
          );
        });

      // runExpressions 是一个函数，执行上面 exprExecutors 数组中函数
      Object.defineProperty(field, 'runExpressions', {
        enumerable: true,
        value: () => {
          for (const fn of exprExecutors) {
            try {
              fn();
            } catch (err) {
              console.error(err);
            }
          }

          // 特殊处理 disabled 属性，如果父级组件 disable ，所有子组件 disable
          if (field.props && 'disabled' in field.props && field.props.disabled === false) {
            let parentField = field.parent;

            while (parentField && parentField.props && 'disabled' in parentField.props) {
              if (parentField.props.disabled) {
                field.props.disabled = true;
                break;
              }
            }
          }
        },
      });
    },
  };
}
