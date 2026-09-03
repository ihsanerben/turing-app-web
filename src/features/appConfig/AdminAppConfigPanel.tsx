import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useAppConfig } from './appConfigContextValue';
import { appConfigApi, type AdminAppConfig } from './appConfigApi';

export function AdminAppConfigPanel() {
  const { reload } = useAppConfig();
  const [config, setConfig] = useState<AdminAppConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    appConfigApi
      .adminConfig()
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch((error) => {
        if (active) setMessage(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    setSaving(true);
    setMessage('');
    try {
      const saved = await appConfigApi.update(config);
      setConfig(saved);
      await reload();
      setMessage('Uygulama ayarları kaydedildi.');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (!config) return <p role="status">Uygulama ayarları yükleniyor…</p>;

  function change<K extends keyof AdminAppConfig>(key: K, value: AdminAppConfig[K]) {
    setConfig((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <form className="management-card app-config-form" onSubmit={submit}>
      <h2>Uygulama görünümü ve iletişim</h2>
      <label>
        Uygulama adı
        <input
          value={config.applicationName}
          maxLength={100}
          required
          onChange={(event) => change('applicationName', event.target.value)}
        />
      </label>
      <label>
        Kısa açıklama
        <input
          value={config.tagline}
          maxLength={240}
          required
          onChange={(event) => change('tagline', event.target.value)}
        />
      </label>
      <label>
        Logo URL
        <input
          type="url"
          value={config.logoUrl ?? ''}
          maxLength={500}
          onChange={(event) => change('logoUrl', event.target.value || null)}
        />
      </label>
      <label>
        Ana renk
        <input
          type="color"
          value={config.primaryColor}
          onChange={(event) => change('primaryColor', event.target.value)}
        />
      </label>
      <label>
        Destek e-postası
        <input
          type="email"
          value={config.supportEmail}
          maxLength={320}
          required
          onChange={(event) => change('supportEmail', event.target.value)}
        />
      </label>
      <label>
        Destek telefonu
        <input
          value={config.supportPhone ?? ''}
          maxLength={40}
          onChange={(event) => change('supportPhone', event.target.value || null)}
        />
      </label>
      <label className="wide-field">
        İletişim adresi
        <textarea
          value={config.contactAddress ?? ''}
          maxLength={500}
          onChange={(event) => change('contactAddress', event.target.value || null)}
        />
      </label>
      <label className="wide-field">
        Footer metni
        <input
          value={config.footerText}
          maxLength={300}
          required
          onChange={(event) => change('footerText', event.target.value)}
        />
      </label>
      <label className="checkbox-field wide-field">
        <input
          type="checkbox"
          checked={config.maintenanceNoticeEnabled}
          onChange={(event) => change('maintenanceNoticeEnabled', event.target.checked)}
        />
        Bakım duyurusunu göster
      </label>
      <label className="wide-field">
        Bakım duyurusu
        <textarea
          value={config.maintenanceNotice ?? ''}
          maxLength={500}
          required={config.maintenanceNoticeEnabled}
          onChange={(event) => change('maintenanceNotice', event.target.value || null)}
        />
      </label>
      <button type="submit" disabled={saving}>
        {saving ? 'Kaydediliyor…' : 'Ayarları kaydet'}
      </button>
      {message ? (
        <p role="status" className="wide-field">
          {message}
        </p>
      ) : null}
    </form>
  );
}

function errorMessage(error: unknown) {
  return axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message
    : 'Uygulama ayarları işlenemedi.';
}
