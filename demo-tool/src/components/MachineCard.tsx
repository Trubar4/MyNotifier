import {
  Construction,
  Wifi,
  WifiOff,
  Wind,
  CloudSun,
  MapPin,
  ChevronRight,
  Settings,
  PenLine,
} from 'lucide-react';
import type { MachineConfig } from '../data/types';
import { BOOM_POSITION_LABELS } from '../data/types';
import { InfoPopover } from './InfoPopover';

interface MachineCardProps {
  machine: MachineConfig;
  onOpenConfig: () => void;
  onOpen: () => void;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'jetzt';
  if (diffMin < 60) return `vor ${diffMin} Min.`;

  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isLive(date: Date): boolean {
  return Date.now() - date.getTime() < 60000;
}

export function MachineCard({ machine, onOpenConfig, onOpen }: MachineCardProps) {
  const hasLicense = machine.license === 'active';
  const isOnline = machine.status === 'online';

  return (
    <div className="machine-card">
      {/* Header */}
      <div className="machine-card__header">
        <div className="machine-card__icon">
          <Construction size={24} />
          {machine.notificationCount > 0 && (
            <div className="machine-card__notification-dot">
              <span className="dot dot--error">{machine.notificationCount}</span>
            </div>
          )}
        </div>
        <span className="machine-card__title">
          {machine.name} - {machine.serialNumber}
        </span>
        <button
          className="machine-card__config-btn"
          onClick={onOpenConfig}
          title="Demo-Konfiguration"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="machine-card__body">
        {!hasLicense ? (
          <div className="data-field data-field--full">
            <span className="license-badge license-badge--none">Keine Lizenz</span>
          </div>
        ) : (
          <>
            {/* Auslegerposition */}
            <div className="data-field">
              <div className="data-field__header">
                <MapPin size={14} className="data-field__icon" />
                <span className="data-field__label">Aktuelle Auslegerposition</span>
              </div>
              <span className="data-field__value">
                {BOOM_POSITION_LABELS[machine.position.position]}
              </span>
              {!isOnline && !machine.position.manuallySet && (
                <span className="data-field__timestamp">
                  Wert von {formatTimestamp(machine.position.timestamp)}
                </span>
              )}
              {machine.position.manuallySet && (
                <span className="data-field__timestamp">
                  Position manuell gesetzt am {formatTimestamp(machine.position.timestamp)}
                </span>
              )}
              <button className="data-field__action">
                <PenLine size={10} />
                Position prüfen und manuell setzen
              </button>
            </div>

            {/* Maschinenstatus */}
            <div className="data-field">
              <div className="data-field__header">
                {isOnline ? <Wifi size={14} className="data-field__icon" /> : <WifiOff size={14} className="data-field__icon" />}
                <span className="data-field__label">Maschinenstatus</span>
                <InfoPopover>
                  <div>
                    <strong>Online</strong> = Master ein + Datenverbindung<br />
                    <strong>Offline</strong> = Master aus UND/ODER keine Datenverbindung
                  </div>
                </InfoPopover>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status-dot ${isOnline ? 'status-dot--online' : 'status-dot--offline'}`} />
                <span className="data-field__value">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Aktuelle Windgeschwindigkeit */}
            <div className="data-field">
              <div className="data-field__header">
                <Wind size={14} className="data-field__icon" />
                <span className="data-field__label">Aktuelle Windgeschwindigkeit</span>
              </div>
              <div className="wind-values">
                <div className="wind-value-row">
                  <span className="wind-value-row__label">Nadelausleger:</span>
                  <span className="wind-value-row__value">
                    {machine.wind.needleBoom.toFixed(1)} m/s
                  </span>
                </div>
                <div className="wind-value-row">
                  <span className="wind-value-row__label">Hauptausleger:</span>
                  <span className="wind-value-row__value">
                    {machine.wind.mainBoom.toFixed(1)} m/s
                  </span>
                </div>
              </div>
              {!isLive(machine.wind.timestamp) && (
                <span className="data-field__timestamp">
                  Wert von {formatTimestamp(machine.wind.timestamp)}
                </span>
              )}
              {isLive(machine.wind.timestamp) && (
                <span className="data-field__timestamp" style={{ color: 'var(--r-on-success-soft)' }}>
                  Live
                </span>
              )}
            </div>

            {/* Vorhersage 72h */}
            <div className="data-field">
              <div className="data-field__header">
                <CloudSun size={14} className="data-field__icon" />
                <span className="data-field__label">Vorhersage 72h</span>
                <InfoPopover>
                  Die Vorhersagen stammen von Meteomatics aufgrund der Höhe der Auslegerposition des Maschinenstandorts.
                </InfoPopover>
              </div>
              <span className="data-field__value">
                Max {machine.forecast.max72h.toFixed(1)} m/s
              </span>
              <span className="data-field__timestamp">
                Vorhersage von {formatTimestamp(machine.forecast.timestamp)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="machine-card__footer">
        <button className="machine-card__open-btn" onClick={onOpen}>
          OPEN <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
