import { createContext, useContext } from 'react';
import { fallbackAppConfig, type PublicAppConfig } from './appConfigApi';

export type AppConfigValue = {
  config: PublicAppConfig;
  reload: () => Promise<void>;
};

export const AppConfigContext = createContext<AppConfigValue>({
  config: fallbackAppConfig,
  reload: async () => undefined,
});

export function useAppConfig() {
  return useContext(AppConfigContext);
}
