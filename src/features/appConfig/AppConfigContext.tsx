import { useEffect, useState, type ReactNode } from 'react';
import { appConfigApi, fallbackAppConfig } from './appConfigApi';
import { AppConfigContext } from './appConfigContextValue';

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(fallbackAppConfig);

  async function reload() {
    const value = await appConfigApi.publicConfig();
    setConfig(value);
  }

  useEffect(() => {
    let active = true;
    appConfigApi
      .publicConfig()
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', config.primaryColor);
    document.title = config.applicationName;
  }, [config.applicationName, config.primaryColor]);

  return (
    <AppConfigContext.Provider value={{ config, reload }}>{children}</AppConfigContext.Provider>
  );
}
