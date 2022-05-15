import React, { useContext, useEffect } from 'react';
import {
  FieldHelperProps,
  FieldInputProps,
  FieldMetaProps,
  getIn,
  setIn,
  useField as useFormikField,
  useFormikContext,
} from 'formik';
import { findWidget, findWrapper } from '../registry';
import { IEnhancedField } from '../types';

const FieldContext = React.createContext<Readonly<IEnhancedField>>(null as any);

FieldContext.displayName = 'FieldContext';

export interface IFieldControl<Value = any> extends FieldHelperProps<Value> {
  onChange: FieldInputProps<Value>['onChange'];
  onBlur: FieldInputProps<Value>['onBlur'];
  value: FieldMetaProps<Value>['value'];
  error: FieldMetaProps<Value>['error'];
  touched: FieldMetaProps<Value>['touched'];
}

export function useField(): [IEnhancedField, IFieldControl | null] {
  const field = useContext(FieldContext);
  // 在需要时，才创建 control 对象
  const [{ onChange, onBlur }, { value, error, touched }, { setValue, setError, setTouched }] =
    useFormikField((field as any)._keyPath);
  const control: IFieldControl = {
    onChange,
    onBlur,
    value,
    error,
    touched,
    setValue,
    setError,
    setTouched,
  };

  return [field, field.name ? control : null];
}

export function useFieldArray(): [
  IEnhancedField,
  (IFieldControl & { add(index?: number): void; remove(index: number): void }) | null
] {
  const [field, control] = useField();
  const { setFormikState } = useFormikContext();

  if (field.name == null || field.array == null) {
    return [field, null];
  }

  const keyPath = field._keyPath!;
  // 这里多了两个方法，add 和 remove，专门用来操作数组
  function add(index?: number) {
    const values = Array.isArray(control?.value) ? control?.value! : [];

    index = index ?? values.length;

    setFormikState((prevState) => ({
      ...prevState,
      values: setIn(
        prevState.values,
        keyPath,
        insertItem(getIn(prevState.values, keyPath), index!, getDefaultValue(field.array!))
      ),
      touched: control?.touched
        ? setIn(
            prevState.touched,
            keyPath,
            insertItem(getIn(prevState.touched, keyPath), index!, null)
          )
        : prevState.touched,
      errors: control?.error
        ? setIn(
            prevState.errors,
            keyPath,
            insertItem(getIn(prevState.errors, keyPath), index!, null)
          )
        : prevState.errors,
    }));

    field.notifyFieldsChanged?.(field);
  }

  function remove(index: number) {
    const values = Array.isArray(control?.value) ? control?.value! : [];

    if (index < 0 || index >= values.length) {
      return;
    }

    setFormikState((prevState) => ({
      ...prevState,
      values: setIn(prevState.values, keyPath, removeItem(getIn(prevState.values, keyPath), index)),
      touched: control?.touched
        ? setIn(prevState.touched, keyPath, removeItem(getIn(prevState.touched, keyPath), index))
        : prevState.touched,
      errors: control?.error
        ? setIn(prevState.errors, keyPath, removeItem(getIn(prevState.errors, keyPath), index))
        : prevState.errors,
    }));

    field.notifyFieldsChanged?.(field);
  }

  return [field, { ...control!, add, remove }];
}

export interface IFieldProps {
  field: IEnhancedField;
  children?: React.ReactNode;
}

// 注意 field 是 mutable 的，因此 field 的引用不会发生变化
// 一定不能将这个组件用 React.memo 包起来
export const Field: React.FC<IFieldProps> = ({ field }) => {
  field.runExpressions?.();

  const { reset } = field.form || {};

  // 如果 field 组件被销毁，需要删除 field 的信息
  useEffect(
    () => () => {
      reset?.();
    },
    [reset]
  );

  const { _keyPath, form, validateCreator, _hide } = field;
  const { required } = field.props || {};

  // 配置 field validation
  useEffect(() => {
    if (_keyPath && form && validateCreator && !_hide) {
      form.registerFieldValidator(_keyPath, validateCreator(required ? ['required'] : []));
    }

    return () => {
      if (_hide && _keyPath) {
        form?.unregisterFieldValidator(_keyPath);
      }
    };
  }, [_keyPath, form, validateCreator, _hide, required]);

  if (field._hide) {
    return <HiddenField field={field} />;
  }

  let res: JSX.Element = null as any;

  if (field.group) {
    res = <FieldGroup fields={field.group} />;
  }

  const Widget = field.type ? findWidget(field.type) : undefined;

  if (Widget) {
    // group 和 widget 是互斥的，widget 全权负责整个 field 的渲染
    res = <Widget {...field.props} />;
  }

  if (field.wrapper) {
    res = <Wrapper field={field}>{res}</Wrapper>;
  }

  if (res) {
    // 添加 context，这样能保证在每个组件中使用 useField 的时候，可以获取到正确的数据
    res = <FieldContext.Provider value={field}>{res}</FieldContext.Provider>;
  }

  return res;
};

interface IWrapperProps {
  field: IEnhancedField;
  children: React.ReactNode;
}

const Wrapper: React.FC<IWrapperProps> = ({ field, children }) => {
  if (Array.isArray(field.wrapper) && field.wrapper.length > 0) {
    return field.wrapper.reduce((acc, key) => {
      const Comp = findWrapper(key);

      if (Comp) {
        return React.createElement(Comp, { ...field.props }, acc);
      }

      return acc;
    }, <>{children}</>);
  } else {
    console.warn(
      `field "wrapper" must be array type, and not empty. current wrapper is "${
        field.wrapper
      }", type is ${typeof field.wrapper}.`
    );
  }

  return <>{children}</>;
};

interface IFieldGroupProps {
  fields: IEnhancedField[];
}

const FieldGroup: React.FC<IFieldGroupProps> = ({ fields }) => {
  return (
    <div>
      {fields.map((field) => (
        <Field key={field.id} field={field} />
      ))}
    </div>
  );
};

const HiddenField: React.FC<{ field: IEnhancedField }> = ({ field }) => {
  const { reset } = field.form || {};
  // clear hidden field value, error, touched
  useEffect(() => {
    reset?.();
  }, [reset]);
  return null;
};

function getDefaultValue(field: IEnhancedField) {
  if (field.array) {
    return [];
  }

  if (field.group) {
    return {};
  }

  return null;
}

function insertItem(array: any[] | undefined, index: number, value: any) {
  if (!array) {
    return [value];
  }

  const newArray = array.slice();

  newArray.splice(index, 0, value);

  return newArray;
}

function removeItem(array: any[], index: number) {
  const newArray = array.slice();

  newArray.splice(index, 1);

  return newArray;
}
