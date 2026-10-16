import type { NotificationSettings, MachineConfig, NotifyPrefs } from '../data/types';
import { NotifyPrefsControls } from './SettingsControls';

interface SettingsPageProps {
  settings: NotificationSettings;
  machines: MachineConfig[];
  onUpdateSettings: (updated: NotificationSettings) => void;
}

export function SettingsPage({ settings, onUpdateSettings }: SettingsPageProps) {
  function updatePrefs(next: NotifyPrefs) {
    onUpdateSettings({ ...settings, prefs: next });
  }

  return (
    <div className="m-settings">
      <h1 className="page-title">Einstellungen <span className="m-settings__scope">(Global)</span></h1>

      <NotifyPrefsControls prefs={settings.prefs} onChange={updatePrefs} showChannels />
    </div>
  );
}
