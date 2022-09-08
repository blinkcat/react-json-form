import React, { useEffect } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import JsonForm, {
  Field,
  IJsonFormConfig,
  JsonFormConfig,
  useConfig,
  useField,
  useFieldArrayControl,
  useFieldControl,
  useFieldGroup,
} from '../lib';

const Input: React.FC = () => <input type="text" data-testid="i" />;

test('"type" property should work well', () => {
  const { queryByTestId } = render(
    <JsonFormConfig value={{ components: { input: Input } }}>
      <JsonForm
        fields={[
          {
            type: 'input',
          },
        ]}
      />
    </JsonFormConfig>
  );

  expect(queryByTestId('i')).toBeInTheDocument();
});

const W1: React.FC<any> = ({ children }) => <div data-testid="w1">{children}</div>;
const W2: React.FC<any> = ({ children }) => <div data-testid="w2">{children}</div>;

test('"wrapper" property should work well', () => {
  const { queryByTestId } = render(
    <JsonFormConfig value={{ components: { w1: W1, w2: W2 } }}>
      <JsonForm
        fields={[
          {
            wrapper: ['w1', 'w2'],
          },
        ]}
      />
    </JsonFormConfig>
  );

  expect(queryByTestId('w2')).toContainElement(queryByTestId('w1'));
});

test('"type" and "wrapper" should work well together', () => {
  const { queryByTestId } = render(
    <JsonFormConfig value={{ components: { w1: W1, w2: W2, input: Input } }}>
      <JsonForm
        fields={[
          {
            wrapper: ['w1', 'w2'],
            type: 'input',
          },
        ]}
      />
    </JsonFormConfig>
  );

  expect(queryByTestId('w2')).toContainElement(queryByTestId('w1'));
  expect(queryByTestId('w1')).toContainElement(queryByTestId('i'));
});

test('"name" property should work well', async () => {
  const Input: React.FC = () => {
    const { value = '', setValue } = useFieldControl()!;

    return (
      <input type="text" data-testid="i" value={value} onChange={(e) => setValue(e.target.value)} />
    );
  };
  const handleChange = jest.fn();
  const { queryByTestId, getByTestId } = render(
    <JsonFormConfig value={{ components: { input: Input } }}>
      <JsonForm
        onValueChange={handleChange}
        fields={[
          {
            name: 'a',
            type: 'input',
          },
        ]}
      />
    </JsonFormConfig>
  );

  expect(queryByTestId('i')).toBeInTheDocument();

  // https://github.com/jaredpalmer/formik/issues/1543#issuecomment-547501926
  await act(async () => {
    fireEvent.change(getByTestId('i'), {
      target: { value: 'test name' },
    });
  });

  expect(handleChange).toBeCalledWith({ a: 'test name' });
});

