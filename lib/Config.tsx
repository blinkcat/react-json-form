import React, { useContext, useMemo } from 'react';
import { IValidationMessages, IValidations } from './types';

export interface IJsonFormConfig {
  components: { [type: string]: React.ComponentType<any> };
  validations: IValidations;
  validationMessages: IValidationMessages;
}

const defaultJsonFormConfig: IJsonFormConfig = {
  components: {},
  validations: {},
  validationMessages: {},
};

export const JsonFormConfigContext = React.createContext<IJsonFormConfig>(defaultJsonFormConfig);

export const JsonFormConfig: React.FC<{
  value: Partial<IJsonFormConfig>;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const lastConfig = useConfig();
  const mergedConfig = useMemo(() => mergeConfig(lastConfig, value), [lastConfig, value]);

  return (
    <JsonFormConfigContext.Provider value={mergedConfig}>{children}</JsonFormConfigContext.Provider>
  );
};

JsonFormConfig.defaultProps = {
  value: defaultJsonFormConfig,
};

export function useConfig() {
  return useContext(JsonFormConfigContext);
}

function mergeConfig(old: IJsonFormConfig, cur: Partial<IJsonFormConfig>): IJsonFormConfig {
  return {
    ...old,
    ...cur,
    components: { ...old.components, ...cur.components },
    validations: { ...old.validations, ...cur.validations },
    validationMessages: { ...old.validationMessages, ...cur.validationMessages },
  };
}
