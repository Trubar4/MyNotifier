import { X } from 'lucide-react';
import { useState } from 'react';
import type {
  MachineConfig,
  MachineStatus,
  LicenseStatus,
  BoomPosition,
} from '../data/types';
import { BOOM_POSITION_LABELS } from '../data/types';

interface ScenarioConfigProps {
  machine: MachineConfig;
  onSave: (updated: MachineConfig) => void;
  onClose: () => void;
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ScenarioConfig({ machine, onSave, onClose }: ScenarioConfigProps) {
  const [status, setStatus] = useState<MachineStatus>(machine.status);
  const [license, setLicense] = useState<LicenseStatus>(machine.license);
  const [position, setPosition] = useState<BoomPosition>(machine.position.position);
  const [manuallySet, setManuallySet] = useState(machine.position.manuallySet);
  const [autoUpdate, setAutoUpdate] = useState(machine.position.autoUpdate);
  const [fixedUntilStr, setFixedUntilStr] = useState(
    machine.position.fixedUntil ? formatDateTimeLocal(machine.position.fixedUntil) : ''
  );
  const [reportedPosition, setReportedPosition] = useState<BoomPosition | 'none'>(
    machine.position.reportedPosition ?? 'none'
  );
  const [windNeedle, setWindNeedle] = useState(machine.wind.needleBoom);
  const [windMain, setWindMain] = useState(machine.wind.mainBoom);
  const [forecast, setForecast] = useState(machine.forecast.max72h);
  const [dataAge, setDataAge] = useState<'live' | '1h' | '24h' | '48h'>('live');

  function getTimestampForAge(): Date {
    const ages: Record<string, number> = {
      live: 0,
      '1h': 1,
      '24h': 24,
      '48h': 48,
    };
    return new Date(Date.now() - (ages[dataAge] ?? 0) * 60 * 60 * 1000);
  }

  function handleSave() {
    const ts = getTimestampForAge();
    const windTs = status === 'online' ? new Date() : ts;
    onSave({
      ...machine,
      status,
      license,
      position: {
        position,
        timestamp: status === 'online' && !manuallySet ? new Date() : ts,
        manuallySet,
        fixedUntil: fixedUntilStr ? new Date(fixedUntilStr) : null,
        autoUpdate,
        reportedPosition: reportedPosition === 'none' ? null : reportedPosition,
        reportedAt: reportedPosition !== 'none' ? new Date(Date.now() - 30 * 60 * 1000) : null,
      },
      wind: {
        needleBoom: windNeedle,
        mainBoom: windMain,
        timestamp: windTs,
      },
      forecast: {
        max72h: forecast,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    });
    onClose();
  }

  return (
    <div className="config-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="config-modal">
        <div className="config-modal__header">
          <h2 className="config-modal__title">
            Demo-Konfiguration
          </h2>
          <button className="config-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="config-modal__body">
          <div style={{ font: '400 14px/20px var(--font-text)', color: 'var(--r-on-surface-muted)' }}>
            {machine.name} - {machine.serialNumber}
          </div>

          {/* Maschinenstatus */}
          <div className="config-field">
            <span className="config-field__label">Maschinenstatus</span>
            <div className="config-field__row">
              {(['online', 'offline'] as MachineStatus[]).map((s) => (
                <button
                  key={s}
                  className={`config-chip ${status === s ? 'config-chip--active' : ''}`}
                  onClick={() => setStatus(s)}
                >
                  {s === 'online' ? 'Online' : 'Offline'}
                </button>
              ))}
            </div>
          </div>

          {/* Lizenz */}
          <div className="config-field">
            <span className="config-field__label">Lizenz</span>
            <div className="config-field__row">
              {(['active', 'none', 'expired'] as LicenseStatus[]).map((l) => (
                <button
                  key={l}
                  className={`config-chip ${license === l ? 'config-chip--active' : ''}`}
                  onClick={() => setLicense(l)}
                >
                  {l === 'active' ? 'Aktiv' : l === 'none' ? 'Keine Lizenz' : 'Abgelaufen'}
                </button>
              ))}
            </div>
          </div>

          {/* Auslegerposition */}
          <div className="config-field">
            <span className="config-field__label">Auslegerposition</span>
            <div className="config-field__row">
              {(Object.keys(BOOM_POSITION_LABELS) as BoomPosition[]).map((p) => (
                <button
                  key={p}
                  className={`config-chip ${position === p ? 'config-chip--active' : ''}`}
                  onClick={() => setPosition(p)}
                >
                  {BOOM_POSITION_LABELS[p]}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={manuallySet}
                onChange={(e) => setManuallySet(e.target.checked)}
                style={{ accentColor: 'var(--r-brand)' }}
              />
              <span style={{ font: '400 13px/18px var(--font-text)', color: 'var(--r-on-surface-muted)' }}>
                Position manuell gesetzt
              </span>
            </label>
          </div>

          {/* Position fixieren bis */}
          <div className="config-field">
            <span className="config-field__label">Position fixieren bis</span>
            <input
              type="datetime-local"
              className="config-input"
              value={fixedUntilStr}
              onChange={(e) => setFixedUntilStr(e.target.value)}
            />
          </div>

          {/* Auto-Update */}
          <div className="config-field">
            <span className="config-field__label">Automatische Positionsaktualisierung</span>
            <div className="config-field__row">
              <button
                className={`config-chip ${autoUpdate ? 'config-chip--active' : ''}`}
                onClick={() => setAutoUpdate(true)}
              >
                Ein (On)
              </button>
              <button
                className={`config-chip ${!autoUpdate ? 'config-chip--active' : ''}`}
                onClick={() => setAutoUpdate(false)}
              >
                Aus (Off)
              </button>
            </div>
          </div>

          {/* Gemeldete Position (wenn autoUpdate OFF) */}
          {!autoUpdate && (
            <div className="config-field">
              <span className="config-field__label">Gemeldete Position (Maschine war online)</span>
              <div className="config-field__row">
                <button
                  className={`config-chip ${reportedPosition === 'none' ? 'config-chip--active' : ''}`}
                  onClick={() => setReportedPosition('none')}
                >
                  Keine
                </button>
                {(Object.keys(BOOM_POSITION_LABELS) as BoomPosition[]).filter(p => p !== 'unknown').map((p) => (
                  <button
                    key={p}
                    className={`config-chip ${reportedPosition === p ? 'config-chip--active' : ''}`}
                    onClick={() => setReportedPosition(p)}
                  >
                    {BOOM_POSITION_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Datenalter */}
          {status === 'offline' && (
            <div className="config-field">
              <span className="config-field__label">Datenalter (Offline seit)</span>
              <div className="config-field__row">
                {(['live', '1h', '24h', '48h'] as const).map((a) => (
                  <button
                    key={a}
                    className={`config-chip ${dataAge === a ? 'config-chip--active' : ''}`}
                    onClick={() => setDataAge(a)}
                  >
                    {a === 'live' ? 'Gerade eben' : a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Windgeschwindigkeit */}
          <div className="config-field">
            <span className="config-field__label">Aktuelle Windgeschwindigkeit</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ font: '400 13px/18px var(--font-text)', color: 'var(--r-on-surface-muted)', minWidth: 100 }}>
                Nadelausleger:
              </span>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="40"
                step="0.5"
                value={windNeedle}
                onChange={(e) => setWindNeedle(parseFloat(e.target.value))}
              />
              <span className="config-slider__value" style={{ minWidth: 60, textAlign: 'right', fontSize: 16 }}>
                {windNeedle.toFixed(1)}
                <span className="config-slider__unit">m/s</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ font: '400 13px/18px var(--font-text)', color: 'var(--r-on-surface-muted)', minWidth: 100 }}>
                Hauptausleger:
              </span>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="40"
                step="0.5"
                value={windMain}
                onChange={(e) => setWindMain(parseFloat(e.target.value))}
              />
              <span className="config-slider__value" style={{ minWidth: 60, textAlign: 'right', fontSize: 16 }}>
                {windMain.toFixed(1)}
                <span className="config-slider__unit">m/s</span>
              </span>
            </div>
          </div>

          {/* Vorhersage */}
          <div className="config-field">
            <span className="config-field__label">Vorhersage 72h (Max)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="40"
                step="0.5"
                value={forecast}
                onChange={(e) => setForecast(parseFloat(e.target.value))}
              />
              <span className="config-slider__value" style={{ minWidth: 60, textAlign: 'right' }}>
                {forecast.toFixed(1)}
                <span className="config-slider__unit">m/s</span>
              </span>
            </div>
          </div>
        </div>

        <div className="config-modal__footer">
          <button className="lds-btn lds-btn--ghost" onClick={onClose}>
            Abbrechen
          </button>
          <button className="lds-btn lds-btn--primary" onClick={handleSave}>
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