test('"group" property should work well', async () => {
  const Input1: React.FC = () => {
    const { value = '', setValue } = useFieldControl()!;

    return (
      <input
        type="text"
        data-testid="i-1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  };
  const Input2: React.FC = () => {
    const { value = '', setValue } = useFieldControl()!;

    return (
      <input
        type="text"
        data-testid="i-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  };
  const handleChange = jest.fn();
  const { queryByTestId, getByTestId } = render(
    <JsonFormConfig value={{ components: { input1: Input1, input2: Input2, w1: W1 } }}>
      <JsonForm
        onValueChange={handleChange}
        fields={[
          {
            name: 'a',
            wrapper: ['w1'],
            group: [
              {
                name: 'b',
                type: 'input1',
              },
              {
                name: 'c',
                type: 'input2',
              },
            ],
          },
        ]}
      />
    </JsonFormConfig>
  );

  expect(queryByTestId('w1')).toContainElement(queryByTestId('i-1'));
  expect(queryByTestId('w1')).toContainElement(queryByTestId('i-2'));

  await act(async () => {
    fireEvent.change(getByTestId('i-1'), {
      target: { value: 1 },
    });
  });

  expect(handleChange.mock.calls[0][0]).toEqual({ a: { b: '1' } });

  await act(async () => {
    fireEvent.change(getByTestId('i-2'), {
      target: { value: 2 },
    });
  });

  expect(handleChange.mock.calls[1][0]).toEqual({ a: { b: '1', c: '2' } });
});

const CommonInput: React.FC = () => {
  const { value, setValue } = useFieldControl()!;

  return <input type="text" value={value || ''} onChange={(e) => setValue(e.target.value)} />;
};

test('"array" property should work well', async () => {
  const handleChange = jest.fn();
  const { container, queryByDisplayValue, getByDisplayValue } = render(
    <JsonFormConfig value={{ components: { input: CommonInput } }}>
      <JsonForm
        initialValues={{ a: ['1', '2', '3', '4'] }}
        onValueChange={handleChange}
        fields={[
          {
            name: 'a',
            array: {
              type: 'input',
            },
          },
        ]}
      />
    </JsonFormConfig>
  );

  expect(container.querySelectorAll('input').length).toBe(4);
  expect(queryByDisplayValue('2')).toBeInTheDocument();

  await act(async () => {
    fireEvent.change(getByDisplayValue('2'), { target: { value: '5' } });
  });

  expect(handleChange.mock.calls[0][0]).toEqual({ a: ['1', '5', '3', '4'] });
});

test('"array" property should also work well on complex data', async () => {
  const handleChange = jest.fn();
  const { container, queryByDisplayValue, getByDisplayValue } = render(
    <JsonFormConfig value={{ components: { input: CommonInput } }}>
      <JsonForm
        initialValues={{
          a: [
            { b: '1', c: '2' },
            { b: '2', c: '3' },
          ],
        }}
        onValueChange={handleChange}
        fields={[
          {
            name: 'a',
            array: {
              group: [
                { name: 'b', type: 'input' },
                { name: 'c', type: 'input' },
              ],
            },
          },
        ]}
      />
    </JsonFormConfig>
  );

  expect(container.querySelectorAll('input').length).toBe(4);
  expect(queryByDisplayValue('3')).toBeInTheDocument();

  await act(async () => {
    fireEvent.change(getByDisplayValue('3'), { target: { value: '4' } });
  });

  expect(handleChange.mock.calls[0][0]).toEqual({
    a: [
      { b: '1', c: '2' },
      { b: '2', c: '4' },
    ],
  });
});

test('"props" property should work well', () => {
  const Comp: React.FC<any> = (props) => {
    expect(props).toEqual(fieldProps);
    return <></>;
  };
  const Wrap: React.FC<any> = (props) => {
    const { children, ...restProps } = props;

    expect(restProps).toEqual(fieldProps);
    return <>{children}</>;
  };
  const fieldProps = { a: 1, b: 'string', c: false, d: [1, 2, 3], e: { a: 1, b: 'sss' } };

  render(
    <JsonFormConfig value={{ components: { c: Comp, w: Wrap } }}>
      <JsonForm
        fields={[
          {
            wrapper: ['w'],
            name: 'a',
            type: 'c',
            props: fieldProps,
          },
        ]}
      />
    </JsonFormConfig>
  );
});

test('"expressions" property should work well', async () => {
  const Input: React.FC = () => {
    const field = useField();
    const { value, setValue } = useFieldControl()!;

    return (
      <input
        type="text"
        data-testid={field.name}
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  };

  const SInput: React.FC<any> = (props) => {
    const { value, setValue } = useFieldControl()!;
    const field = useField();

    useEffect(() => {
      if (value !== props.value) {
        setValue(props.value);
      }
    }, [props.value, setValue, value]);

    return (
      <input
        type="text"
        data-testid={field.name}
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  };

  const { queryByTestId, getByTestId } = render(
    <JsonFormConfig value={{ components: { input: Input, sinput: SInput } }}>
      <JsonForm
        initialValues={{ a: '' }}
        fields={[
          {
            name: 'a',
            type: 'input',
          },
          {
            name: 'b',
            type: 'input',
            expressions: {
              hide: 'values.a==""',
            },
          },
          {
            name: 'c',
            type: 'sinput',
            expressions: {
              'props.value': 'values.a',
            },
          },
        ]}
      />
    </JsonFormConfig>
  );

  expect(queryByTestId('b')).toBeNull();

  await act(async () => {
    fireEvent.change(getByTestId('a'), { target: { value: 'something' } });
  });

  expect(queryByTestId('b')).toBeInTheDocument();
  expect((getByTestId('c') as any).value).toBe('something');
});

test('"validators" property should work well', async () => {
  const Input: React.FC = () => {
    const { value, setValue, setTouched, touched, error } = useFieldControl()!;
    return (
      <div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setTouched(true)}
          data-testid="i"
        />
        {touched && error ? <div>{error}</div> : null}
      </div>
    );
  };

  const fn1 = jest.fn();
  const fn2 = jest.fn();

  const config: Partial<IJsonFormConfig> = {
    components: { input: Input },
    validationMessages: {
      required: 'please input something',
      lengthLimit: 'too long',
      notBob: 'should not be "bob"',
    },
    validations: {
      required(value) {
        fn1(value);
        if (value == null || value === '') {
          return 'required';
        }
      },
      check(value, _, options) {
        fn2(value, _, options);
        if (typeof value === 'string' && value.length > 0) {
          if (value === 'bob') {
            return 'notBob';
          }
          if (options && options.limit != null && value.length > options.limit) {
            return 'lengthLimit';
          }
        }
      },
    },
  };

  const { queryByTestId, getByTestId, getByText } = render(
    <JsonFormConfig value={config}>
      <JsonForm
        fields={[
          {
            name: 'a',
            type: 'input',
            props: {
              required: true,
            },
            validators: [['check', { limit: 10 }]],
          },
        ]}
      />
    </JsonFormConfig>
  );

  expect(queryByTestId('i')).toBeInTheDocument();

  const target = getByTestId('i');

  fireEvent.focus(target);
  fireEvent.blur(target);

  expect(fn1).toBeCalled();

  await waitFor(() => {
    expect(getByText(config.validationMessages!.required)).toBeInTheDocument();
  });

  fireEvent.change(target, { target: { value: 'bob' } });
  fireEvent.blur(target);

  expect(fn2).toBeCalled();

  await waitFor(() => {
    expect(getByText(config.validationMessages!.notBob)).toBeInTheDocument();
  });

  fireEvent.change(target, { target: { value: '12345678910' } });
  fireEvent.blur(target);

  expect(fn2).toBeCalledTimes(2);

  await waitFor(() => {
    expect(getByText(config.validationMessages!.lengthLimit)).toBeInTheDocument();
  });
});

test('JsonFormConfig should work well', () => {
  const outerConfig: Partial<IJsonFormConfig> = {
    components: {
      a: jest.fn(() => <div>a</div>),
    },
    validationMessages: {
      a: 'something',
      b: 'others',
    },
    validations: {
      a: jest.fn(),
      b: jest.fn(),
    },
  };

  const innerConfig: Partial<IJsonFormConfig> = {
    components: {
      a: jest.fn(() => <div>a2</div>),
      b: jest.fn(() => <div>b2</div>),
      c: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { validationMessages, validations } = useConfig();

        expect(validationMessages).toEqual({
          ...outerConfig.validationMessages,
          ...innerConfig.validationMessages,
        });
        expect(validations).toEqual({ ...outerConfig.validations, ...innerConfig.validations });

        return <></>;
      },
    },
    validationMessages: {
      a: 'something2',
      c: 'others',
    },
    validations: {
      a: jest.fn(),
      c: jest.fn(),
    },
  };

  render(
    <JsonFormConfig value={outerConfig}>
      <div>
        <JsonFormConfig value={innerConfig}>
          <JsonForm
            fields={[
              {
                name: 'a',
                type: 'a',
              },
              {
                name: 'b',
                type: 'b',
              },
            ]}
          />
        </JsonFormConfig>
      </div>
    </JsonFormConfig>
  );

  expect(outerConfig.components!.a).not.toBeCalled();
  expect(innerConfig.components!.a).toBeCalled();
  expect(innerConfig.components!.b).toBeCalled();
});

test('useFieldArrayControl should work well', async () => {
  const Input: React.FC = () => {
    const field = useField();
    const { value, setValue } = useFieldControl()!;

    return (
      <input
        type="text"
        data-testid={field.name}
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  };

  const ArrayComp: React.FC = () => {
    const { add, remove } = useFieldArrayControl()!;
    const field = useField();
    const subFields = useFieldGroup(field);

    return (
      <div>
        <p>this is Array Component</p>
        <ul>
          {subFields.map((sf, i) => (
            <li key={sf.id}>
              <Field field={sf} />
              <button type="button" onClick={() => remove(i)}>
                remove
              </button>
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

  const handleChange = jest.fn();

  const { getByText, container, getByDisplayValue } = render(
    <JsonFormConfig value={{ components: { input: Input, arrayComp: ArrayComp } }}>
      <JsonForm
        onValueChange={handleChange}
        fields={[
          {
            name: 'a',
            type: 'arrayComp',
            array: {
              type: 'input',
            },
          },
        ]}
      />
    </JsonFormConfig>
  );

  fireEvent.click(getByText('add'));

  expect(container.querySelectorAll('input')).toHaveLength(1);

  fireEvent.click(getByText('add'));

  expect(container.querySelectorAll('input')).toHaveLength(2);

  fireEvent.click(getByText('add'));

  fireEvent.change(container.querySelectorAll('input').item(1), {
    target: { value: 'test array' },
  });

  expect(handleChange).toBeCalledWith({ a: ['', 'test array', ''] });

  const target = getByDisplayValue('test array');

  await act(async () => {
    fireEvent.click(target.nextElementSibling!);
  });

  expect(target).not.toBeInTheDocument();
});
