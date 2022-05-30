import React from 'react';
import { registerWidget, registerWrapper } from '../registry';
import { IField } from '../types';
import { Field, useFieldArrayControl, useFieldControl } from '..';
import './ui.css';

const Input: React.FC<any> = ({ placeholder, label, required = false, hide = false, field }) => {
  const control = useFieldControl(field);

  return (
    <div className="ui-input">
      <label htmlFor={field.id}>{`${label}${required ? '*' : ''}`}：</label>
      <input
        id={field.id}
        placeholder={placeholder as string}
        value={control?.value}
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

const TestGroup: React.FC<any> = ({ field }) => {
  const [{ group }] = field;

  return (
    <div className="ui-tset-group">
      {group.map((f: any) => (
        <div key={f.id}>
          <Field field={f} />
        </div>
      ))}
    </div>
  );
};

registerWidget('testGroup', TestGroup);

const TestArray: React.FC<any> = ({ field }) => {
  const control = useFieldArrayControl(field);

  return (
    <div>
      <ul>
        {field.group?.map((subField: any, i: any) => (
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
  field: IField;
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

registerWrapper('inputWrapper', InputWrapper);

const ArrayWrapper: React.FC<{ children?: React.ReactNode; field: IField }> = ({
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

registerWrapper('arrayWrapper', ArrayWrapper);
