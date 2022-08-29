import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import CodeMirror, { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import Split from '@uiw/react-split';
import { ErrorBoundary } from 'react-error-boundary';
import JsonForm, { IJsonFormProps, IField, JsonFormConfig } from '../../lib';
import { config } from './Config';

import mockJson from '../mock.json';
import simpleJson from './json/simple.json';
import arrayJson from './json/array.json';
import nestedJson from './json/nested.json';
import relationJson from './json/relation.json';

import './index.css';

const demos = [
  JSON.stringify(mockJson, null, 2),
  JSON.stringify(simpleJson, null, 2),
  JSON.stringify(arrayJson, null, 2),
  JSON.stringify(nestedJson, null, 2),
  JSON.stringify(relationJson, null, 2),
];
const initalJson = demos[0];

interface IAppState {
  inputJson: string;
  formJson: IField[];
  error: string;
  formValues: any;
  demoIndex: string;
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, {
    inputJson: initalJson,
    formJson: JSON.parse(initalJson),
    error: '',
    formValues: {},
    demoIndex: '0',
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

  const onSelectChange = useCallback(
    (e: any) => {
      if (state.demoIndex === '0' && e.target.value !== '0') {
        demos[0] = state.inputJson;
      }

      dispatch({ type: 'set_input_json', payload: demos[e.target.value] });
      dispatch({ type: 'set_demo_index', payload: e.target.value });
    },
    [state.demoIndex, state.inputJson]
  );

  const demoIndexRef = useRef(state.demoIndex);

  useEffect(() => {
    if (demoIndexRef.current !== state.demoIndex) {
      run();
    }
    demoIndexRef.current = state.demoIndex;
  }, [run, state.demoIndex]);

  const handleFormChange = useCallback<Required<IJsonFormProps>['onValueChange']>((values) => {
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
          <label>
            <span style={{ color: 'rgba(243, 244, 246, 1)', marginRight: 5 }}>select demos:</span>
            <select value={state.demoIndex} onChange={onSelectChange}>
              <option value="0">playground</option>
              <option value="1">simple</option>
              <option value="2">array</option>
              <option value="3">nested</option>
              <option value="4">relation</option>
            </select>
          </label>
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
                  <JsonFormConfig value={config}>
                    <JsonForm fields={state.formJson} onValueChange={handleFormChange} />
                  </JsonFormConfig>
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

export default App;

interface IAppAction {
  type: 'set_input_json' | 'set_error' | 'set_form_json' | 'set_form_values' | 'set_demo_index';
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
    case 'set_demo_index': {
      return { ...state, demoIndex: action.payload };
    }
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
