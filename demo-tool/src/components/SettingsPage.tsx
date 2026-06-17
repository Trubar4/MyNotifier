import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { NotificationSettings, MachineConfig } from '../data/types';

type UnitSystem = 'metric' | 'imperial';
type DateFormat = 'dd.mm.yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
type TimeFormat = '24h' | '12h';

interface SettingsPageProps {
  settings: NotificationSettings;
  machines: MachineConfig[];
  onUpdateSettings: (updated: NotificationSettings) => void;
}

export function SettingsPage({ settings, machines, onUpdateSettings }: SettingsPageProps) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [dateFormat, setDateFormat] = useState<DateFormat>('dd.mm.yyyy');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');

  function isMachineEnabled(machineId: string): boolean {
    if (machineId in settings.machineOverrides) {
      return settings.machineOverrides[machineId];
    }
    return settings.globalEnabled;
  }

  function handleToggleMachine(machineId: string) {
    const current = isMachineEnabled(machineId);
    onUpdateSettings({
      ...settings,
      machineOverrides: { ...settings.machineOverrides, [machineId]: !current },
    });
  }

return (
    <div>
      <h1 className="page-title">Einstellungen</h1>

      <div className="settings-grid">

        {/* Einheiten */}
        <div className="detail__section">
          <h2 className="settings-section-title">Einheiten</h2>

          <div className="settings-section">
            <div className="settings-block">
              <span className="settings-block__label">Einheitensystem</span>
              <div className="settings-toggle-group">
                <button
                  className={`settings-toggle-btn${unitSystem === 'metric' ? ' settings-toggle-btn--active' : ''}`}
                  onClick={() => setUnitSystem('metric')}
                >
                  Metrisch
                </button>
                <button
                  className={`settings-toggle-btn${unitSystem === 'imperial' ? ' settings-toggle-btn--active' : ''}`}
                  onClick={() => setUnitSystem('imperial')}
                >
                  Imperial
                </button>
              </div>
            </div>

            <div className="settings-block-row">
              <div className="settings-block">
                <span className="settings-block__label">Datumsformat</span>
                <select
                  className="reports-select settings-select"
                  value={dateFormat}
                  onChange={e => setDateFormat(e.target.value as DateFormat)}
                >
                  <option value="dd.mm.yyyy">31.08.2000</option>
                  <option value="mm/dd/yyyy">08/31/2000</option>
                  <option value="yyyy-mm-dd">2000-08-31</option>
                </select>
              </div>

              <div className="settings-block">
                <span className="settings-block__label">Uhrzeitformat</span>
                <div className="settings-toggle-group">
                  <button
                    className={`settings-toggle-btn${timeFormat === '24h' ? ' settings-toggle-btn--active' : ''}`}
                    onClick={() => setTimeFormat('24h')}
                  >
                    24 Stunden
                  </button>
                  <button
                    className={`settings-toggle-btn${timeFormat === '12h' ? ' settings-toggle-btn--active' : ''}`}
                    onClick={() => setTimeFormat('12h')}
                  >
                    12 Stunden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benachrichtigungen */}
        <div className="detail__section">
          <h2 className="settings-section-title">Benachrichtigungen</h2>

          <div className="settings-section">
            <div className="settings-row">
              <span className="settings-row__label">Alle Benachrichtigungen aktivieren</span>
              <button
                className={`toggle-switch ${settings.globalEnabled ? 'toggle-switch--on' : ''}`}
                onClick={() => onUpdateSettings({ ...settings, globalEnabled: !settings.globalEnabled })}
                role="switch"
                aria-checked={settings.globalEnabled}
              >
                <span className="toggle-switch__thumb" />
              </button>
            </div>

            <div className="settings-row settings-row--stacked">
              <div className="settings-row__top">
                <span className="settings-row__label">E-Mail-Benachrichtigung aktivieren</span>
                <button
                  className={`toggle-switch ${settings.email ? 'toggle-switch--on' : ''}`}
                  onClick={() => onUpdateSettings({ ...settings, email: settings.email ? '' : 'max.mustermann@liebherr.com' })}
                  role="switch"
                  aria-checked={!!settings.email}
                >
                  <span className="toggle-switch__thumb" />
                </button>
              </div>
              <input
                id="settings-email"
                type="email"
                className="config-input settings-input settings-input--full"
                placeholder="E-Mail-Adresse eingeben"
                value={settings.email}
                onChange={(e) => onUpdateSettings({ ...settings, email: e.target.value })}
              />
              <span className="settings-row__hint">E-Mail-Adresse eingeben, an die die Benachrichtigung gesendet werden soll</span>
            </div>

            <div className="settings-row settings-row--stacked">
              <div className="settings-row__top">
                <span className="settings-row__label">SMS-Benachrichtigung aktivieren</span>
                <button
                  className={`toggle-switch ${settings.phone ? 'toggle-switch--on' : ''}`}
                  onClick={() => onUpdateSettings({ ...settings, phone: settings.phone ? '' : '+43664' })}
                  role="switch"
                  aria-checked={!!settings.phone}
                >
                  <span className="toggle-switch__thumb" />
                </button>
              </div>
              <span className="settings-row__hint">Mobiltelefonnummer eingeben, an die die Benachrichtigung gesendet werden soll</span>
              <input
                id="settings-phone"
                type="tel"
                className="config-input settings-input settings-input--full"
                placeholder="+43 664 1234567"
                value={settings.phone}
                onChange={(e) => onUpdateSettings({ ...settings, phone: e.target.value })}
              />
            </div>

            <div className="settings-row settings-row--stacked">
              <div className="settings-row__top">
                <span className="settings-row__label">Prognosefenster für Warnungen</span>
                <span className="settings-forecast-value">{settings.forecastWindowHours} h</span>
              </div>
              <input
                type="range"
                min={1}
                max={72}
                step={1}
                className="settings-forecast-slider"
                value={settings.forecastWindowHours}
                onChange={e => onUpdateSettings({ ...settings, forecastWindowHours: parseInt(e.target.value) })}
              />
              <span className="settings-row__hint">
                <span className="settings-row__hint-icon">ⓘ</span>
                {' '}Sie werden nur für Überschreitungen des Schwellenwerts im gewählten Zeitfenster benachrichtigt.
              </span>
            </div>
          </div>
        </div>

        {/* Per machine settings */}
        <div className="detail__section">
          <h2 className="settings-section-title">Benachrichtigungen je Maschine</h2>

          <div className="settings-section">
            <p className="settings-hint">Überschreibt die globale Einstellung für einzelne Maschinen.</p>

            {machines.map((m) => {
              const enabled = isMachineEnabled(m.id);
              const isOverridden = m.id in settings.machineOverrides;
              const windowOverride = settings.forecastWindowOverrides[m.id];
              const hasWindowOverride = windowOverride !== undefined;
              const effectiveWindow = hasWindowOverride ? windowOverride : settings.forecastWindowHours;
              return (
                <div key={m.id} className="settings-machine-block">
                  <div className="settings-row">
                    <div className="settings-row__info">
                      <span className="settings-row__label">{m.name} - {m.serialNumber}</span>
                      {(isOverridden || hasWindowOverride) && (
                        <button className="settings-row__reset" onClick={() => {
                          const { [m.id]: _a, ...restOverrides } = settings.machineOverrides;
                          const { [m.id]: _b, ...restWindow } = settings.forecastWindowOverrides;
                          onUpdateSettings({ ...settings, machineOverrides: restOverrides, forecastWindowOverrides: restWindow });
                        }}>
                          Auf Global zurücksetzen
                        </button>
                      )}
                    </div>
                    <button
                      className={`toggle-switch ${enabled ? 'toggle-switch--on' : ''}`}
                      onClick={() => handleToggleMachine(m.id)}
                      role="switch"
                      aria-checked={enabled}
                    >
                      <span className="toggle-switch__thumb" />
                    </button>
                  </div>
                  <div className="settings-machine-window">
                    <div className="settings-machine-window__top">
                      <span className="settings-row__hint">Prognosefenster</span>
                      <span className="settings-forecast-value settings-forecast-value--sm">{effectiveWindow} h{!hasWindowOverride && ' (Global)'}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={72}
                      step={1}
                      className="settings-forecast-slider"
                      value={effectiveWindow}
                      onChange={e => onUpdateSettings({
                        ...settings,
                        forecastWindowOverrides: { ...settings.forecastWindowOverrides, [m.id]: parseInt(e.target.value) },
                      })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lizenz-Info */}
        <div className="detail__section">
          <h2 className="settings-section-title">Lizenz Info</h2>

          <div className="settings-section">
            <p className="settings-license__validity">Lizenz gültig bis 25.05.2028</p>
            <div className="settings-license__actions">
              <button className="lds-btn lds-btn--ghost settings-license__btn">
                Jahreslizenz kaufen
                <ArrowRight size={16} />
              </button>
              <button className="lds-btn lds-btn--ghost settings-license__btn">
                myLiebherr-Portal öffnen
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
