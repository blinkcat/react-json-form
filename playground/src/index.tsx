import React, { useReducer, useCallback } from 'react';
import { render } from 'react-dom';
import CodeMirror, { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import Split from '@uiw/react-split';
import { ErrorBoundary } from 'react-error-boundary';
import JsonForm, { IRawFields, IJsonFormProps } from '../../lib';
import mockJson from '../mock.json';

import './index.css';

const jsonSavedKey = 'savedJson';
const browserStorage = localStorage;

const savedJson = browserStorage.getItem(jsonSavedKey);

const initalJson = savedJson || JSON.stringify(mockJson, null, 2);

interface IAppState {
  inputJson: string;
  formJson: IRawFields;
  error: string;
  formValues: any;
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, {
    inputJson: initalJson,
    formJson: JSON.parse(initalJson),
    error: '',
    formValues: {},
  });

  const run = useCallback(() => {
    try {
      dispatch({ type: 'set_form_json', payload: JSON.parse(state.inputJson) });
    } catch (err) {
      if (err instanceof Error) {
        dispatch({ type: 'set_error', payload: err.message });
      } else {
        throw err;
      }
    }
    browserStorage.setItem(jsonSavedKey, state.inputJson);
  }, [state.inputJson]);

  const format = useCallback(() => {
    dispatch({ type: 'set_error', payload: '' });
    const json = state.inputJson;

    try {
      const fjson = JSON.stringify(JSON.parse(json), null, 2);
      dispatch({ type: 'set_input_json', payload: fjson });
    } catch (err) {
      if (err instanceof Error) {
        dispatch({ type: 'set_error', payload: err.message });
      } else {
        throw err;
      }
    }
  }, [state.inputJson]);

  const handleChange = useCallback<Required<ReactCodeMirrorProps>['onChange']>(
    (value, viewUpdate) => {
      dispatch({ type: 'set_error', payload: '' });
      dispatch({ type: 'set_input_json', payload: value });
    },
    []
  );

  const handleFormChange = useCallback<Required<IJsonFormProps>['onChange']>((values) => {
    dispatch({ type: 'set_form_values', payload: values });
  }, []);

  return (
    <div className="app">
      <header>
        <h1>react-json-form playground</h1>
        {state.error && <p className="error">{state.error}</p>}
        <div className="btn-group">
          <button onClick={format}>format</button>
          <button onClick={run}>run</button>
        </div>
      </header>
      <section className="content">
        <Split>
          <div style={{ width: '50%' }}>
            <CodeMirror
              value={state.inputJson}
              theme={'dark'}
              height="100%"
              style={{ height: '100%' }}
              extensions={[json()]}
              onChange={handleChange}
            />
          </div>
          <div style={{ width: '50%', padding: '8px' }}>
            <Split mode="vertical">
              <div style={{ height: '75%', overflow: 'scroll' }}>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <JsonForm source={state.formJson as any} onChange={handleFormChange} />
                </ErrorBoundary>
              </div>
              <div style={{ height: '25%', overflow: 'scroll' }}>
                <div>form values:</div>
                <pre>{JSON.stringify(state.formValues, null, 2)}</pre>
              </div>
            </Split>
          </div>
        </Split>
      </section>
    </div>
  );
};

interface IAppAction {
  type: 'set_input_json' | 'set_error' | 'set_form_json' | 'set_form_values';
  payload?: any;
}

function reducer(state: IAppState, action: IAppAction): IAppState {
  switch (action.type) {
    case 'set_input_json':
      return { ...state, inputJson: action.payload };
    case 'set_error':
      return { ...state, error: action.payload };
    case 'set_form_json':
      return { ...state, formJson: action.payload };
    case 'set_form_values':
      return { ...state, formValues: action.payload };
    default:
      return state;
  }
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <pre>{error.stack}</pre>
    </div>
  );
}

render(<App />, document.getElementById('root'));
