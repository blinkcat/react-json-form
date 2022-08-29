import React from 'react';
import { Field, IInternalField, useFieldArrayControl, useFieldControl } from '../../lib';
import { IJsonFormConfig } from '../../lib/Config';
import { useFieldGroup } from '../../lib/useFormStore';

const Input: React.FC<any> = ({ placeholder, label, required = false, hide = false, field }) => {
  const control = useFieldControl(field);

  return (
    <div className="ui-input">
      <label htmlFor={field.id}>{`${label}${required ? '*' : ''}`}：</label>
      <input
        id={field.id}
        placeholder={placeholder as string}
        value={control?.value ?? ''}
        onChange={(e) => {
          control?.setValue(e.target.value);
        }}
        onBlur={() => {
          control?.setTouched(true);
        }}
      />
    </div>
  );
};

interface IInputWrapperProps {
  label?: string;
  children?: React.ReactNode;
  field: IInternalField;
}

const InputWrapper: React.FC<IInputWrapperProps> = ({ children, field }) => {
  const control = useFieldControl(field);

  return (
    <div className="ui-input-wrapper">
      {children}
      {control?.touched && control?.error && <p style={{ color: 'red' }}>{control?.error}</p>}
    </div>
  );
};

const ArrayWrapper: React.FC<{ children?: React.ReactNode; field: IInternalField }> = ({
  children,
  field,
}) => {
  const control = useFieldArrayControl(field);

  return (
    <div>
      <p>this is ArrayWrapper</p>
      <div>{children}</div>
      <div>
        <button
          type="button"
          onClick={() => {
            control?.add(0);
          }}
        >
          add
        </button>
      </div>
    </div>
  );
};

const ArrayComp: React.FC<{ field: IInternalField }> = ({ field }) => {
  const { add, remove } = useFieldArrayControl(field)!;
  const subFields = useFieldGroup(field);

  return (
    <div>
      <p>this is Array Component</p>
      <ul>
        {subFields.map((sf, i) => (
          <li key={sf.id}>
            <Field field={sf} />
            <button onClick={() => remove(i)}>remove</button>
            <span>{sf.id}</span>
          </li>
        ))}
      </ul>
      <div>
        <button type="button" onClick={() => add()}>
          add
        </button>
      </div>
    </div>
  );
};

const Select: React.FC<any> = ({ label, options, field }) => {
  const control = useFieldControl(field);

  return (
    <div>
      <label>
        <span>{label}</span>
        <select
          value={control?.value}
          onChange={(e) => control?.setValue(e.target.value)}
          onBlur={() => {
            control?.setTouched(true);
          }}
        >
          <option value={void 0}>choose one</option>
          {options.map((op: any) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

const Checkbox: React.FC<any> = ({ label, field }) => {
  const control = useFieldControl(field);

  return (
    <div>
      <label>
        <span>label</span>
        <input
          type="checkbox"
          checked={control?.value}
          onChange={(e) => control?.setValue(e.target.checked)}
          onBlur={() => {
            control?.setTouched(true);
          }}
        />
      </label>
    </div>
  );
};

export const config: IJsonFormConfig = {
  components: {
    input: Input,
    select: Select,
    checkbox: Checkbox,
    arrayComp: ArrayComp,
    inputWrapper: InputWrapper,
    arrayWrapper: ArrayWrapper,
  },
  validations: {
    required(value) {
      if (value == null || value === '') {
        return 'required';
      }
    },
  },
  validationMessages: { required: 'this field is required' },
};
