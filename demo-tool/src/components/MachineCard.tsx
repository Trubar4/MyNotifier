import {
  Wifi,
  WifiOff,
  CloudSun,
  ChevronRight,
  Settings,
  PenLine,
  MapPin,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import type { MachineConfig } from '../data/types';
import { BOOM_POSITION_LABELS, BOOM_THRESHOLDS } from '../data/types';
import { InfoPopover } from './InfoPopover';

const BASE = import.meta.env.BASE_URL;

interface MachineCardProps {
  machine: MachineConfig;
  notifCritical: number;
  notifWarning: number;
  assignedUser: string | null;
  onOpenConfig: () => void;
  onOpen: () => void;
  onOpenPositionSelector: () => void;
  onNotifClick: () => void;
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

export function MachineCard({ machine, notifCritical, notifWarning, assignedUser, onOpenConfig, onOpen, onOpenPositionSelector, onNotifClick }: MachineCardProps) {
  const hasLicense = machine.license === 'active';
  const isOnline = machine.status === 'online';
  const totalNotifications = notifCritical + notifWarning;
  const hasCritical = notifCritical > 0;

  const threshold = BOOM_THRESHOLDS[machine.position.position];
  const needleExceeds = threshold !== null && machine.wind.needleBoom >= threshold;
  const mainExceeds = threshold !== null && machine.wind.mainBoom >= threshold;
  const windDanger = needleExceeds || mainExceeds;

  const forecastExceedanceTime = threshold !== null
    ? machine.forecast.hourly.find(h => h.speed >= threshold)?.timestamp ?? null
    : null;

  return (
    <div className={`machine-card ${windDanger && hasLicense ? 'machine-card--danger' : ''}`}>
      {/* Header */}
      <div className="machine-card__header">
        <div className="machine-card__icon" onClick={totalNotifications > 0 ? onNotifClick : undefined} style={totalNotifications > 0 ? { cursor: 'pointer' } : undefined}>
          <img src={BASE + 'crane-lwn.svg'} alt="" width={24} height={24} />
          {totalNotifications > 0 && (
            <span className={`machine-card__badge ${hasCritical ? 'machine-card__badge--critical' : 'machine-card__badge--warning'}`}>
              {totalNotifications}
            </span>
          )}
        </div>
        <div className="machine-card__title-group">
          <span className="machine-card__title">
            {machine.name} - {machine.serialNumber}
          </span>
          <span className="machine-card__title-accent" />
        </div>
        <button
          className="machine-card__config-btn"
          onClick={onOpenConfig}
          title="Demo-Konfiguration"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Assigned user banner */}
      {assignedUser && (
        <div className="machine-card__assigned">
          <CheckCircle size={12} />
          <span>{assignedUser} hat die Aufgabe übernommen</span>
        </div>
      )}

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
                <img src={BASE + 'boom-angle.svg'} alt="" width={16} height={16} className="data-field__icon" />
              </div>
              <span className="data-field__value">
                {BOOM_POSITION_LABELS[machine.position.position]}
              </span>
              <span className="data-field__label">Aktuelle Auslegerposition</span>
              {!isOnline && !machine.position.manuallySet && (
                <span className="data-field__timestamp">
                  Wert von {formatTimestamp(machine.position.timestamp)}
                </span>
              )}
              {machine.position.manuallySet && (
                <span className="data-field__timestamp">
                  Manuell gesetzt am {formatTimestamp(machine.position.timestamp)}
                </span>
              )}
              {!isOnline && !machine.position.manuallySet && (
                <button className="lds-btn lds-btn--primary lds-btn--sm position-action" onClick={onOpenPositionSelector}>
                  Prüfen und setzen
                </button>
              )}
              {!isOnline && machine.position.manuallySet && (
                <button className="position-action position-action--subtle" onClick={onOpenPositionSelector}>
                  <PenLine size={12} />
                  Position bei Änderung aktualisieren
                </button>
              )}
            </div>

            {/* Maschinenstatus */}
            <div className="data-field">
              <div className="data-field__header">
                {isOnline ? <Wifi size={14} className="data-field__icon" /> : <WifiOff size={14} className="data-field__icon" />}
                <InfoPopover>
                  <div>
                    <strong>Online</strong> = Master ein + Datenverbindung<br />
                    <strong>Offline</strong> = Master aus UND/ODER keine Datenverbindung
                  </div>
                </InfoPopover>
              </div>
              <span className="data-field__value">
                <span className={`status-dot ${isOnline ? 'status-dot--online' : 'status-dot--offline'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <span className="data-field__label">Maschinenstatus</span>
            </div>

            {/* Aktuelle Windgeschwindigkeit */}
            <div className="data-field">
              <div className="data-field__value">
                <div className="wind-values">
                  <div className="wind-value-row">
                    <span className="wind-value-row__label">Nadelausleger</span>
                    <span className={`wind-value-row__value ${needleExceeds ? 'wind-value-row__value--danger' : ''}`}>
                      {machine.wind.needleBoom.toFixed(1)} m/s
                    </span>
                  </div>
                  <div className="wind-value-row">
                    <span className="wind-value-row__label">Hauptausleger</span>
                    <span className={`wind-value-row__value ${mainExceeds ? 'wind-value-row__value--danger' : ''}`}>
                      {machine.wind.mainBoom.toFixed(1)} m/s
                    </span>
                  </div>
                </div>
              </div>
              <span className="data-field__label">Aktuelle Windgeschwindigkeit</span>
              {windDanger && threshold !== null && (
                <div className="data-field__wind-warning">
                  <AlertTriangle size={12} />
                  <span>Schwellenwert überschritten ({threshold} m/s)</span>
                </div>
              )}
              {!isLive(machine.wind.timestamp) && (
                <span className="data-field__timestamp">
                  Wert von {formatTimestamp(machine.wind.timestamp)}
                </span>
              )}
              {isLive(machine.wind.timestamp) && (
                <span className="data-field__timestamp" style={{ color: 'var(--r-on-success-soft)', fontStyle: 'normal', opacity: 1 }}>
                  Live
                </span>
              )}
            </div>

            {/* Vorhersage 72h */}
            <div className="data-field">
              <div className="data-field__header">
                <CloudSun size={14} className="data-field__icon" />
                <InfoPopover>
                  Die Vorhersagen stammen von Meteomatics aufgrund der Höhe der Auslegerposition des Maschinenstandorts.
                </InfoPopover>
              </div>
              <span className="data-field__value">
                Max {machine.forecast.max72h.toFixed(1)} m/s
              </span>
              <span className="data-field__label">Vorhersage 72h</span>
              <span className="data-field__timestamp">
                Vorhersage von {formatTimestamp(machine.forecast.timestamp)}
              </span>
              {forecastExceedanceTime && (
                <span className="data-field__forecast-exceedance">
                  <AlertTriangle size={11} />
                  Überschreitung erw. {forecastExceedanceTime.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Standort */}
            <div className="data-field">
              <div className="data-field__header">
                <MapPin size={14} className="data-field__icon" />
              </div>
              <span className="data-field__value">{machine.location.shortAddress}</span>
              <span className="data-field__label">Standort</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="machine-card__footer">
        <button className="machine-card__open-btn" onClick={onOpen}>
          <ChevronRight size={14} />
          ÖFFNEN
        </button>
      </div>
    </div>
  );
}
