import type { NotificationSettings, MachineConfig, NotifyPrefs } from '../data/types';
import { NotifyPrefsControls } from './SettingsControls';
import { useLang } from '../i18n';

interface SettingsPageProps {
  settings: NotificationSettings;
  machines: MachineConfig[];
  onUpdateSettings: (updated: NotificationSettings) => void;
}

export function SettingsPage({ settings, onUpdateSettings }: SettingsPageProps) {
  const { lang, setLang, t, units, setUnits } = useLang();

  function updatePrefs(next: NotifyPrefs) {
    onUpdateSettings({ ...settings, prefs: next });
  }

  return (
    <div className="m-settings">
      <h1 className="page-title">
        {t('Einstellungen', 'Settings')} <span className="m-settings__scope">{t('(Global)', '(Global)')}</span>
      </h1>

      <section className="m-settings-group">
        <h2 className="m-settings-group__title">{t('Sprache', 'Language')}</h2>
        <div className="m-segment m-segment--2">
          <button
            className={`m-segment__btn ${lang === 'de' ? 'm-segment__btn--active' : ''}`}
            onClick={() => setLang('de')}
            aria-pressed={lang === 'de'}
          >
            Deutsch
          </button>
          <button
            className={`m-segment__btn ${lang === 'en' ? 'm-segment__btn--active' : ''}`}
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
          >
            English
          </button>
        </div>
      </section>

      <section className="m-settings-group">
        <h2 className="m-settings-group__title">{t('Einheiten', 'Units')}</h2>
        <div className="m-segment m-segment--2">
          <button
            className={`m-segment__btn ${units === 'metric' ? 'm-segment__btn--active' : ''}`}
            onClick={() => setUnits('metric')}
            aria-pressed={units === 'metric'}
          >
            {t('Metrisch (m/s, °C, m)', 'Metric (m/s, °C, m)')}
          </button>
          <button
            className={`m-segment__btn ${units === 'imperial' ? 'm-segment__btn--active' : ''}`}
            onClick={() => setUnits('imperial')}
            aria-pressed={units === 'imperial'}
          >
            {t('Imperial (mph, °F, ft)', 'Imperial (mph, °F, ft)')}
          </button>
        </div>
      </section>

      <NotifyPrefsControls
        prefs={settings.prefs}
        onChange={updatePrefs}
        showChannels
        activeExceedanceDisabled={settings.disableActiveExceedance !== false}
        onToggleActiveExceedance={(v) => onUpdateSettings({ ...settings, disableActiveExceedance: v })}
        activeForecastDisabled={settings.disableActiveForecast === true}
        onToggleActiveForecast={(v) => onUpdateSettings({ ...settings, disableActiveForecast: v })}
      />
    </div>
  );
}
