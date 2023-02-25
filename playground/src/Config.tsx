import React from 'react';
import { IInternalField, useFieldControl, useField } from '../../lib';
import { IJsonFormConfig } from '../../lib/Config';

const Input: React.FC<any> = ({
  placeholder,
  label,
  required = false,
  hide = false,
  readonly = false,
  disabled = false,
}) => {
  const field = useField();
  const control = useFieldControl();

  return (
    <div className="ui-input">
      <label htmlFor={`${field.key}`}>{`${label}${required ? '*' : ''}`}：</label>
      <input
        disabled={disabled}
        readOnly={readonly}
        id={`${field.key}`}
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

const InputWrapper: React.FC<IInputWrapperProps> = ({ children }) => {
  const control = useFieldControl();

  return (
    <div className="ui-input-wrapper">
      {children}
      {control?.touched && control?.error && <p style={{ color: 'red' }}>{control?.error}</p>}
    </div>
  );
};

const Select: React.FC<any> = ({ label, options }) => {
  const control = useFieldControl();

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

const Checkbox: React.FC<{ label: string }> = ({ label }) => {
  const control = useFieldControl();
  const field = useField();

  return (
    <div>
      <input
        id={field.key}
        type="checkbox"
        checked={control?.value}
        onChange={(e) => control?.setValue(e.target.checked)}
        onBlur={() => {
          control?.setTouched(true);
        }}
      />
      <label htmlFor={field.key}>
        <span>{label}</span>
      </label>
    </div>
  );
};

const BoxWrapper: React.FC<{ children?: React.ReactNode; label?: string }> = ({
  children,
  label,
}) => {
  return (
    <div style={{ padding: 10, border: '1px solid #ccc' }}>
      <h3>{label}:</h3>
      <div>{children}</div>
    </div>
  );
};

export const config: IJsonFormConfig = {
  components: {
    input: Input,
    select: Select,
    checkbox: Checkbox,
    inputWrapper: InputWrapper,
    boxWrapper: BoxWrapper,
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
