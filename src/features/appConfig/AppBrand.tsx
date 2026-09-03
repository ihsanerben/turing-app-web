import { useAppConfig } from './appConfigContextValue';

export function AppBrand({ admin = false }: { admin?: boolean }) {
  const { config } = useAppConfig();

  return (
    <>
      {config.logoUrl ? <img className="app-logo" src={config.logoUrl} alt="" /> : null}
      {admin ? `${config.applicationName} Yönetim` : config.applicationName}
    </>
  );
}

export function MaintenanceNotice() {
  const { config } = useAppConfig();
  if (!config.maintenanceNoticeEnabled || !config.maintenanceNotice) return null;
  return <aside className="maintenance-notice">{config.maintenanceNotice}</aside>;
}
