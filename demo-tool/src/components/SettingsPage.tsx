import { Bell, Mail, Phone } from 'lucide-react';
import type { NotificationSettings, MachineConfig } from '../data/types';

interface SettingsPageProps {
  settings: NotificationSettings;
  machines: MachineConfig[];
  onUpdateSettings: (updated: NotificationSettings) => void;
}

export function SettingsPage({ settings, machines, onUpdateSettings }: SettingsPageProps) {
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
      machineOverrides: {
        ...settings.machineOverrides,
        [machineId]: !current,
      },
    });
  }

  function handleResetMachine(machineId: string) {
    const { [machineId]: _, ...rest } = settings.machineOverrides;
    onUpdateSettings({ ...settings, machineOverrides: rest });
  }

  return (
    <div>
      <h1 className="page-title">Einstellungen</h1>

      <div className="settings-grid">
        {/* Benachrichtigungen */}
        <div className="detail__section">
          <div className="detail__section-header">
            <Bell size={18} />
            <h2 className="detail__section-title">Benachrichtigungen</h2>
          </div>

          <div className="settings-section">
            {/* Global toggle */}
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Benachrichtigungen aktiviert (Global)</span>
                <span className="settings-row__hint">Standardeinstellung für alle Maschinen</span>
              </div>
              <button
                className={`toggle-switch ${settings.globalEnabled ? 'toggle-switch--on' : ''}`}
                onClick={() => onUpdateSettings({ ...settings, globalEnabled: !settings.globalEnabled })}
                role="switch"
                aria-checked={settings.globalEnabled}
              >
                <span className="toggle-switch__thumb" />
              </button>
            </div>

            {/* Email */}
            <div className="settings-row">
              <div className="settings-row__info">
                <label className="settings-row__label" htmlFor="settings-email">
                  <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  E-Mail-Adresse
                </label>
              </div>
              <input
                id="settings-email"
                type="email"
                className="config-input settings-input"
                value={settings.email}
                onChange={(e) => onUpdateSettings({ ...settings, email: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div className="settings-row">
              <div className="settings-row__info">
                <label className="settings-row__label" htmlFor="settings-phone">
                  <Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Telefonnummer (SMS)
                </label>
              </div>
              <input
                id="settings-phone"
                type="tel"
                className="config-input settings-input"
                value={settings.phone}
                onChange={(e) => onUpdateSettings({ ...settings, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Per machine settings */}
        <div className="detail__section">
          <div className="detail__section-header">
            <h2 className="detail__section-title">Benachrichtigungen je Maschine</h2>
          </div>

          <div className="settings-section">
            <p className="settings-hint">Überschreibt die globale Einstellung für einzelne Maschinen.</p>

            {machines.map((m) => {
              const enabled = isMachineEnabled(m.id);
              const isOverridden = m.id in settings.machineOverrides;
              return (
                <div key={m.id} className="settings-row">
                  <div className="settings-row__info">
                    <span className="settings-row__label">{m.name} - {m.serialNumber}</span>
                    {isOverridden && (
                      <button className="settings-row__reset" onClick={() => handleResetMachine(m.id)}>
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
