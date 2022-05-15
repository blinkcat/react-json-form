import React from 'react';
import { registerWidget, registerWrapper } from '../registry';
import { useField, Field, useFieldArray } from './Field';
import './ui.css';

const Input: React.FC<any> = ({ placeholder, label, required = false, hide = false }) => {
  const [field, control] = useField();

  if (hide) {
    return null;
  }

  return (
    <div className="ui-input">
      <label htmlFor={field.id}>{`${label}${required ? '*' : ''}`}：</label>
      <input
        id={field.id}
        placeholder={placeholder as string}
        value={control?.value || ''}
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

registerWidget('input', Input);

const TestGroup: React.FC<any> = () => {
  const [{ group }] = useField();

  return (
    <div className="ui-tset-group">
      {group?.map((field, i) => (
        <div key={i}>
          <Field field={field} />
        </div>
      ))}
    </div>
  );
};

registerWidget('testGroup', TestGroup);

const TestArray: React.FC<any> = () => {
  const [field, control] = useFieldArray();

  return (
    <div>
      <ul>
        {field.group?.map((subField, i) => (
          <li key={subField.id}>
            <Field field={subField} />
            <button type="button" onClick={() => control?.remove(i)}>
              remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => control?.add()}>
        add
      </button>
    </div>
  );
};

registerWidget('testArray', TestArray);

interface IInputWrapperProps {
  label?: string;
  children?: React.ReactNode;
}

const InputWrapper: React.FC<IInputWrapperProps> = ({ children }) => {
  const control = useField()[1];

  return (
    <div className="ui-input-wrapper">
      {children}
      {control?.touched && control?.error && <p style={{ color: 'red' }}>{control?.error}</p>}
    </div>
  );
};

registerWrapper('inputWrapper', InputWrapper);

const ArrayWrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [_, control] = useFieldArray();

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

registerWrapper('arrayWrapper', ArrayWrapper);
